import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import WorkoutForm from '../components/WorkoutForm';

const AddWorkoutPage = () => {
  const { username } = useParams();
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetchWorkouts(username);
  }, [username]);

  const fetchWorkouts = async (user) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/workouts/${user}`);
      if (!response.ok) throw new Error('Failed to fetch workouts');
      const data = await response.json();
      setWorkouts(data);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const addWorkout = async (workoutData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/entries/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
      });
      if (!response.ok) throw new Error('Failed to add workout');
      const newWorkout = await response.json();
      setWorkouts(prevWorkouts => [...prevWorkouts, newWorkout.entry]); // Update state with new workout
    } catch (error) {
      console.error('Error adding workout:', error);
    }
  };

  return (
    <div className="AddWorkoutPage">
      <h1>Workout Tracker for {username}</h1>
      <WorkoutForm onSubmit={addWorkout} username={username} setUsername={() => {}} fetchWorkouts={fetchWorkouts} />
      <div className="workouts-list">
        <h2>Your Workouts</h2>
        {workouts.length > 0 ? (
          workouts.map((workout, index) => (
            <div key={index} className="workout-item">
              <p><strong>Activity:</strong> {workout.name}</p>
              <p><strong>Date:</strong> {new Date(workout.date).toLocaleDateString()}</p>
              <p><strong>Duration:</strong> {workout.duration} min</p>
              <p><strong>Distance:</strong> {workout.distance} km</p>
              <p><strong>Steps:</strong> {workout.steps}</p>
            </div>
          ))
        ) : (
          <p>No workouts found.</p>
        )}
      </div>
    </div>
  );
};

export default AddWorkoutPage;
