/**
 * App Component
 *
 * Root application component that sets up routing, theme management,
 * and lazy-loaded page components with suspense boundaries.
 *
 * @module App
 */

import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ProtectedRoute from './components/ProtectedRoute'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'

import CustomerDisplay from '../electron/CustomerDisplay'
import Kiosk from './Kiosk/Kiosk'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./auth/Login'))
const Pos = React.lazy(() => import('./pos/posPage'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

  const storedTheme = useSelector((state) => state.theme)

  /**
   * ---------------------------------------------------------
   * FORCE KIOSK STARTUP
   * ---------------------------------------------------------
   *
   * If the application is opened without a route,
   * send it directly to the kiosk.
   *
   * HashRouter uses:
   *     /#/kiosk
   *
   */
  useEffect(() => {
    const hash = window.location.hash

    if (!hash || hash === '#' || hash === '#/') {
      window.location.replace('/#/kiosk')
    }
  }, [])

  /**
   * ---------------------------------------------------------
   * THEME
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])

    const themeParam = urlParams.get('theme')

    const theme = themeParam ? themeParam.match(/^[A-Za-z0-9\s]+/)?.[0] : null

    if (theme) {
      setColorMode(theme)
      return
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, [isColorModeSet, setColorMode, storedTheme])

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              minHeight: '100vh',
              width: '100%',
            }}
          >
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          {/* =====================================================
              KIOSK
          ===================================================== */}
          <Route path="/kiosk" name="Kiosk" element={<Kiosk />} />

          {/* =====================================================
              POS
          ===================================================== */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <Pos />
              </ProtectedRoute>
            }
          />

          {/* =====================================================
              CUSTOMER DISPLAY
          ===================================================== */}
          <Route path="/customer-display" element={<CustomerDisplay />} />

          {/* =====================================================
              AUTH
          ===================================================== */}
          <Route path="/login" name="Login Page" element={<Login />} />

          <Route path="/register" name="Register Page" element={<Register />} />

          {/* =====================================================
              ERROR PAGES
          ===================================================== */}
          <Route path="/404" name="Page 404" element={<Page404 />} />

          <Route path="/500" name="Page 500" element={<Page500 />} />

          {/* =====================================================
              DEFAULT
          ===================================================== */}
          <Route path="*" name="Home" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
