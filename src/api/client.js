import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: 'https://lendbridge-backend.onrender.com',
  timeout: 15000,
})

// Request interceptor — attach JWT or Basic auth
api.interceptors.request.use((config) => {
  const { token, credentials } = useAuthStore.getState()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (credentials) {
    config.headers.Authorization = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
  }
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
