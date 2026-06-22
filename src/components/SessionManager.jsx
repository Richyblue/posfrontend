import { useEffect } from 'react'

const SessionManager = () => {
  useEffect(() => {
    const checkSession = () => {
      const loginTime = localStorage.getItem('loginTime')

      if (!loginTime) return

      const expiryTime = 24 * 60 * 60 * 1000

      const elapsed = Date.now() - Number(loginTime)

      if (elapsed >= expiryTime) {
        alert('Session expired. Please login again.')

        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('loginTime')

        window.location.href = '/login'
      }
    }

    checkSession()

    const interval = setInterval(checkSession, 60000)

    return () => clearInterval(interval)
  }, [])

  return null
}

export default SessionManager
