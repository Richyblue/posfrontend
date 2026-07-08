import axios from 'axios'

const API = import.meta.env.VITE_BACKEND_URL

const token = localStorage.getItem('token')

const headers = {
  Authorization: `Bearer ${token}`,
}

export const scanQR = (data) => {
  return axios.post(
    `${API}api/v1/kiosk/scan`,

    data,

    { headers },
  )
}

export const clockIn = (data) => {
  return axios.post(
    `${API}api/v1/kiosk/clock-in`,

    data,

    { headers },
  )
}

export const goOut = (data) => {
  return axios.post(
    `${API}api/v1/kiosk/go-out`,

    data,

    { headers },
  )
}

export const returnBack = (data) => {
  return axios.post(
    `${API}api/v1/kiosk/return`,

    data,

    { headers },
  )
}

export const clockOut = (data) => {
  return axios.post(
    `${API}api/v1/kiosk/clock-out`,

    data,

    { headers },
  )
}
