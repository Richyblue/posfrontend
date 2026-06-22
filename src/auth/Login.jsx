import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom' // Import useNavigate
import {
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate() // Initialize navigate
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('') // Clear any previous errors

    try {
      const response = await axios.post(`${API_URL}api/auth/login`, {
        email,
        password,
      })

      // Handle success (e.g., save token, redirect user)
      console.log('Login successful:', response.data)
      alert('Login successful!')
      localStorage.setItem('token', response.data.token)

      localStorage.setItem('user', JSON.stringify(response.data.user))

      localStorage.setItem('expiresAt', Date.now() + 8 * 60 * 60 * 1000)

      navigate('/dashboard')
    } catch (err) {
      // Handle error (e.g., invalid credentials)
      console.error('Login failed:', err.response?.data || err.message)
      setError('Invalid email or password')
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
          <CCol md={5} lg={4}>
            <CCard
              className="border-0 shadow-lg"
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg,#2563eb,#1e40af)',
                  color: '#fff',
                  padding: '30px',
                  textAlign: 'center',
                }}
              >
                <h2 className="fw-bold mb-2">Princess Salon POS</h2>

                <p className="mb-0">Salon Management System</p>
              </div>

              <CCardBody className="p-4">
                <CForm onSubmit={handleLogin}>
                  <h4 className="fw-bold mb-1">Welcome Back</h4>

                  <p className="text-medium-emphasis mb-4">Sign in to continue</p>

                  {error && <div className="alert alert-danger">{error}</div>}

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>

                    <CFormInput
                      type="email"
                      placeholder="Email Address"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>

                    <CFormInput
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </CInputGroup>

                  <CButton
                    type="submit"
                    color="primary"
                    className="w-100 py-2 fw-bold"
                    style={{
                      borderRadius: '10px',
                    }}
                  >
                    Sign In
                  </CButton>

                  <div className="text-center mt-4">
                    <small className="text-medium-emphasis">Secure ERP/POS Login</small>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
