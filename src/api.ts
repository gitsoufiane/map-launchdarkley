import fetch from 'node-fetch';
import { LD_API_KEY, LD_BASE_URL } from './config.js';

// Helper function to make authenticated requests to LaunchDarkly API
export async function ldRequest(endpoint: string, method = 'GET', body?: any) {
  const headers = {
    'Authorization': `${LD_API_KEY}`,
    'Content-Type': 'application/json'
  };

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${LD_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`LaunchDarkly API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling LaunchDarkly API:', error);
    throw error;
  }
}
