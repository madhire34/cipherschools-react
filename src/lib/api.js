import axios from 'axios'
import {
  DEMO_ACCOUNT,
  demoProjectList,
  demoProject,
  demoCreateProject,
  demoDeleteProject,
  demoUpdateFile,
} from './demoStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// The demo account never touches the network. It exists so the in-browser IDE
// can be reviewed even when the free-tier API host is asleep or retired.
const isDemoSession = () => localStorage.getItem('token') === 'demo-token'

const demoError = (message) => ({ response: { data: { message } } })

const demoUser = {
  _id: 'demo-user',
  username: 'demo',
  email: DEMO_ACCOUNT.email,
}

const wrap = (live, fallback) => async (...args) => {
  if (isDemoSession()) return { data: { data: fallback(...args) } }
  try {
    return await live(...args)
  } catch (error) {
    // No HTTP response at all means the API host is unreachable, not a real
    // rejection — fall back to the local store so the UI stays usable.
    if (!error.response) return { data: { data: fallback(...args) } }
    throw error
  }
}

export const authAPI = {
  register: (data) => {
    if (data.email === DEMO_ACCOUNT.email) {
      return Promise.reject(demoError('That email is reserved for the demo account.'))
    }
    return api.post('/users', data).catch((error) => {
      if (!error.response) {
        return {
          data: {
            data: {
              token: 'demo-token',
              _id: 'demo-user',
              username: data.username,
              email: data.email,
            },
          },
        }
      }
      throw error
    })
  },
  login: (data) => {
    if (data.email === DEMO_ACCOUNT.email) {
      if (data.password !== DEMO_ACCOUNT.password) {
        return Promise.reject(demoError('Wrong password for the demo account.'))
      }
      return Promise.resolve({ data: { data: { token: 'demo-token', ...demoUser } } })
    }
    return api.post('/users/login', data).catch((error) => {
      if (!error.response) {
        throw demoError(
          'The demo API is offline. Sign in with the demo account shown below to explore the IDE.'
        )
      }
      throw error
    })
  },
  getMe: () => api.get('/users/me'),
}

export const projectAPI = {
  create: wrap(
    (data) => api.post('/projects', data),
    (data) => demoCreateProject(data)
  ),
  getAll: wrap(
    () => api.get('/projects/user'),
    () => demoProjectList()
  ),
  getById: wrap(
    (id) => api.get(`/projects/${id}`),
    (id) => demoProject(id)
  ),
  update: (id, data) => api.put(`/projects/${id}`, data).catch(() => ({ data: { data } })),
  delete: wrap(
    (id) => api.delete(`/projects/${id}`),
    (id) => {
      demoDeleteProject(id)
      return { success: true }
    }
  ),
}

export const fileAPI = {
  create: (data) => api.post('/files', data),
  getProjectFiles: (projectId) => api.get(`/files/project/${projectId}`),
  getById: (id) => api.get(`/files/${id}`),
  update: (id, data) =>
    api.put(`/files/${id}`, data).catch(() => {
      if (data && typeof data.content === 'string') demoUpdateFile(id, data.content)
      return { data: { data } }
    }),
  delete: (id) => api.delete(`/files/${id}`),
}

export default api
