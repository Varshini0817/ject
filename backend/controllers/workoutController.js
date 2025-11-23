const { Workout } = require('../model/users');

const getGoal = async (req, res) => {
  try {
    let { username, activity } = req.params;

    // Normalize username by trimming and lowercasing for consistent querying
    username = decodeURIComponent(username);
    console.log("  workoutController/getGoal username ", username);
    

    const workoutDoc = await Workout.findOne({ username });
    console.log("  workoutController/getGoal workoutDoc ", workoutDoc);
    if (workoutDoc) {
      const goal = workoutDoc.goals.find(g => g.activity === activity);
      if (goal) {
        res.json({ hasGoal: true, goal });
      } else {
        res.json({ hasGoal: false });
      }
    } else {
      res.json({ hasGoal: false });
    }
  } catch (error) {
    console.error('Error in getGoal:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    let { username } = req.params;

    username = decodeURIComponent(username);

    const workoutDoc = await Workout.findOne({ username });
    console.log("  workoutController/getUserProfile workoutDoc ", workoutDoc);
    if (!workoutDoc) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { age, height, weight, username: user, goals, activities } = workoutDoc;
    console.log('getUserProfile: sending user data', { age, height, weight, username: user, goals, activities });
    res.json({ age, height, weight, username: user, goals, activities });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ error: error.message });
  }
};

const saveGoal = async (req, res) => {
  try {
    let { username } = req.params;

    // Normalize username
    username = decodeURIComponent(username);
    const { activity, duration = 0, distance = 0, steps = 0, age, height, weight } = req.body;
    let workoutDoc = await Workout.findOne({ username });
    console.log("  workoutController/saveGoal workoutDoc ", workoutDoc);
    if (!workoutDoc) {
      workoutDoc = new Workout({ username, activities: [], goals: [], age, height, weight });
    } else {
      // Update age, height, weight if provided
      if (age !== undefined) workoutDoc.age = age;
      if (height !== undefined) workoutDoc.height = height;
      if (weight !== undefined) workoutDoc.weight = weight;
    }
    const existingGoalIndex = workoutDoc.goals.findIndex(g => g.activity === activity);
    console.log("  existingGoalIndex",existingGoalIndex)
    if (existingGoalIndex >= 0) {
      workoutDoc.goals[existingGoalIndex] = { activity, duration, distance, steps };
      await workoutDoc.save();
      res.json({ message: 'Goal updated', goal: workoutDoc.goals[existingGoalIndex] });
    } else {
      workoutDoc.goals.push({ activity, duration, distance, steps });
      await workoutDoc.save();
      res.json({ message: 'Goal saved', goal: workoutDoc.goals[workoutDoc.goals.length - 1] });
    }
  } catch (error) {
    console.error('Error in saveGoal:', error);
    res.status(500).json({ error: error.message });
  }
};

const saveEntry = async (req, res) => {
  try {
    let { username } = req.params;

    // Normalize username
    username = decodeURIComponent(username);
    const { activity, date, duration = 0, distance = 0, steps = 0 } = req.body;

    // Check if date is in the future
    const entryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (entryDate > today) {
      return res.status(400).json({ error: 'Cannot log workouts for future dates' });
    }

    // Find or create workout document for user
    let workoutDoc = await Workout.findOne({ username });
    if (!workoutDoc) {
      return res.status(400).json({ error: 'No goals set for this user' });
    }

    // Check if goal exists for the activity
    const goal = workoutDoc.goals.find(g => g.activity === activity);
    if (!goal) {
      return res.status(400).json({ error: 'Goal not set for this activity' });
    }

    // Check if entry already exists for this activity and date
    const existingEntry = workoutDoc.activities.find(act => act.activity === activity && new Date(act.date).toDateString() === entryDate.toDateString());
    if (existingEntry) {
      return res.status(400).json({ error: 'An entry for this activity already exists on this date' });
    }
  

    // Add new activity entry
    workoutDoc.activities.push({ activity, date: entryDate, duration, distance, steps });
    await workoutDoc.save();
    res.json({ message: 'Entry saved', entry: workoutDoc.activities[workoutDoc.activities.length - 1] });
  } catch (error) {
    console.error('Error in saveEntry:', error);
    res.status(500).json({ error: error.message });
  }
};

const listWorkouts = async (req, res) => {
  try {
    let { username } = req.params;

    // Normalize username
    username = decodeURIComponent(username);
    const workoutDoc = await Workout.findOne({ username });
    if (workoutDoc) {
      res.json(workoutDoc.activities);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error in listWorkouts:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getGoal, saveGoal, saveEntry, listWorkouts, getUserProfile };
