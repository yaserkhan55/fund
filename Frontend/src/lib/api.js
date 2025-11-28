import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://fund-tcba.onrender.com";

// Simple in-memory cache for GET requests
const cache = new Map();
const CACHE_DURATION = 60000; // 1 minute

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (Clerk tokens are synced to localStorage via AuthContext)
    const token = localStorage.getItem("token");
    if (token && token !== "null" && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add cache key for GET requests (for response caching)
    if (config.method === "get" || !config.method) {
      const cacheKey = `${config.method || "get"}:${config.url}:${JSON.stringify(config.params || {})}`;
      config._cacheKey = cacheKey;
      
      // Check cache first - return cached response immediately
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Return cached data by rejecting with special flag (handled in response interceptor)
        return Promise.reject({
          __isCached: true,
          data: cached.data,
          config,
        });
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors, retries, and caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config?._cacheKey && (response.config.method === "get" || !response.config.method)) {
      cache.set(response.config._cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }
    return response;
  },
  async (error) => {
    // Handle cached responses
    if (error.__isCached) {
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config: error.config,
      });
    }
    
    const originalRequest = error.config;
    
    // Network errors or timeout - retry logic
    if (
      originalRequest &&
      (!error.response || error.code === "ECONNABORTED") &&
      !originalRequest._retry &&
      (originalRequest._retryCount || 0) < 3
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount - 1), 5000);
      
      await new Promise((resolve) => setTimeout(resolve, delay));
      
      return api(originalRequest);
    }
    
    // Handle 401 Unauthorized - clear invalid tokens
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Optionally redirect to login
      if (typeof window !== "undefined" && !window.location.pathname.includes("/sign-in")) {
        // Only redirect if not already on sign-in page
        // window.location.href = "/sign-in";
      }
    }
    
    // Transform error to user-friendly format
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred. Please try again.";
    
    return Promise.reject({
      ...error,
      userMessage: errorMessage,
      status: error.response?.status || 500,
    });
  }
);

export default api;
