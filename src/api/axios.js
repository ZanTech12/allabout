import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // Check direct keys first
  let token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  // ← ADD THIS: fallback to checking inside userInfo
  if (!token) {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      token = userInfo?.token;
    } catch {}
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userInfo");
    }
    return Promise.reject(error);
  }
);

export default api;