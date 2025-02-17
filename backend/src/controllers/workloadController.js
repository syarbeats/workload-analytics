const WorkloadData = require('../models/WorkloadData');
const { validationResult } = require('express-validator');

// Create new workload entry
const createWorkload = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const workloadData = new WorkloadData({
      ...req.body,
      developer: req.user._id
    });

    await workloadData.save();
    await workloadData.populate('developer', '-password');

    res.status(201).json(workloadData);
  } catch (error) {
    res.status(500).json({ error: 'Error creating workload entry' });
  }
};

// Get workload entries with filtering and pagination
const getWorkloads = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      project,
      status,
      taskType,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Apply filters
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (project) query.project = project;
    if (status) query.status = status;
    if (taskType) query.taskType = taskType;

    // If not admin, only show own workload
    if (req.user.role !== 'admin') {
      query.developer = req.user._id;
    }

    const skip = (page - 1) * limit;

    const workloads = await WorkloadData.find(query)
      .populate('developer', '-password')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WorkloadData.countDocuments(query);

    res.json({
      workloads,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching workload data' });
  }
};

// Get workload statistics
const getWorkloadStats = async (req, res) => {
  try {
    const { startDate, endDate, developerId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // If not admin and trying to view other's stats
    if (req.user.role !== 'admin' && developerId && developerId !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await WorkloadData.getWorkloadStats(
      new Date(startDate),
      new Date(endDate),
      developerId || (req.user.role !== 'admin' ? req.user._id : null)
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching workload statistics' });
  }
};

// Get project summary
const getProjectSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const summary = await WorkloadData.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: '$project',
          totalHours: { $sum: '$hoursSpent' },
          taskCount: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          blockedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          project: '$_id',
          totalHours: 1,
          taskCount: 1,
          completedTasks: 1,
          blockedTasks: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedTasks', '$taskCount'] },
              100
            ]
          }
        }
      },
      { $sort: { totalHours: -1 } }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching project summary' });
  }
};

// Update workload entry
const updateWorkload = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const workload = await WorkloadData.findById(id);
    if (!workload) {
      return res.status(404).json({ error: 'Workload entry not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && workload.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(workload, updates);
    await workload.save();
    await workload.populate('developer', '-password');

    res.json(workload);
  } catch (error) {
    res.status(500).json({ error: 'Error updating workload entry' });
  }
};

// Delete workload entry
const deleteWorkload = async (req, res) => {
  try {
    const { id } = req.params;

    const workload = await WorkloadData.findById(id);
    if (!workload) {
      return res.status(404).json({ error: 'Workload entry not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && workload.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await workload.remove();
    res.json({ message: 'Workload entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting workload entry' });
  }
};

module.exports = {
  createWorkload,
  getWorkloads,
  getWorkloadStats,
  getProjectSummary,
  updateWorkload,
  deleteWorkload
};
