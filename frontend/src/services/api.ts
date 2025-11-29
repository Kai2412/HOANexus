import config from '../config';
import logger from './logger';

// Base API configuration
const API_BASE_URL = config.api.baseUrl;

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  success?: boolean;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions & { responseType?: 'json' | 'blob'; body?: unknown } = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = localStorage.getItem('authToken');
    
    const { responseType = 'json', body, ...fetchOptions } = options;
    
    // Check if body is FormData
    const isFormData = body instanceof FormData;
    
    // Prepare headers - don't set Content-Type for FormData (browser will set it with boundary)
    const headers: Record<string, string> = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(fetchOptions.headers as Record<string, string>),
    };
    
    // Only set Content-Type for JSON, not for FormData
    if (!isFormData && responseType === 'json') {
      headers['Content-Type'] = 'application/json';
    }
    
    // Prepare body - don't stringify FormData
    let requestBody: BodyInit | undefined;
    if (body) {
      if (isFormData) {
        requestBody = body as BodyInit;
      } else {
        requestBody = JSON.stringify(body) as BodyInit;
      }
    }
    
    const config: RequestInit = {
      method: fetchOptions.method,
      ...fetchOptions,
      headers,
      body: requestBody as BodyInit | undefined,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData: any = null;
        try {
          errorData = await response.json();
          // Prioritize error field (contains actual error message), then message field
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If response is not JSON, use default message
          // Error response is not JSON, use default error message
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).response = response;
        (error as any).errorData = errorData; // Store full error data for debugging
        throw error;
      }
      
      if (responseType === 'blob') {
        const blob = await response.blob();
        return blob as T;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      logger.apiError(url, error as Error, 'ApiService');
      throw error;
    }
  }

  // GET request
  async get<T = unknown>(endpoint: string, options?: { responseType?: 'json' | 'blob' }): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  // POST request
  async post<T = unknown>(endpoint: string, data?: unknown, options?: { responseType?: 'json' | 'blob' }): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data as BodyInit | undefined,
      ...options,
    });
  }

  // PUT request
  async put<T = unknown>(endpoint: string, data?: unknown, options?: { responseType?: 'json' | 'blob' }): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data as BodyInit | undefined,
      ...options,
    });
  }

  // DELETE request
  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export default new ApiService();
