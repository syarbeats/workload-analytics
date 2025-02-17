import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const WorkloadAnalytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    developer: '',
    project: '',
    taskType: '',
  });
  const [analyticsData, setAnalyticsData] = useState({
    timelineData: [],
    workloadByType: [],
    developers: [],
    projects: [],
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [workloadStats, developers, projects] = await Promise.all([
        axios.get('/api/workload/stats', {
          params: {
            startDate: filters.startDate.toISOString(),
            endDate: filters.endDate.toISOString(),
            developerId: filters.developer,
          },
        }),
        axios.get('/api/users'),
        axios.get('/api/workload', {
          params: {
            startDate: filters.startDate.toISOString(),
            endDate: filters.endDate.toISOString(),
          },
        }),
      ]);

      const timelineData = processTimelineData(workloadStats.data);
      const workloadByType = processWorkloadByType(workloadStats.data);

      setAnalyticsData({
        timelineData,
        workloadByType,
        developers: developers.data.users,
        projects: [...new Set(projects.data.workloads.map((w) => w.project))],
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processTimelineData = (data) => {
    const timelineMap = new Map();

    data.forEach((dev) => {
      dev.workloadByType.forEach((workload) => {
        const date = new Date(workload.date).toLocaleDateString();
        const current = timelineMap.get(date) || { date, totalHours: 0 };
        current.totalHours += workload.totalHours;
        timelineMap.set(date, current);
      });
    });

    return Array.from(timelineMap.values()).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  const processWorkloadByType = (data) => {
    const typeMap = new Map();

    data.forEach((dev) => {
      dev.workloadByType.forEach((workload) => {
        const current = typeMap.get(workload.taskType) || {
          type: workload.taskType,
          hours: 0,
          tasks: 0,
        };
        current.hours += workload.totalHours;
        current.tasks += workload.taskCount;
        typeMap.set(workload.taskType, current);
      });
    });

    return Array.from(typeMap.values());
  };

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleDateChange = (field) => (date) => {
    setFilters((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleApplyFilters = () => {
    fetchAnalyticsData();
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
        {/* Filters */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={handleDateChange('startDate')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={handleDateChange('endDate')}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Developer</InputLabel>
                  <Select
                    value={filters.developer}
                    onChange={handleFilterChange('developer')}
                    label="Developer"
                  >
                    <MenuItem value="">All Developers</MenuItem>
                    {analyticsData.developers.map((dev) => (
                      <MenuItem key={dev._id} value={dev._id}>
                        {dev.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={filters.project}
                    onChange={handleFilterChange('project')}
                    label="Project"
                  >
                    <MenuItem value="">All Projects</MenuItem>
                    {analyticsData.projects.map((project) => (
                      <MenuItem key={project} value={project}>
                        {project}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Timeline Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Workload Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={analyticsData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="totalHours"
                  name="Hours"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.light}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Workload by Type Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Workload by Type
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.workloadByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="hours"
                  name="Hours"
                  stroke={theme.palette.primary.main}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tasks"
                  name="Tasks"
                  stroke={theme.palette.secondary.main}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkloadAnalytics;
