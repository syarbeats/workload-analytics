const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

let mongoServer;
let adminUser;
let regularUser;
let adminToken;
let userToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create admin user
  adminUser = await User.create({
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  });

  // Create regular user
  regularUser = await User.create({
    username: 'user',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
  });

  // Generate tokens
  adminToken = jwt.sign(
    { userId: adminUser._id },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1h' }
  );

  userToken = jwt.sign(
    { userId: regularUser._id },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Management Endpoints', () => {
  describe('GET /api/users', () => {
    beforeEach(async () => {
      // Clear users except admin and regular test users
      await User.deleteMany({
        _id: { $nin: [adminUser._id, regularUser._id] },
      });
    });

    it('should allow admin to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.users).toHaveLength(2);
      expect(res.body.users[0]).not.toHaveProperty('password');
    });

    it('should not allow regular user to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should support pagination and search', async () => {
      // Create additional test users
      await User.create([
        {
          username: 'test1',
          email: 'test1@example.com',
          password: 'password',
          role: 'user',
        },
        {
          username: 'test2',
          email: 'test2@example.com',
          password: 'password',
          role: 'user',
        },
      ]);

      const res = await request(app)
        .get('/api/users')
        .query({ page: 1, limit: 2, search: 'test' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.users).toHaveLength(2);
      expect(res.body.pagination.total).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:userId', () => {
    it('should allow admin to get any user', async () => {
      const res = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', regularUser.username);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should allow users to get their own profile', async () => {
      const res = await request(app)
        .get(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', regularUser.username);
    });

    it('should not allow users to get other profiles', async () => {
      const res = await request(app)
        .get(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('should allow admin to update any user', async () => {
      const res = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updateduser',
          role: 'manager',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', 'updateduser');
      expect(res.body).toHaveProperty('role', 'manager');
    });

    it('should allow users to update their own profile', async () => {
      const res = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          username: 'newusername',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', 'newusername');
    });

    it('should not allow users to update their role', async () => {
      const res = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'admin',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('role', 'user'); // Role should remain unchanged
    });

    it('should validate unique email', async () => {
      const res = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: adminUser.email, // Try to use existing email
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/users/:userId', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testdelete',
        email: 'testdelete@example.com',
        password: 'password123',
        role: 'user',
      });
    });

    it('should allow admin to delete users', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should not allow regular users to delete accounts', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUser._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should not allow deleting the last admin', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users/stats', () => {
    beforeEach(async () => {
      // Create additional test users with different roles and statuses
      await User.create([
        {
          username: 'active1',
          email: 'active1@example.com',
          password: 'password',
          role: 'user',
          isActive: true,
        },
        {
          username: 'inactive1',
          email: 'inactive1@example.com',
          password: 'password',
          role: 'user',
          isActive: false,
        },
        {
          username: 'manager1',
          email: 'manager1@example.com',
          password: 'password',
          role: 'manager',
          isActive: true,
        },
      ]);
    });

    it('should return user statistics for admin', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('activeUsers');
      expect(res.body).toHaveProperty('roleDistribution');
      expect(res.body.roleDistribution).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: expect.any(String),
            count: expect.any(Number),
            activeUsers: expect.any(Number),
          }),
        ])
      );
    });

    it('should not allow non-admin users to access statistics', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
