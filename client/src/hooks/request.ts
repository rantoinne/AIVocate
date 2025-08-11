import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

interface RequestConfig extends AxiosRequestConfig {
  // Add any custom configuration options here
}

class RequestService {
  private axiosInstance: AxiosInstance
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Can add authentication tokens or other headers here
        // Example:
        // const token = localStorage.getItem('authToken')
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`
        // }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Add response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Can handle successful responses here
        return response.data
      },
      (error: AxiosError) => {
        // You can handle errors globally here
        if (error.response?.status === 401) {
          // Handle unauthorized access
          // window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // GET request
  public async get<T>(url: string, config?: RequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(url, config)
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // POST request
  public async post<T>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>['data']> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config)
      return response as AxiosResponse<T>['data']
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // PUT request
  public async put<T>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config)
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // DELETE request
  public async delete<T>(url: string, config?: RequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config)
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // PATCH request
  public async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<T>(url, data, config)
      return response
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Error handler
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      // Handle axios specific errors
      const axiosError = error as AxiosError
      if (axiosError.response) {
        // Server responded with error status
        console.error('Request failed with status:', axiosError.response.status)
        console.error('Error data:', axiosError.response.data)
      } else if (axiosError.request) {
        // Request was made but no response received
        console.error('No response received:', axiosError.request)
      } else {
        // Something else happened
        console.error('Error message:', axiosError.message)
      }
      return new Error(axiosError.message)
    } else {
      // Handle non-axios errors
      console.error('Non-axios error:', error)
      return new Error('An unknown error occurred')
    }
  }

  // Update base URL
  public updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl
    this.axiosInstance.defaults.baseURL = newBaseUrl
  }

  // Set authorization token
  public setAuthToken(token: string): void {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // Remove authorization token
  public removeAuthToken(): void {
    delete this.axiosInstance.defaults.headers.common['Authorization']
  }
}

// Hook to use the request service
export const useRequest = (baseUrl: string) => {
  // Create a new instance for each hook call
  const requestService = new RequestService(baseUrl)
  
  return {
    get: requestService.get.bind(requestService),
    post: requestService.post.bind(requestService),
    put: requestService.put.bind(requestService),
    delete: requestService.delete.bind(requestService),
    patch: requestService.patch.bind(requestService),
    updateBaseUrl: requestService.updateBaseUrl.bind(requestService),
    setAuthToken: requestService.setAuthToken.bind(requestService),
    removeAuthToken: requestService.removeAuthToken.bind(requestService),
  }
}

export default RequestService
