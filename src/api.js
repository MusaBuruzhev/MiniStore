// src/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api/auth', // адрес бэкенда
});

export default {
  register(userData) {
    return apiClient.post('/register', userData);
  },
  login(credentials) {
    return apiClient.post('/login', credentials);
  },
  getProfile(token) {
    return apiClient.get('/profile', {
      headers: {
        'x-auth-token': token
      }
    });
  },
  updateProfile(token, userData) {
    return apiClient.put('/profile', userData, {
      headers: {
        'x-auth-token': token
      }
      });
  }
}