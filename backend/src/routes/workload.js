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

/**
 * @swagger
 * /api/workload:
 *   post:
 *     summary: Create a new workload entry
 *     tags: [Workload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project
 *               - taskName
 *               - taskType
 *               - hoursSpent
 *               - date
 *               - status
 *               - priority
 *             properties:
 *               project:
 *                 type: string
 *               taskName:
 *                 type: string
 *               taskType:
 *                 type: string
 *                 enum: [development, bug-fix, review, meeting, documentation, other]
 *               hoursSpent:
 *                 type: number
 *                 minimum: 0
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [planned, in-progress, completed, blocked]
 *               priority:
 *                 type: string
 *                 enum: [high, medium, low]
 *     responses:
 *       201:
 *         description: Workload entry created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post(
  '/',
  auth,
  workloadCreateValidation,
  workloadController.createWorkload
);

/**
 * @swagger
 * /api/workload:
 *   get:
 *     summary: Get workload entries with optional filtering
 *     tags: [Workload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, in-progress, completed, blocked]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of workload entries
 *       401:
 *         description: Not authorized
 */
router.get(
  '/',
  auth,
  workloadController.getWorkloads
);

/**
 * @swagger
 * /api/workload/stats:
 *   get:
 *     summary: Get workload statistics
 *     tags: [Workload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Workload statistics
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Not authorized
 */
router.get(
  '/stats',
  auth,
  dateRangeValidation,
  workloadController.getWorkloadStats
);

/**
 * @swagger
 * /api/workload/project-summary:
 *   get:
 *     summary: Get project summary
 *     tags: [Workload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for summary
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for summary
 *     responses:
 *       200:
 *         description: Project summary data
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Not authorized
 */
router.get(
  '/project-summary',
  auth,
  dateRangeValidation,
  workloadController.getProjectSummary
);

/**
 * @swagger
 * /api/workload/{id}:
 *   put:
 *     summary: Update a workload entry
 *     tags: [Workload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workload entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project:
 *                 type: string
 *               taskName:
 *                 type: string
 *               taskType:
 *                 type: string
 *                 enum: [development, bug-fix, review, meeting, documentation, other]
 *               hoursSpent:
 *                 type: number
 *                 minimum: 0
 *               date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [planned, in-progress, completed, blocked]
 *               priority:
 *                 type: string
 *                 enum: [high, medium, low]
 *     responses:
 *       200:
 *         description: Workload entry updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Workload entry not found
 */
router.put(
  '/:id',
  auth,
  workloadUpdateValidation,
  workloadController.updateWorkload
);

/**
 * @swagger
 * /api/workload/{id}:
 *   delete:
 *     summary: Delete a workload entry
 *     tags: [Workload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workload entry ID
 *     responses:
 *       200:
 *         description: Workload entry deleted successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Workload entry not found
 */
router.delete(
  '/:id',
  auth,
  workloadController.deleteWorkload
);

module.exports = router;
