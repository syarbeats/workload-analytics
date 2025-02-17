const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, checkRole, checkUserAccess } = require('../middleware/auth');

// Validation middleware
const userUpdateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('role')
    .optional()
    .isIn(['admin', 'user', 'manager'])
    .withMessage('Invalid role specified'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Routes
// Get all users (admin only)
router.get(
  '/',
  auth,
  checkRole(['admin']),
  userController.getUsers
);

// Get user statistics (admin only)
router.get(
  '/stats',
  auth,
  checkRole(['admin']),
  userController.getUserStats
);

// Get specific user
router.get(
  '/:userId',
  auth,
  checkUserAccess,
  userController.getUserById
);

// Update user
router.put(
  '/:userId',
  auth,
  checkUserAccess,
  userUpdateValidation,
  userController.updateUser
);

// Delete user (admin only)
router.delete(
  '/:userId',
  auth,
  checkRole(['admin']),
  userController.deleteUser
);

module.exports = router;
