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

const projects = [
  'E-Commerce Platform',
  'Customer Portal',
  'Analytics Dashboard',
  'Mobile App v2.0',
  'API Gateway Migration',
  'Database Optimization',
  'Authentication System',
  'Reporting Module'
];

const taskTypes = ['development', 'bug-fix', 'review', 'meeting', 'documentation', 'other'];
const statuses = ['planned', 'in-progress', 'completed', 'blocked'];
const priorities = ['high', 'medium', 'low'];

const taskTemplates = {
  development: [
    'Implement {feature} functionality',
    'Create new {component} component',
    'Develop {service} service',
    'Add {integration} integration',
    'Build {module} module'
  ],
  'bug-fix': [
    'Fix {issue} in {component}',
    'Resolve {problem} issue',
    'Debug {error} error',
    'Patch {vulnerability} security issue',
    'Fix performance issue in {component}'
  ],
  review: [
    'Code review for {feature}',
    'PR review: {component}',
    'Security review of {module}',
    'Performance review of {service}',
    'Documentation review for {feature}'
  ],
  meeting: [
    'Sprint planning meeting',
    'Daily standup',
    'Technical discussion: {topic}',
    'Project sync with {team}',
    'Retrospective meeting'
  ],
  documentation: [
    'Write documentation for {feature}',
    'Update API docs for {service}',
    'Create user guide for {component}',
    'Document {process} process',
    'Update README for {module}'
  ],
  other: [
    'DevOps setup for {component}',
    'Environment configuration for {service}',
    'Data migration for {module}',
    'Performance optimization of {component}',
    'Security audit of {service}'
  ]
};

const features = [
  'user authentication',
  'payment processing',
  'data visualization',
  'real-time notifications',
  'search functionality',
  'file upload',
  'reporting',
  'dashboard',
  'user management',
  'analytics'
];

const components = [
  'login form',
  'navigation bar',
  'data table',
  'chart component',
  'modal dialog',
  'file uploader',
  'notification system',
  'search bar',
  'user profile',
  'settings panel'
];

const tags = [
  'frontend',
  'backend',
  'database',
  'UI/UX',
  'security',
  'performance',
  'testing',
  'documentation',
  'DevOps',
  'API',
  'mobile',
  'analytics',
  'optimization',
  'bugfix',
  'feature'
];

const blockerTemplates = [
  'Waiting for API endpoint to be ready',
  'Dependency update required',
  'Need clarification from product team',
  'Blocked by {issue}',
  'Pending third-party integration',
  'Environment setup issues',
  'Performance bottleneck identified',
  'Security review pending',
  'Resource constraints',
  'Technical debt needs to be addressed'
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateTaskName = (taskType) => {
  const template = getRandomElement(taskTemplates[taskType]);
  return template
    .replace('{feature}', getRandomElement(features))
    .replace('{component}', getRandomElement(components))
    .replace('{service}', getRandomElement(features))
    .replace('{module}', getRandomElement(features))
    .replace('{integration}', getRandomElement(features))
    .replace('{issue}', getRandomElement(features))
    .replace('{problem}', getRandomElement(components))
    .replace('{error}', getRandomElement(components))
    .replace('{vulnerability}', getRandomElement(components))
    .replace('{topic}', getRandomElement(features))
    .replace('{team}', ['frontend', 'backend', 'DevOps', 'QA'][Math.floor(Math.random() * 4)])
    .replace('{process}', getRandomElement(features));
};

const generateDescription = (taskName, taskType) => {
  const descriptions = {
    development: `Implementing ${taskName.toLowerCase()}. This involves writing clean, maintainable code following our best practices and ensuring proper test coverage.`,
    'bug-fix': `Investigating and fixing ${taskName.toLowerCase()}. This includes root cause analysis, implementing a fix, and adding regression tests.`,
    review: `Conducting ${taskName.toLowerCase()}. Ensuring code quality, performance, and security standards are met.`,
    meeting: `Participating in ${taskName.toLowerCase()}. Discussing project progress, challenges, and next steps.`,
    documentation: `Creating ${taskName.toLowerCase()}. Ensuring comprehensive and clear documentation for future reference.`,
    other: `Working on ${taskName.toLowerCase()}. Following established procedures and best practices.`
  };
  return descriptions[taskType];
};

const generateRandomTags = () => {
  const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags per task
  const selectedTags = new Set();
  while (selectedTags.size < numTags) {
    selectedTags.add(getRandomElement(tags));
  }
  return Array.from(selectedTags);
};

const generateBlocker = (status) => {
  if (status !== 'blocked') return null;
  const blocker = getRandomElement(blockerTemplates);
  return blocker.replace('{issue}', getRandomElement(features));
};

const generateRandomWorkload = (userId, startDate, endDate, allWorkloads = []) => {
  const workloads = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const numTasks = Math.floor(Math.random() * 3) + 1; // 1-3 tasks per day
    const dayWorkloads = [];

    for (let i = 0; i < numTasks; i++) {
      const taskType = getRandomElement(taskTypes);
      const status = getRandomElement(statuses);
      const taskName = generateTaskName(taskType);
      
      const workload = {
        developer: userId,
        project: getRandomElement(projects),
        taskName,
        taskType,
        hoursSpent: Math.floor(Math.random() * 6) + 2, // 2-8 hours
        date: new Date(currentDate),
        status,
        priority: getRandomElement(priorities),
        description: generateDescription(taskName, taskType),
        tags: generateRandomTags(),
        blockers: generateBlocker(status),
        dependencies: []
      };

      // 30% chance to add a dependency to a previous task
      if (allWorkloads.length > 0 && Math.random() < 0.3) {
        const possibleDependencies = allWorkloads.filter(w => 
          w.project === workload.project && 
          w.date < workload.date
        );
        if (possibleDependencies.length > 0) {
          workload.dependencies.push(
            possibleDependencies[Math.floor(Math.random() * possibleDependencies.length)]._id
          );
        }
      }

      dayWorkloads.push(workload);
    }

    // Adjust hours to be more realistic (not exceeding 8-9 hours per day)
    const totalHours = dayWorkloads.reduce((sum, w) => sum + w.hoursSpent, 0);
    if (totalHours > 9) {
      const factor = 9 / totalHours;
      dayWorkloads.forEach(w => {
        w.hoursSpent = Math.round(w.hoursSpent * factor);
      });
    }

    workloads.push(...dayWorkloads);
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
    let allWorkloads = [];
    for (const user of createdUsers.filter(user => user.role !== 'admin')) {
      const userWorkloads = generateRandomWorkload(user._id, startDate, endDate, allWorkloads);
      const savedWorkloads = await WorkloadData.insertMany(userWorkloads);
      allWorkloads.push(...savedWorkloads);
    }

    console.log('Workload data created successfully');
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
