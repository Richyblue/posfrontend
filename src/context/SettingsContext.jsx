import { createContext, useContext, useEffect, useState } from 'react'

import axios from 'axios'

const SettingsContext = createContext()

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null)

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSettings(response.data.settings)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await loadSettings()
    }
    fetchData()
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
