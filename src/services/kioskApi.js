import axios from 'axios'

// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '')

const API = `${API_BASE_URL}/api/v1`

// =========================================================
// GET AUTH HEADERS
// =========================================================

const getHeaders = () => {
  const token = localStorage.getItem('token')

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

// =========================================================
// API REQUEST HELPER
// =========================================================

const post = (endpoint, data) => {
  return axios.post(`${API}${endpoint}`, data, {
    headers: getHeaders(),
    timeout: 30000,
  })
}

const get = (endpoint) => {
  return axios.get(`${API}${endpoint}`, {
    headers: getHeaders(),
    timeout: 30000,
  })
}

// =========================================================
// SCAN QR
// =========================================================

export const scanQR = (data) => {
  return post('/kiosk/scan', data)
}

// =========================================================
// FACE VERIFICATION
// =========================================================

export const verifyStaffFace = (data) => {
  return post('/kiosk/face/verify', {
    staffId: data.staffId,
    qrCode: data.qrCode,
    descriptor: data.descriptor,
  })
}

// =========================================================
// FACE ENROLLMENT
// =========================================================

export const enrollStaffFace = (data) => {
  return post('/kiosk/face/enroll', {
    staffId: data.staffId,
    descriptor: data.descriptor,
  })
}

// =========================================================
// CLOCK IN
// =========================================================

export const clockIn = (data) => {
  return post('/kiosk/clock-in', data)
}

// =========================================================
// GO OUT
// =========================================================

export const goOut = (data) => {
  return post('/kiosk/go-out', data)
}

// =========================================================
// RETURN BACK
// =========================================================

export const returnBack = (data) => {
  return post('/kiosk/return', data)
}

// =========================================================
// CLOCK OUT
// =========================================================

export const clockOut = (data) => {
  return post('/kiosk/clock-out', data)
}

// =========================================================
// ATTENDANCE DASHBOARD KPIs
// =========================================================

export const getAttendanceDashboardKPIs = () => {
  return get('/attendance/dashboard')
}

// =========================================================
// TODAY'S BUSINESS HOURS
// =========================================================

export const getTodayBusinessHours = () => {
  return get('/business-hours/')
}
