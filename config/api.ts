// config/api.ts
export const API_URL = 'https://kayleigh-unblackened-eulah.ngrok-free.dev';

// Add your API key here (get this from your backend .env file)
export const API_KEY = ' my_secure_app_key_xyz123';

// Helper function to get headers with API key
export const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
});

// API configuration object
export const API_CONFIG = {
  baseUrl: API_URL,
  apiKey: API_KEY,
  headers: getHeaders(),
};

export default API_CONFIG;
