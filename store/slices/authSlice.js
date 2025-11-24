// store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  ip: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ✅ Partial update
    setUser(state, action) {
      const { user, token, ip } = action.payload || {};

      if (user !== undefined) {
        state.user = user;
      }
      if (token !== undefined) {
        state.token = token;
      }
      if (ip !== undefined) {
        state.ip = ip;
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.ip = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
