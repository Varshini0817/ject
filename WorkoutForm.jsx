import React, { useEffect, useRef, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container, Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, TextField, Button, Modal } from '@mui/material';
import axios from 'axios';
import './WorkoutForm.css';
import { toast } from 'react-toastify';

const theme = createTheme({
  palette: {
    primary: {
      main: '#48a4b0ff',
    },
    secondary: {
      main: '#0A6C91',
    },
    accent: {
      main: '#4FD1C5',
    },
    background: {
      default: '#F4F8FB',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

const ACTIVITIES = [
  { value: "Running" },
  { value: "Cycling" },
  { value: "Skipping" },
  { value: "Walking" },
  { value: "Gym" },
  { value: "Hiking" },
  { value: "Yoga" },
];

const WorkoutForm = ({ username }) => {

  const [activity, setActivity] = useState("");
  const [checking, setChecking] = useState(false);
  const [hasGoal, setHasGoal] = useState(false);
  const [goal, setGoal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [entryDate, setEntryDate] = useState("");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [steps, setSteps] = useState("");

  const [goalDraft, setGoalDraft] = useState({ activityName: "", duration: "", distance: "", steps: "" });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!activity || !username) return;
    checkGoalForActivity(activity);
  }, [activity, username]);

  const checkGoalForActivity = async (act) => {
    setChecking(true);
    setHasGoal(false);
    setGoal(null);
    setGoalDraft({ activityName: act, duration: "", distance: "", steps: "" }); // Reset goalDraft fully on activity check

    try {
      const response = await axios.get(`http://localhost:5000/api/user/goals/${username}/${act}`);
      if (response.data.hasGoal) {
        if (!mountedRef.current) return;
        setHasGoal(true);
        setGoal(response.data.goal);
        setModalOpen(false);
      } else {
        if (!mountedRef.current) return;
        setModalOpen(true);
        setGoalDraft((g) => ({ ...g, activityName: act }));
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setModalOpen(true);
      setGoalDraft((g) => ({ ...g, activityName: act }));
      toast.error(`Network error: ${err.message}`);
    } finally {
      if (mountedRef.current) setChecking(false);
    }
  };
  
  const fieldsForActivity = (act) => {
    switch (act) {
      case "Running":
        return { duration: true, distance: true, steps: false };
      case "Cycling":
        return { duration: true, distance: true, steps: false };
      case "Skipping":
        return { duration: true, distance: false, steps: true };
      case "Gym":
        return { duration: true, distance: false, steps: false };
      case "Hiking":
        return { duration: true, distance: true, steps: false };
      case "Yoga":
        return { duration: true, distance: false, steps: false };
      default:
        return { duration: true, distance: true, steps: true };
    }
  };

  const saveGoal = async () => {
    if (!goalDraft.activityName) {
      toast.error("Please provide an activity name for the goal.");
      return;
    }

    const payload = { activity: goalDraft.activityName };
    if (goalDraft.duration) payload.duration = Number(goalDraft.duration);
    if (goalDraft.distance) payload.distance = Number(goalDraft.distance);
    if (goalDraft.steps) payload.steps = Number(goalDraft.steps);
    console.log("payload to save goal",payload);
    try {
      const response = await axios.post(`http://localhost:5000/api/user/goals/${username}`, payload);
      if (!mountedRef.current) return;
      setGoal(response.data.goal);
      setHasGoal(true);
      setModalOpen(false);
      toast.success('Goal saved successfully!');
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    }
  };

  const saveEntry = async () => {
    if (!activity) {
      toast.error("Please select an activity first.");
      return;
    }
    if (!hasGoal) {
      toast.error("Please set a goal for this activity before logging workouts.");
      return;
    }

    const relevant = fieldsForActivity(activity);
    const body = {
      activity,
      date: entryDate,
      ...(relevant.duration ? { duration: Number(duration || 0) } : {}),
      ...(relevant.distance ? { distance: Number(distance || 0) } : {}),
      ...(relevant.steps ? { steps: Number(steps || 0) } : {}),
    };

    try {
      await axios.post(`http://localhost:5000/api/user/entries/${username}`, body);
      if (!mountedRef.current) return;
      setActivity("");
      setEntryDate("");
      setDuration("");
      setDistance("");
      setSteps("");
      setGoalDraft({ activityName: "", duration: "", distance: "", steps: "" });
      setHasGoal(false);
      toast.success("Saved workout entry!");
    } catch (err) {
      toast.error(`Network error: ${err.message}`);
    }
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #48a4b0ff 0%, #0A6C91 50%, #4FD1C5 100%)', color: '#1A1A1A' }}>
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 3 }}>
            HealthPulse — Workout Log
          </Typography>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); saveEntry(); }} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Activity</InputLabel>
              <Select value={activity} onChange={(e) => setActivity(e.target.value)} label="Activity">
                <MenuItem value="">
                  <em>Select Activity</em>
                </MenuItem>
                {ACTIVITIES.map((a) => (
                  <MenuItem key={a.value} value={a.value}>{a.value}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {!hasGoal && <span>Set goal to continue...</span>}
            { hasGoal && (<>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                disabled={!hasGoal}
              />
              {activity && fieldsForActivity(activity).duration && (
                <TextField
                  fullWidth
                  label="Duration (mins)"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={!hasGoal}
                />
              )}
              {activity && fieldsForActivity(activity).distance && (
                <TextField
                  fullWidth
                  label="Distance (kms)"
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  disabled={!hasGoal}
                />
              )}
              {activity && fieldsForActivity(activity).steps && (
                <TextField
                  fullWidth
                  label="Steps"
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                />
              )}
            </>)}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={!hasGoal}>
                Save Workout
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                fullWidth
                disabled={!activity}
                onClick={() => {
                  setGoalDraft({
                    activityName: activity,
                    duration: goal?.duration || "",
                    distance: goal?.distance || "",
                    steps: goal?.steps || "",
                  });
                  setModalOpen(true);
                }}
              >
                Edit Goal
              </Button>
            </Box>
          </Box>
          {checking && <Typography sx={{ mt: 2 }}>Checking goals...</Typography>}
          {hasGoal && goal && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(244, 248, 251, 0.9)', borderRadius: 2, border: '1px solid #4FD1C5' }}>
              <Typography variant="h6" gutterBottom>Current Goal</Typography>
              <Typography>
                {goal.duration ? `Duration: ${goal.duration} mins` : ""} {goal.distance ? ` • Distance: ${goal.distance} km` : ""} {goal.steps ? ` • Steps: ${goal.steps}` : ""}
              </Typography>
            </Box>
          )}
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Set goals for {goalDraft.activityName}
              </Typography>
              <TextField
                fullWidth
                label="Activity name"
                value={goalDraft.activityName}
                onChange={(e) => setGoalDraft((g) => ({ ...g, activityName: e.target.value }))}
                disabled
                sx={{ mb: 2 }}
              />
              {fieldsForActivity(goalDraft.activityName).duration && (
                <TextField
                  fullWidth
                  label="Default goal duration (mins)"
                  type="number"
                  value={goalDraft.duration}
                  onChange={(e) => setGoalDraft((g) => ({ ...g, duration: e.target.value }))}
                  sx={{ mb: 2 }}
                />
              )}
              {fieldsForActivity(goalDraft.activityName).distance && (
                <TextField
                  fullWidth
                  label="Default goal distance (kms)"
                  type="number"
                  value={goalDraft.distance}
                  onChange={(e) => setGoalDraft((g) => ({ ...g, distance: e.target.value }))}
                  sx={{ mb: 2 }}
                />
              )}
              {fieldsForActivity(goalDraft.activityName).steps && (
                <TextField
                  fullWidth
                  label="Default goal steps"
                  type="number"
                  value={goalDraft.steps}
                  onChange={(e) => setGoalDraft((g) => ({ ...g, steps: e.target.value }))}
                  sx={{ mb: 2 }}
                />
              )}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={saveGoal} variant="contained" color="primary" fullWidth>
                  Save Goal
                </Button>
                <Button onClick={() => setModalOpen(false)} variant="outlined" color="secondary" fullWidth>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Modal>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default WorkoutForm;
