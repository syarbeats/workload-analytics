import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
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
} from 'recharts';
import axios from 'axios';

const ProjectSummary = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState({
    projects: [],
    totalHours: 0,
    totalTasks: 0,
    averageCompletion: 0,
  });

  useEffect(() => {
    fetchProjectSummary();
  }, []);

  const fetchProjectSummary = async () => {
    try {
      setLoading(true);
      const startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
      const endDate = new Date().toISOString();

      const response = await axios.get('/api/workload/project-summary', {
        params: { startDate, endDate },
      });

      const projects = response.data;
      const totalHours = projects.reduce((sum, p) => sum + p.totalHours, 0);
      const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0);
      const averageCompletion = projects.reduce((sum, p) => sum + p.completionRate, 0) / projects.length;

      setSummaryData({
        projects,
        totalHours,
        totalTasks,
        averageCompletion,
      });
    } catch (error) {
      console.error('Error fetching project summary:', error);
      setError('Failed to load project summary');
    } finally {
      setLoading(false);
    }
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
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Hours
              </Typography>
              <Typography variant="h4">
                {summaryData.totalHours.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Tasks
              </Typography>
              <Typography variant="h4">
                {summaryData.totalTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Completion
              </Typography>
              <Typography variant="h4">
                {summaryData.averageCompletion.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Project Hours Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Hours Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={summaryData.projects}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="project" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalHours"
                  name="Total Hours"
                  fill={theme.palette.primary.main}
                />
                <Bar
                  dataKey="taskCount"
                  name="Task Count"
                  fill={theme.palette.secondary.main}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Detailed Project Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Hours</TableCell>
                  <TableCell align="right">Tasks</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Blocked</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryData.projects.map((project) => (
                  <TableRow key={project.project}>
                    <TableCell component="th" scope="row">
                      {project.project}
                    </TableCell>
                    <TableCell align="right">
                      {project.totalHours.toFixed(1)}
                    </TableCell>
                    <TableCell align="right">{project.taskCount}</TableCell>
                    <TableCell align="right">{project.completedTasks}</TableCell>
                    <TableCell align="right">{project.blockedTasks}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={project.completionRate}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                            }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {`${project.completionRate.toFixed(1)}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectSummary;
