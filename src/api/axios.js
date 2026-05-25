import axios from "axios";

const api = axios.create({
  // ✅ Perfect: Works locally with Vite proxy, works on Vercel with rewrites
  baseURL: import.meta.env.VITE_API_URL || "/api",
  
  // 🚨 CHANGED: Increased to 60 seconds to handle Render free-tier cold starts
  timeout: 60000, 
  
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