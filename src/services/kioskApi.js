import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL

// =========================================================
// GET AUTH HEADERS
// =========================================================

const getHeaders = () => {
  const token = localStorage.getItem('token')

  return {
    Authorization: `Bearer ${token}`,
  }
}

// =========================================================
// SCAN QR
// =========================================================

export const scanQR = (data) => {
  return axios.post(`${API}api/v1/kiosk/scan`, data, {
    headers: getHeaders(),
  })
}

// =========================================================
// CLOCK IN
// =========================================================

export const clockIn = (data) => {
  return axios.post(`${API}api/v1/kiosk/clock-in`, data, {
    headers: getHeaders(),
  })
}

// =========================================================
// GO OUT
// =========================================================

export const goOut = (data) => {
  return axios.post(`${API}api/v1/kiosk/go-out`, data, {
    headers: getHeaders(),
  })
}

// =========================================================
// RETURN BACK
// =========================================================

export const returnBack = (data) => {
  return axios.post(`${API}api/v1/kiosk/return`, data, {
    headers: getHeaders(),
  })
}

// =========================================================
// CLOCK OUT
// =========================================================

export const clockOut = (data) => {
  return axios.post(`${API}api/v1/kiosk/clock-out`, data, {
    headers: getHeaders(),
  })
}

// =========================================================
// ATTENDANCE DASHBOARD KPIs
// =========================================================

export const getAttendanceDashboardKPIs = async () => {
  return axios.get(`${API}api/v1/attendance/dashboard`, {
    headers: getHeaders(),
  })
}

// =========================================================
// TODAY'S BUSINESS HOURS
// =========================================================

export const getTodayBusinessHours = async () => {
  return axios.get(`${API}api/v1/business-hours/`, {
    headers: getHeaders(),
  })
}
