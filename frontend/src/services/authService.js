import api from './api'
export const login          = (u, p) => api.post('/login',    { username: u, password: p })
export const register       = (u, p) => api.post('/register', { username: u, password: p })
export const logout         = ()      => api.post('/logout')
export const updateSettings = (data) => api.post('/user/settings', data)
export const changePassword = (data) => api.post('/user/change-password', data)
export const deleteAccount  = ()     => api.delete('/user/delete-account')

