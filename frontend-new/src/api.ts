import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Define the API error response type
interface ApiErrorResponse {
  message?: string;
  error?: string | { message?: string };
  [key: string]: any;
}

// Create an Axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Important for sending cookies with requests
  xsrfHeaderName: 'X-CSRF-Token',
  xsrfCookieName: 'XSRF-TOKEN',
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {} as any;
      // Add the Authorization header with Bearer token
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('Sending request to:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.config.url, response.status);
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    const errorResponse = error.response;
    const errorData = errorResponse?.data || {};
    
    console.error('API Error:', {
      url: error.config?.url,
      status: errorResponse?.status,
      statusText: errorResponse?.statusText,
      data: errorData
    });

    // Handle common errors (e.g., 401 Unauthorized)
    if (errorResponse?.status === 401) {
      // Only redirect to login if not already on login or register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('token');
        // Store the current location to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        window.location.href = '/login';
      }
    }
    
    // Return a more detailed error message
    const errorMessage = 
      errorData.message || 
      (typeof errorData.error === 'string' ? errorData.error : errorData.error?.message) || 
      'An error occurred';
    return Promise.reject({
      message: errorMessage,
      status: errorResponse?.status,
      data: errorData,
      originalError: error
    });
  }
);

export default api;
