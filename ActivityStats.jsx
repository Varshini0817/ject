import React, { useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button, Paper } from '@mui/material';
import axios from 'axios';
import {
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar,
} from 'recharts';

const ACTIVITIES = [
  "Running",
  "Cycling",
  "Skipping",
  "Walking",
  "Gym",
  "Hiking",
  "Yoga"
];

const CHART_TYPES = [
  {value:"", label: "Select Chart Type"},
  {value: 'pie', label: 'Pie Chart'},
  {value: 'line', label: 'Line Graph'},
  {value: 'bar', label: 'Bar Graph'},
  {value: 'other', label: 'Other'},
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function ActivityStats({ username }) {
  const [activity, setActivity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setError(null);
    setIsLoading(true);

    if (!activity || !startDate || !endDate) {
      setError('Please select activity and date range.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/user/stats/${encodeURIComponent(username)}/${encodeURIComponent(activity)}`,
        {
          params: {
            startDate,
            endDate
          }
        }
      );
      const data = response.data;
      // Check if all important stats fields are zero or missing to determine no data
      const noData =
        !data ||
        (data.totalDuration === 0 &&
         data.totalDistance === 0 &&
         data.totalSteps === 0 &&
         data.totalCalories === 0);

      if (noData) {
        setError('No data found for the selected time period.');
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error fetching statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for Pie chart
  const getPieData = () => [
    { name: 'Duration (min)', value: stats.totalDuration },
    { name: 'Distance (km)', value: stats.totalDistance },
    { name: 'Steps', value: stats.totalSteps },
    { name: 'Calories', value: stats.totalCalories },
  ];

  // Prepare data for Line and Bar charts
  const getLineBarData = () => {
    return [
      {
        name: 'Stats',
        Duration: stats.totalDuration,
        Distance: stats.totalDistance,
        Steps: stats.totalSteps,
        Calories: stats.totalCalories,
      }
    ];
  };

  const getRadarData = () => [
    { subject: 'Duration', A: stats.totalDuration, fullMark: 100 },
    { subject: 'Distance', A: stats.totalDistance, fullMark: 100 },
    { subject: 'Steps', A: stats.totalSteps, fullMark: 100 },
    { subject: 'Calories', A: stats.totalCalories, fullMark: 100 },
  ];

  const getAreaData = () => {
    // Same as line/bar data; one point with multiple keys
    return getLineBarData();
  };

  const renderChart = () => {
    if (!stats) return null;

    switch(chartType) {
      case 'pie':
        return (
          <PieChart width={400} height={300}>
            <Pie
              data={getPieData()}
              cx={200}
              cy={150}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {getPieData().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      case 'line':
        return (
          <LineChart width={500} height={300} data={getLineBarData()}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="Duration" stroke="#8884d8" />
            <Line type="monotone" dataKey="Distance" stroke="#82ca9d" />
            <Line type="monotone" dataKey="Steps" stroke="#ff7300" />
            <Line type="monotone" dataKey="Calories" stroke="#a83232" />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart width={500} height={300} data={getLineBarData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Duration" fill="#8884d8" />
            <Bar dataKey="Distance" fill="#82ca9d" />
            <Bar dataKey="Steps" fill="#ff7300" />
            <Bar dataKey="Calories" fill="#a83232" />
          </BarChart>
        );
      case 'other':
      default:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography><strong>Activity:</strong> {stats.activity}</Typography>
            <Typography><strong>Duration:</strong> {stats.totalDuration} mins</Typography>
            <Typography><strong>Distance:</strong> {stats.totalDistance} kms</Typography>
            <Typography><strong>Steps:</strong> {stats.totalSteps}</Typography>
            <Typography><strong>Calories Burned:</strong> {stats.totalCalories}</Typography>
            <Typography><em>From {stats.startDate} to {stats.endDate}</em></Typography>
          </Box>
        );
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Activity Statistics
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Activity</InputLabel>
          <Select
            value={activity}
            label="Activity"
            onChange={(e) => setActivity(e.target.value)}
          >
            <MenuItem value="">
              <em>Select Activity</em>
            </MenuItem>
            {ACTIVITIES.map((a) => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
          inputProps={{ max: new Date().toISOString().slice(0, 10) }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
          inputProps={{ max: new Date().toISOString().slice(0, 10) }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Chart Type</InputLabel>
          <Select
            value={chartType}
            label="Chart Type"
            onChange={(e) => setChartType(e.target.value)}
          >
            {CHART_TYPES.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={fetchStats} sx={{ minWidth: 150 }} disabled={isLoading}>
          {isLoading ? "Loading..." : "Get Stats"}
        </Button>
      </Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {renderChart()}
    </Paper>
  );
}

export default ActivityStats;
