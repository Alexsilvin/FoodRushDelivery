import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the API
const API_URL = 'https://foodrush-be.onrender.com/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (unauthorized - token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // You could implement token refresh here if needed
      
      // For now, we'll just clear the token and force re-login
      await AsyncStorage.removeItem('auth_token');
      // Force logout or redirect to login screen
      // This part will be handled by AuthContext
    }
    
    return Promise.reject(error);
  }
);

// API endpoints for authentication
export const authAPI = {
  // Register a new rider
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    role?: string;
    vehicleName?: string;
  }) => {
    try {
      // Based on API test results, we need to use fullName and phoneNumber
      const payload = {
        email: userData.email,
        password: userData.password,
        // API requires fullName, not firstName/lastName
        fullName: `${userData.firstName} ${userData.lastName}`,
        // API requires phoneNumber, not phone
        phoneNumber: userData.phoneNumber,
        role: 'rider'
      };
      
      console.log('Registration attempt with payload:', JSON.stringify(payload));
      
      // Try the primary endpoint that gave us a validation error (not 404)
      try {
        const response = await axios.post(
          `${API_URL}/auth/register`, 
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        console.log('Registration successful with /auth/register');
        return response.data;
      } catch (error: any) {
        console.log('First endpoint failed, trying backup...', error.message);
        
        // If first attempt fails, try alternate possible endpoints
        try {
          const response = await axios.post(
            `${API_URL}/auth/signup`, 
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          console.log('Registration successful with /auth/signup');
          return response.data;
        } catch (secondError: any) {
          // Try one more time with the base URL directly
          const response = await axios.post(
            `https://foodrush-be.onrender.com/auth/register`, 
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          console.log('Registration successful with direct URL');
          return response.data;
        }
      }
    } catch (error: any) {
      console.error('All registration attempts failed');
      
      // Log specific information about the error
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data));
        console.error('Headers:', JSON.stringify(error.response.headers));
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  },

  // Login with email and password
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Forgot password request
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: any) => {
    const response = await api.put('/auth/update-profile', userData);
    return response.data;
  },

  // Verify email address
  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  // Change password when logged in
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// API endpoints for rider-specific operations
export const riderAPI = {
  // Get rider's current status
  getStatus: async () => {
    const response = await api.get('/riders/status');
    return response.data;
  },

  // Update rider's status (online/offline)
  updateStatus: async (status: 'online' | 'offline') => {
    const response = await api.put('/riders/status', { status });
    return response.data;
  },

  // Get rider's current deliveries
  getCurrentDeliveries: async () => {
    const response = await api.get('/riders/deliveries/current');
    return response.data;
  },

  // Get rider's delivery history
  getDeliveryHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/riders/deliveries/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Accept a delivery
  acceptDelivery: async (deliveryId: string) => {
    const response = await api.post(`/riders/deliveries/${deliveryId}/accept`);
    return response.data;
  },

  // Start a delivery (picked up from restaurant)
  startDelivery: async (deliveryId: string) => {
    const response = await api.post(`/riders/deliveries/${deliveryId}/start`);
    return response.data;
  },

  // Complete a delivery
  completeDelivery: async (deliveryId: string) => {
    const response = await api.post(`/riders/deliveries/${deliveryId}/complete`);
    return response.data;
  },

  // Get rider's earnings
  getEarnings: async (period: 'day' | 'week' | 'month' | 'all' = 'all') => {
    const response = await api.get(`/riders/earnings?period=${period}`);
    return response.data;
  },

  // Update rider's location
  updateLocation: async (latitude: number, longitude: number) => {
    const response = await api.post('/riders/location', { latitude, longitude });
    return response.data;
  },

  // Update rider's vehicle information
  updateVehicle: async (vehicleData: any) => {
    const response = await api.put('/riders/vehicle', vehicleData);
    return response.data;
  },
};

// Additional helper to test API connection
export const testAPI = {
  // Test auth endpoints with various formats
  testRegister: async () => {
    // First, try to get API information
    try {
      console.log('Checking API base URL...');
      const baseResponse = await axios.get(API_URL);
      console.log('Base URL Response:', JSON.stringify(baseResponse.data));
    } catch (error: any) {
      console.log('Base URL check failed:', error.message);
    }
    
    // Also try OPTIONS request to see available methods
    try {
      console.log('Checking API OPTIONS...');
      const optionsResponse = await axios.options(API_URL, {
        headers: { 'Accept': 'application/json' }
      });
      console.log('OPTIONS Response:', JSON.stringify(optionsResponse.data));
      console.log('OPTIONS Headers:', JSON.stringify(optionsResponse.headers));
    } catch (error: any) {
      console.log('OPTIONS check failed:', error.message);
    }

    // Test various formats of the registration payload
    // Based on validation error, API requires fullName and phoneNumber
    const correctPayload = {
      email: 'test.driver@example.com',
      password: 'Password123',
      fullName: 'Test Driver',
      phoneNumber: '1234567890',
      role: 'rider'
    };

    // Test with the corrected payload format
    const testCases = [
      // Primary endpoint with corrected payload
      {
        endpoint: '/auth/register',
        payload: {
          ...correctPayload
        }
      },
      // Try different permutations of the endpoints
      {
        endpoint: '/users/register',
        payload: {
          ...correctPayload
        }
      },
      {
        endpoint: '/driver/register',
        payload: {
          ...correctPayload
        }
      },
      {
        endpoint: '/register',
        payload: {
          ...correctPayload
        }
      },
      // Try without the API_URL prefix and directly to base URL
      {
        endpoint: '/auth/register',
        payload: {
          ...correctPayload
        },
        baseUrl: 'https://foodrush-be.onrender.com'
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const url = testCase.baseUrl ? 
          `${testCase.baseUrl}${testCase.endpoint}` : 
          `${API_URL}${testCase.endpoint}`;
          
        console.log(`Testing endpoint: ${url}`);
        
        const response = await axios.post(
          url,
          testCase.payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        results.push({
          endpoint: url,
          payload: testCase.payload,
          success: true,
          data: response.data
        });
      } catch (error: any) {
        results.push({
          endpoint: testCase.baseUrl ? 
            `${testCase.baseUrl}${testCase.endpoint}` : 
            `${API_URL}${testCase.endpoint}`,
          payload: testCase.payload,
          success: false,
          error: error.response?.data || error.message,
          status: error.response?.status
        });
      }
    }
    
    console.log('API Test Results:', JSON.stringify(results, null, 2));
    return results;
  }
};

export default api;
