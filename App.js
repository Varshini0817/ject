

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import './App.css';
import WorkoutForm from './components/WorkoutForm';
import FitnessDashboard from "./pages/dashboard/FitnessDashboard";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Provider } from 'react-redux';
import store from './store';

// Wrapper component to extract username from URL param and pass to child component
const UsernameWrapper = ({ Component }) => {
  const { username } = useParams();
  return <Component username={username} />;
};

function App() {
  return (
    <>
      <Provider store={store}>
        <Router>
          <Routes>
            <Route path="/user/add-workout/:username" element={<UsernameWrapper Component={WorkoutForm} />} />
            <Route path="/user/fitnessDashboard/:username" element={<UsernameWrapper Component={FitnessDashboard} />} />
            <Route path="*" element={<Navigate to="/user/add-workout/userA" replace />} />
          </Routes>
        </Router>
        <ToastContainer />
      </Provider>
    </>
  );
}

export default App;
