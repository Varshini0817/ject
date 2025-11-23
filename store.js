import { configureStore } from '@reduxjs/toolkit';
import userProfileReducer from './features/userProfileSlice';

const store = configureStore({
  reducer: {
    userProfile: userProfileReducer,
  },
});

export default store;
