// Temporary debugging script to test the backend API directly
// Run this with: node debug_auth.js

const axios = require('axios');

const API_URL = 'https://foodrush-be.onrender.com/api/v1';

async function testLogin(email, password) {
  try {
    console.log('=== Testing Backend API Directly ===');
    console.log('Email:', email);
    console.log('API URL:', API_URL);
    
    // Test rider login endpoint
    const response = await axios.post(`${API_URL}/riders/auth/login`, {
      email,
      password
    });
    
    console.log('\n=== Raw Backend Response ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Test account endpoint with token
    if (response.data?.data?.token || response.data?.token) {
      const token = response.data?.data?.token || response.data?.token;
      console.log('\n=== Testing Account Endpoint ===');
      
      try {
        const accountResponse = await axios.get(`${API_URL}/riders/my/account`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-access-token': token
          }
        });
        
        console.log('Account Response:', JSON.stringify(accountResponse.data, null, 2));
      } catch (accountError) {
        console.log('Account endpoint error:', accountError.response?.data || accountError.message);
      }
    }
    
  } catch (error) {
    console.error('\n=== Error ===');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
  }
}

// Replace with your actual credentials
const email = 'your-email@example.com';
const password = 'your-password';

console.log('To use this script:');
console.log('1. Replace the email and password variables with your actual credentials');
console.log('2. Run: node debug_auth.js');
console.log('3. Check the output to see what the backend is actually returning');

// Uncomment the line below and add your credentials to test
// testLogin(email, password);