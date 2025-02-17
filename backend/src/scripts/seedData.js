require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const WorkloadData = require('../models/WorkloadData');

const connectDB = require('../config/database');

const users = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  },
  {
    username: 'developer1',
    email: 'dev1@example.com',
    password: 'dev123',
    role: 'user',
    isActive: true,
  },
  {
    username: 'developer2',
    email: 'dev2@example.com',
    password: 'dev123',
    role: 'user',
    isActive: true,
  },
  {
    username: 'manager1',
    email: 'manager1@example.com',
    password: 'manager123',
    role: 'manager',
    isActive: true,
  },
];

const projects = ['Frontend App', 'Backend API', 'Mobile App', 'Database Migration'];
const taskTypes = ['development', 'bug-fix', 'review', 'meeting', 'documentation'];
const statuses = ['planned', 'in-progress', 'completed', 'blocked'];
const priorities = ['high', 'medium', 'low'];

const generateRandomWorkload = (userId, startDate, endDate) => {
  const workloads = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const numTasks = Math.floor(Math.random() * 3) + 1; // 1-3 tasks per day

    for (let i = 0; i < numTasks; i++) {
      workloads.push({
        developer: userId,
        project: projects[Math.floor(Math.random() * projects.length)],
        taskName: `Task ${Math.floor(Math.random() * 1000)}`,
        taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)],
        hoursSpent: Math.floor(Math.random() * 6) + 2, // 2-8 hours
        date: new Date(currentDate),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        description: 'Sample task description',
        tags: ['sample', 'test'],
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workloads;
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await WorkloadData.deleteMany({});

    // Create users
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return User.create({
          ...user,
          password: hashedPassword,
        });
      })
    );

    console.log('Users created successfully');

    // Generate workload data for the past 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Create workload entries for each user
    const workloadPromises = createdUsers
      .filter((user) => user.role !== 'admin') // Exclude admin from workload data
      .flatMap((user) => generateRandomWorkload(user._id, startDate, endDate));

    await WorkloadData.insertMany(workloadPromises);

    console.log('Workload data created successfully');
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
