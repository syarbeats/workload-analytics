const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const User = require('../models/User');
const WorkloadData = require('../models/WorkloadData');
const jwt = require('jsonwebtoken');

let mongoServer;
let testUser;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create test user
  testUser = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
  });

  // Generate auth token
  authToken = jwt.sign(
    { userId: testUser._id },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await WorkloadData.deleteMany({});
});

describe('Workload Endpoints', () => {
  describe('POST /api/workload', () => {
    const validWorkload = {
      project: 'Test Project',
      taskName: 'Test Task',
      taskType: 'development',
      hoursSpent: 4,
      date: new Date().toISOString(),
      status: 'in-progress',
      priority: 'medium',
      description: 'Test description',
    };

    it('should create a new workload entry', async () => {
      const res = await request(app)
        .post('/api/workload')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validWorkload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('project', validWorkload.project);
      expect(res.body).toHaveProperty('developer', testUser._id.toString());
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/workload')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          project: 'Test Project',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/workload')
        .send(validWorkload);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/workload', () => {
    beforeEach(async () => {
      // Create some test workload entries
      await WorkloadData.create([
        {
          developer: testUser._id,
          project: 'Project 1',
          taskName: 'Task 1',
          taskType: 'development',
          hoursSpent: 4,
          date: new Date(),
          status: 'completed',
          priority: 'high',
        },
        {
          developer: testUser._id,
          project: 'Project 2',
          taskName: 'Task 2',
          taskType: 'bug-fix',
          hoursSpent: 2,
          date: new Date(),
          status: 'in-progress',
          priority: 'medium',
        },
      ]);
    });

    it('should get workload entries for authenticated user', async () => {
      const res = await request(app)
        .get('/api/workload')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.workloads).toHaveLength(2);
      expect(res.body).toHaveProperty('pagination');
    });

    it('should filter workload entries by project', async () => {
      const res = await request(app)
        .get('/api/workload')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ project: 'Project 1' });

      expect(res.statusCode).toBe(200);
      expect(res.body.workloads).toHaveLength(1);
      expect(res.body.workloads[0]).toHaveProperty('project', 'Project 1');
    });

    it('should filter workload entries by status', async () => {
      const res = await request(app)
        .get('/api/workload')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'completed' });

      expect(res.statusCode).toBe(200);
      expect(res.body.workloads).toHaveLength(1);
      expect(res.body.workloads[0]).toHaveProperty('status', 'completed');
    });
  });

  describe('GET /api/workload/stats', () => {
    beforeEach(async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      await WorkloadData.create([
        {
          developer: testUser._id,
          project: 'Project 1',
          taskName: 'Task 1',
          taskType: 'development',
          hoursSpent: 4,
          date: new Date(),
          status: 'completed',
          priority: 'high',
        },
        {
          developer: testUser._id,
          project: 'Project 1',
          taskName: 'Task 2',
          taskType: 'development',
          hoursSpent: 6,
          date: startDate,
          status: 'completed',
          priority: 'medium',
        },
      ]);
    });

    it('should get workload statistics', async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const res = await request(app)
        .get('/api/workload/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('workloadByType');
      expect(res.body[0].workloadByType[0]).toHaveProperty('totalHours');
    });

    it('should require date range', async () => {
      const res = await request(app)
        .get('/api/workload/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/workload/:id', () => {
    let workloadId;

    beforeEach(async () => {
      const workload = await WorkloadData.create({
        developer: testUser._id,
        project: 'Project 1',
        taskName: 'Task 1',
        taskType: 'development',
        hoursSpent: 4,
        date: new Date(),
        status: 'in-progress',
        priority: 'high',
      });
      workloadId = workload._id;
    });

    it('should update workload entry', async () => {
      const res = await request(app)
        .put(`/api/workload/${workloadId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed',
          hoursSpent: 6,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'completed');
      expect(res.body).toHaveProperty('hoursSpent', 6);
    });

    it('should not update workload of another user', async () => {
      const otherUser = await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
      });

      const otherWorkload = await WorkloadData.create({
        developer: otherUser._id,
        project: 'Other Project',
        taskName: 'Other Task',
        taskType: 'development',
        hoursSpent: 4,
        date: new Date(),
        status: 'in-progress',
        priority: 'high',
      });

      const res = await request(app)
        .put(`/api/workload/${otherWorkload._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed',
        });

      expect(res.statusCode).toBe(403);
    });
  });
});
