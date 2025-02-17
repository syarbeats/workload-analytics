const mongoose = require('mongoose');

const workloadDataSchema = new mongoose.Schema({
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: String,
    required: true,
    trim: true
  },
  taskName: {
    type: String,
    required: true,
    trim: true
  },
  taskType: {
    type: String,
    required: true,
    enum: ['development', 'bug-fix', 'review', 'meeting', 'documentation', 'other']
  },
  hoursSpent: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['planned', 'in-progress', 'completed', 'blocked'],
    default: 'planned'
  },
  priority: {
    type: String,
    required: true,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  description: {
    type: String,
    trim: true
  },
  blockers: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkloadData'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
workloadDataSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for better query performance
workloadDataSchema.index({ developer: 1, date: -1 });
workloadDataSchema.index({ project: 1 });
workloadDataSchema.index({ status: 1 });
workloadDataSchema.index({ taskType: 1 });

// Static method to get workload statistics
workloadDataSchema.statics.getWorkloadStats = async function(startDate, endDate, developerId) {
  const match = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (developerId) {
    match.developer = mongoose.Types.ObjectId(developerId);
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          developer: '$developer',
          taskType: '$taskType'
        },
        totalHours: { $sum: '$hoursSpent' },
        taskCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.developer',
        workloadByType: {
          $push: {
            taskType: '$_id.taskType',
            totalHours: '$totalHours',
            taskCount: '$taskCount'
          }
        },
        totalHours: { $sum: '$totalHours' }
      }
    },
    { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'developer'
    }},
    { $unwind: '$developer' },
    {
      $project: {
        'developer.password': 0,
        'developer.__v': 0
      }
    }
  ]);
};

const WorkloadData = mongoose.model('WorkloadData', workloadDataSchema);

module.exports = WorkloadData;
