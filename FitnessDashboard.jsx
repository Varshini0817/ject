import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "../../features/userProfileSlice";
import {
  Box,
  CssBaseline,
  Avatar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Card,
  CardContent,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";

import ActivityStats from "../../components/ActivityStats";

import HomeIcon from "@mui/icons-material/Home";
import FlagIcon from "@mui/icons-material/Flag";
import EventIcon from "@mui/icons-material/Event";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";

import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import HikingIcon from "@mui/icons-material/Elderly";  // Use Elderly icon for Hiking as a close alternative
import SportsGymnasticsIcon from "@mui/icons-material/SportsGymnastics";  // For Yoga
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

const activityIconsColors = {
  Running: { icon: <DirectionsRunIcon />, color: "#00c9ff" },
  Cycling: { icon: <DirectionsBikeIcon />, color: "#0091ff" },
  Skipping: { icon: <DirectionsRunIcon />, color: "#ff914d" },
  Walking: { icon: <DirectionsWalkIcon />, color: "#1abc9c" },
  Gym: { icon: <FitnessCenterIcon />, color: "#92fe9d" },
  Hiking: { icon: <HikingIcon />, color: "#ffa07a" },
  Yoga: { icon: <SportsGymnasticsIcon />, color: "#c39bd3" },
};

// MET values for activities to estimate calories burned
const activityMET = {
  running: 9.8,
  cycling: 7.5,
  skipping: 8.0, // approximate
  walking: 3.5,
  gym: 6,
  hiking: 6,
  yoga: 3,
};

const FitnessDashboard = ({ username }) => {
  const dispatch = useDispatch();
  const { profile: userProfile, loading, error } = useSelector((state) => state.userProfile);
  const [selectedActivity, setSelectedActivity] = useState("Running");
  const [selectedFrequency, setSelectedFrequency] = useState("monthly");

  useEffect(() => {
    if (username) {
      dispatch(fetchUserProfile(username));
    }
  }, [username, dispatch]);

  const selectedActivityKey = selectedActivity.toLowerCase();

  // Helper function to aggregate data by frequency
  const aggregateByFrequency = (activities, frequency) => {
    const groups = {};

    activities.forEach(activity => {
      let key;
      const date = new Date(activity.date || Date.now());

      switch (frequency) {
        case "daily":
          key = date.toISOString().slice(0, 10); // YYYY-MM-DD
          break;
        case "weekly": {
          const firstDayOfWeek = new Date(date);
          const day = firstDayOfWeek.getDay() || 7; // Sunday=0 in JS, make Sunday=7
          firstDayOfWeek.setDate(date.getDate() - day + 1); // Monday start
          key = firstDayOfWeek.toISOString().slice(0, 10);
          break;
        }
        case "monthly":
        default:
          key = `${date.getFullYear()}-${date.getMonth() + 1}`; // YYYY-M
          break;
      }

      if (!groups[key]) {
        groups[key] = {
          duration: 0,
          steps: 0,
          distance: 0,
          count: 0,
        };
      }
      groups[key].duration += activity.duration || 0;
      groups[key].steps += activity.steps || 0;
      groups[key].distance += activity.distance || 0;
      groups[key].count += 1;
    });

    // Convert groups to array
    return Object.entries(groups).map(([key, vals]) => ({
      name: key,
      duration: vals.duration,
      steps: vals.steps,
      distance: vals.distance,
      count: vals.count,
    }));
  };

  const filteredActivities = (userProfile?.activities || []).filter(
    (a) => a.activity.toLowerCase() === selectedActivityKey
  );

  // Aggregate by selected frequency
  const aggregatedData = aggregateByFrequency(filteredActivities, selectedFrequency);

  const chartData = aggregatedData.length > 0 ? aggregatedData : [
    { name: "Period 1", duration: 30, steps: 5000, distance: 4 },
    { name: "Period 2", duration: 45, steps: 7000, distance: 6 },
  ];

  // Stats calculation should use aggregatedData grouped by frequency for accurate avg
  const calculateStats = () => {
    if (!aggregatedData || aggregatedData.length === 0) {
      return {
        totalDuration: 0,
        avgDuration: 0,
        totalSteps: 0,
        avgSteps: 0,
        totalDistance: 0,
        avgDistance: 0,
        caloriesBurned: 0,
      };
    }

    const totalDuration = aggregatedData.reduce((sum, grp) => sum + (grp.duration || 0), 0);
    const totalSteps = aggregatedData.reduce((sum, grp) => sum + (grp.steps || 0), 0);
    const totalDistance = aggregatedData.reduce((sum, grp) => sum + (grp.distance || 0), 0);

    const avgDuration = totalDuration / aggregatedData.length;
    const avgSteps = totalSteps / aggregatedData.length;
    const avgDistance = totalDistance / aggregatedData.length;

    const userWeight = userProfile?.weight || 70;
    const met = activityMET[selectedActivityKey] || 6;
    const totalDurationHours = totalDuration / 60;
    const caloriesBurned = Math.round(met * userWeight * totalDurationHours);

    return {
      totalDuration,
      avgDuration,
      totalSteps,
      avgSteps,
      totalDistance,
      avgDistance,
      caloriesBurned,
    };
  };

  const stats = calculateStats();

  // Determine if selected activity has steps data to conditionally render steps card
  const hasSteps = (filteredActivities.some((a) => a.steps && a.steps > 0));

  const getGoalStat = (statKey) => {
    if (!userProfile || !userProfile.goals) return "-";
    const goal = userProfile.goals.find(
      (g) => g.activity.toLowerCase() === selectedActivityKey
    );
    if (!goal) return "-";
    if (statKey === "duration") return goal.duration ? `${goal.duration} mins` : "-";
    if (statKey === "steps") return goal.steps ? `${goal.steps} steps` : "-";
    if (statKey === "distance") return goal.distance ? `${goal.distance} km` : "-";
    return "-";
  };

  const userAge = userProfile?.age || 28;
  const userHeight = userProfile?.height || 185;
  const userWeight = userProfile?.weight || 76;

  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#eef2fb",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
          overflowX: "auto",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1100,
            minHeight: "80vh",
            bgcolor: "white",
            borderRadius: 3,
            boxShadow: 4,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            overflow: "hidden",
          }}
        >
          {/* LEFT SIDEBAR */}
          <Box
            sx={{
              width: { xs: "100%", md: 260 },
              bgcolor: "#f7f7ff",
              borderRight: { xs: "none", md: "1px solid #ecebff" },
              borderBottom: { xs: "1px solid #ecebff", md: "none" },
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "center", md: "flex-start" },
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 3, color: "#2f3c7f" }}
            >
              TRACK{" "}
              <span style={{ color: "#00c9ff", whiteSpace: "nowrap" }}>
                FITNESS
              </span>
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              mb={2}
              justifyContent={{ xs: "center", md: "flex-start" }}
            >
              <Avatar
                src={`https://i.pravatar.cc/150?u=${username}`}
                sx={{ width: 54, height: 54 }}
              />
              <Box>
                <Typography fontWeight={600}>{username}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Male, {userAge} years
                </Typography>
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ cursor: "pointer" }}
                  onClick={() => alert("Edit profile clicked!")}
                >
                  Edit profile
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={3}
              mb={3}
              justifyContent={{ xs: "center", md: "flex-start" }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  HEIGHT
                </Typography>
                <Typography fontWeight={600}>{userHeight} cm</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  WEIGHT
                </Typography>
                <Typography fontWeight={600}>{userWeight} kg</Typography>
              </Box>
            </Stack>

            <List dense sx={{ width: "100%" }}>
              {[
                { icon: <HomeIcon />, label: "Home" },
                { icon: <FlagIcon />, label: "My goals" },
                { icon: <EventIcon />, label: "Schedule" },
                { icon: <EmojiEventsIcon />, label: "Achievements" },
                { icon: <BarChartIcon />, label: "Statistics" },
                { icon: <SettingsIcon />, label: "Settings" },
              ].map((item, idx) => (
                <ListItemButton
                  key={item.label}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    ...(idx === 0 && {
                      bgcolor: "white",
                      boxShadow: 1,
                    }),
                  }}
                  onClick={() => alert(`Navigate to ${item.label}`)}
                >
                  <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <Card
              sx={{
                bgcolor: "#00c9ff",
                backgroundImage: "linear-gradient(135deg,#00c9ff,#92fe9d)",
                color: "white",
                borderRadius: 3,
                boxShadow: 3,
                mt: 2,
              }}
            >
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600}>
                  CONGRATULATIONS!
                </Typography>
                <Typography variant="body2">
                  You have unlocked the <b>Expert</b> level.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* MAIN AREA */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              display: "flex",
              flexDirection: "column",
              minHeight: "auto",
            }}
          >
            {/* Top bar */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  DAY 2, WEEK 6
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton size="small">
                    <ArrowBackIosNewIcon fontSize="inherit" />
                  </IconButton>
                  <Typography fontWeight={600}>Today, 7th June, 2018</Typography>
                  <IconButton size="small">
                    <ArrowForwardIosIcon fontSize="inherit" />
                  </IconButton>
                </Stack>
              </Box>

              <IconButton>
                <NotificationsNoneIcon />
              </IconButton>
            </Box>

            {/* Goal title */}
            <Typography variant="overline" color="primary">
              GOAL
            </Typography>
            <Typography variant="h5" fontWeight={700} mb={2}>
              {userProfile?.goals?.length > 0
                ? userProfile.goals[0].activity
                : "Build Muscles"}
            </Typography>

            {/* Frequency selector UI near activity chips */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              mb={2}
              flexWrap="wrap"
              sx={{ overflowX: "auto" }}
            >
              <Typography variant="caption" color="text.secondary" mr={1}>
                Frequency
              </Typography>
              {["daily", "weekly", "monthly"].map((freq) => (
                <Chip
                  key={freq}
                  label={freq.charAt(0).toUpperCase() + freq.slice(1)}
                  size="small"
                  clickable
                  color={selectedFrequency === freq ? "primary" : "default"}
                  onClick={() => setSelectedFrequency(freq)}
                  sx={{
                    fontWeight: selectedFrequency === freq ? 700 : 400,
                    textTransform: 'capitalize',
                  }}
                />
              ))}
            </Stack>

            {/* Activity chips */}
            <Stack
              direction="row"
              spacing={1}
              mt={1}
              justifyContent="center"
              sx={{ overflowX: "auto" }}
            >
              {(userProfile?.activities
                ? [
                    ...new Set(
                      userProfile.activities.map((a) => {
                        const act = a.activity.trim();
                        return (
                          act.charAt(0).toUpperCase() +
                          act.slice(1).toLowerCase()
                        );
                      })
                    ),
                  ]
                : []
              ).map((activityKey) => (
                <Chip
                  key={activityKey}
                  label={activityKey}
                  size="small"
                  clickable
                  color={
                    selectedActivity === activityKey ? "primary" : "default"
                  }
                  onClick={() => setSelectedActivity(activityKey)}
                  sx={{
                    fontWeight:
                      selectedActivity === activityKey ? 700 : 400,
                  }}
                />
              ))}
            </Stack>

            {/* Chart section */}
            <Box
              sx={{
                flex: 1,
                borderRadius: 3,
                bgcolor: "#f9f9ff",
                p: 2.5,
                boxShadow: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography fontWeight={600}>
                  STATISTICS - Last{" "}
                  {selectedFrequency.charAt(0).toUpperCase() +
                    selectedFrequency.slice(1)}
                </Typography>
                <Button size="small">Detailed view</Button>
              </Stack>

              <Box sx={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.length > 0 ? chartData : []}
                    margin={{ top: 10, right: 0 }}
                  >
                    <XAxis dataKey="name" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="duration"
                      stroke="#00c9ff"
                      fill="#00c9ff33"
                    />
                    <Area
                      type="monotone"
                      dataKey="steps"
                      stroke="#ff6b6b"
                      fill="#ff6b6b33"
                    />
                    <Area
                      type="monotone"
                      dataKey="distance"
                      stroke="#4caf50"
                      fill="#4caf5033"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

            {/* Dynamic statistics display as Cards */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  overflowX: "auto",
                  py: 1,
                  px: 0.5,
                  width: "100%",
                  scrollbarWidth: "thin", // Firefox
                  "&::-webkit-scrollbar": {
                    height: 10,
                    transition: "height 0.3s ease",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#00c9ff99",
                    borderRadius: 5,
                    transition:
                      "background-color 0.3s ease, box-shadow 0.3s ease",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "#00c9ff",
                    boxShadow: "0 0 6px #00c9ff99",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "#f1f1f1",
                  },
                  "&::-webkit-scrollbar-corner": {
                    backgroundColor: "transparent",
                  },
                  scrollbarWidth: "thin", 
                  scrollbarColor: "#9e9e9e #f1f1f1",
                  "&": {
                    scrollbarWidth: "thin",
                    scrollbarColor: "#9e9e9e #f1f1f1",
                  },
                  "&:hover": {
                    scrollbarColor: "#6b6b6b #f1f1f1",
                  },
                }}
              >
                {/* Total Duration Card */}
                <Card
                  sx={{
                    minWidth: 160,
                    flexShrink: 0,
                    flexGrow: 1,
                    borderRadius: 3,
                    boxShadow: 3,
                    bgcolor: "#4caf50",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={1}
                    >
                      <DirectionsRunIcon />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Total Duration
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.totalDuration ? `${stats.totalDuration} mins` : "-"}
                    </Typography>
                    <Typography variant="caption">
                      Avg: {stats.avgDuration ? `${stats.avgDuration.toFixed(1)} mins` : "-"}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Total Steps Card */}
                {hasSteps && (
                <Card
                  sx={{
                    minWidth: 160,
                    flexShrink: 0,
                    flexGrow: 1,
                    borderRadius: 3,
                    boxShadow: 3,
                    bgcolor: "#2196f3",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={1}
                    >
                      <DirectionsWalkIcon />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Total Steps
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.totalSteps ? stats.totalSteps : "-"}
                    </Typography>
                    <Typography variant="caption">
                      Avg: {stats.avgSteps ? stats.avgSteps.toFixed(0) : "-"}
                    </Typography>
                  </CardContent>
                </Card>
                )}

                {/* Total Distance Card */}
                <Card
                  sx={{
                    minWidth: 160,
                    flexShrink: 0,
                    flexGrow: 1,
                    borderRadius: 3,
                    boxShadow: 3,
                    bgcolor: "#ff9800",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={1}
                    >
                      <DirectionsBikeIcon />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Total Distance
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.totalDistance
                        ? `${stats.totalDistance.toFixed(2)} km`
                        : "-"}
                    </Typography>
                    <Typography variant="caption">
                      Avg: {stats.avgDistance ? `${stats.avgDistance.toFixed(2)} km` : "-"}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Calories Burned Card */}
                <Card
                  sx={{
                    minWidth: 160,
                    flexShrink: 0,
                    flexGrow: 1,
                    borderRadius: 3,
                    boxShadow: 3,
                    bgcolor: "#f44336",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={1}
                    >
                      <LocalFireDepartmentIcon />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Calories Burned
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.caloriesBurned ? stats.caloriesBurned : "-"}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <ActivityStats username={username} sx={{ mt: 3 }} />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default FitnessDashboard;
