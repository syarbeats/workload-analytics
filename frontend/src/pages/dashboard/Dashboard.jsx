import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    workloadStats: [],
    projectSummary: [],
    tasksByStatus: [],
    tasksByPriority: [],
  });

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        const [workloadStats, projectSummary] = await Promise.all([
          axios.get(`/api/workload/stats?startDate=${startDate}&endDate=${endDate}`),
          axios.get(`/api/workload/project-summary?startDate=${startDate}&endDate=${endDate}`),
        ]);

        // Process data for charts
        const taskStatusData = processTaskStatusData(workloadStats.data);
        const taskPriorityData = processTaskPriorityData(workloadStats.data);

        setDashboardData({
          workloadStats: workloadStats.data,
          projectSummary: projectSummary.data,
          tasksByStatus: taskStatusData,
          tasksByPriority: taskPriorityData,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const processTaskStatusData = (data) => {
    const statusCount = {
      'in-progress': 0,
      completed: 0,
      blocked: 0,
      planned: 0,
    };

    data.forEach((dev) => {
      dev.workloadByType.forEach((workload) => {
        statusCount[workload.status] = (statusCount[workload.status] || 0) + workload.taskCount;
      });
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  const processTaskPriorityData = (data) => {
    const priorityCount = {
      high: 0,
      medium: 0,
      low: 0,
    };

    data.forEach((dev) => {
      dev.workloadByType.forEach((workload) => {
        priorityCount[workload.priority] = (priorityCount[workload.priority] || 0) + workload.taskCount;
      });
    });

    return Object.entries(priorityCount).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Project Summary */}
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Project Overview
          </Typography>
        </Grid>

        {dashboardData.projectSummary.map((project) => (
          <Grid item xs={12} md={4} key={project.project}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {project.project}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Hours: {project.totalHours}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tasks: {project.taskCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion Rate: {project.completionRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Task Status Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tasks by Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.tasksByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {dashboardData.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Task Priority Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tasks by Priority
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.tasksByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Tasks" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
