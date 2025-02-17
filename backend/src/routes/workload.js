const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const workloadController = require('../controllers/workloadController');
const { auth, checkRole } = require('../middleware/auth');

// Validation middleware
const workloadCreateValidation = [
  body('project')
    .trim()
    .notEmpty()
    .withMessage('Project name is required'),
  body('taskName')
    .trim()
    .notEmpty()
    .withMessage('Task name is required'),
  body('taskType')
    .isIn(['development', 'bug-fix', 'review', 'meeting', 'documentation', 'other'])
    .withMessage('Invalid task type'),
  body('hoursSpent')
    .isFloat({ min: 0 })
    .withMessage('Hours spent must be a positive number'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .isIn(['planned', 'in-progress', 'completed', 'blocked'])
    .withMessage('Invalid status'),
  body('priority')
    .isIn(['high', 'medium', 'low'])
    .withMessage('Invalid priority level')
];

const workloadUpdateValidation = [
  body('project')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty'),
  body('taskName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task name cannot be empty'),
  body('taskType')
    .optional()
    .isIn(['development', 'bug-fix', 'review', 'meeting', 'documentation', 'other'])
    .withMessage('Invalid task type'),
  body('hoursSpent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hours spent must be a positive number'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('status')
    .optional()
    .isIn(['planned', 'in-progress', 'completed', 'blocked'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Invalid priority level')
];

const dateRangeValidation = [
  query('startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .isISO8601()
    .withMessage('Invalid end date format')
];

// Routes
// Create workload entry
router.post(
  '/',
  auth,
  workloadCreateValidation,
  workloadController.createWorkload
);

// Get workload entries with filtering
router.get(
  '/',
  auth,
  workloadController.getWorkloads
);

// Get workload statistics
router.get(
  '/stats',
  auth,
  dateRangeValidation,
  workloadController.getWorkloadStats
);

// Get project summary
router.get(
  '/project-summary',
  auth,
  dateRangeValidation,
  workloadController.getProjectSummary
);

// Update workload entry
router.put(
  '/:id',
  auth,
  workloadUpdateValidation,
  workloadController.updateWorkload
);

// Delete workload entry
router.delete(
  '/:id',
  auth,
  workloadController.deleteWorkload
);

module.exports = router;
