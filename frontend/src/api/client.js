import axios from 'axios';

const apiInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const api = {
  getEmails: async () => {
    const response = await apiInstance.get('/');
    return response.data;
  },
  
  scheduleEmail: async (data) => {
    const response = await apiInstance.post('/schedule', data);
    return response.data;
  },

  batchScheduleEmails: async (count, delayMinutes) => {
    const response = await apiInstance.post('/batch', { count, delayMinutes });
    return response.data;
  },

  cancelEmail: async (id) => {
    const response = await apiInstance.delete(`/${id}`);
    return response.data;
  },

  getQueueMetrics: async () => {
    const response = await apiInstance.get('/queue');
    return response.data;
  }
};

export default api;
