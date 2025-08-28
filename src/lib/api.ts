import { backendPath } from './backend';

// Simple API client for making HTTP requests
class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') {
      console.log('API Client: SSR environment, no token available');
      return null;
    }
    
    // Try to get token from cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('authToken='));
    
    if (tokenCookie) {
      const token = tokenCookie.split('=')[1];
      console.log('API Client: Token found in cookie');
      return token;
    }
    
    console.log('API Client: No token found in cookie');
    return null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();
    const url = backendPath(endpoint);
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();