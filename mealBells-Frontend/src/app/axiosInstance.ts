import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND?? "http://localhost:5000/api",
  withCredentials: true, // sends cookies automatically on every request
});

export default axiosInstance;