import axios from 'axios';

const currentHost = 'https://152-53-231-71.sslip.io';

export const API_BASE = `${currentHost}`;

export const resolveImageUrl = (path) => {
  if (!path) return path;
  if (/^(https?:)?\/\//i.test(path) || /^data:/i.test(path)) return path;
  return `${API_BASE}${path}`;
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export default api;
