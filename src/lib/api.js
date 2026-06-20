import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://dipout-kaq5.onrender.com"
    : "http://localhost:3000");

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
