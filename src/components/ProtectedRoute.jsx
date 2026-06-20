import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation()

  let user = null

  try {
    const storedUser = localStorage.getItem('user')

    user = storedUser ? JSON.parse(storedUser) : null
  } catch (error) {
    localStorage.clear()

    Swal.fire({
      icon: 'error',
      title: 'Session Error',
      text: 'Your session data is invalid. Please login again.',
      confirmButtonColor: '#3085d6',
    })

    return <Navigate to="/login" replace />
  }

  const token = localStorage.getItem('token')

  /*
   Not Logged In
  */
  if (!token || !user) {
    Swal.fire({
      icon: 'warning',
      title: 'Login Required',
      text: 'Please login to access this page.',
      confirmButtonColor: '#3085d6',
    })

    return <Navigate to="/login" state={{ from: location }} replace />
  }

  /*
   Role Check
  */
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    Swal.fire({
      icon: 'error',
      title: 'Access Denied',
      text: `You do not have permission to access this page.`,
      confirmButtonColor: '#d33',
    })

    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
