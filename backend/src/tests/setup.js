const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let mongoServer;

// Setup MongoDB Memory Server
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Test utilities
const createTestUser = async (userData) => {
  const user = await User.create(userData);
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1h' }
  );
  return { user, token };
};

const createTestAdmin = async () => {
  return createTestUser({
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  });
};

const createTestRegularUser = async () => {
  return createTestUser({
    username: 'user',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
  });
};

// Mock data generators
const generateMockWorkload = (userId, options = {}) => {
  const defaultOptions = {
    project: 'Test Project',
    taskName: 'Test Task',
    taskType: 'development',
    hoursSpent: 4,
    date: new Date(),
    status: 'in-progress',
    priority: 'medium',
    description: 'Test description',
  };

  return {
    developer: userId,
    ...defaultOptions,
    ...options,
  };
};

const generateMockUser = (options = {}) => {
  const defaultOptions = {
    username: `user_${Math.random().toString(36).substring(7)}`,
    email: `test_${Math.random().toString(36).substring(7)}@example.com`,
    password: 'password123',
    role: 'user',
    isActive: true,
  };

  return {
    ...defaultOptions,
    ...options,
  };
};

// Custom Jest matchers
expect.extend({
  toBeValidMongoId(received) {
    const pass = mongoose.Types.ObjectId.isValid(received);
    return {
      message: () =>
        `expected ${received} to be a valid MongoDB ObjectId`,
      pass,
    };
  },
});

// Export test utilities
module.exports = {
  createTestUser,
  createTestAdmin,
  createTestRegularUser,
  generateMockWorkload,
  generateMockUser,
};
