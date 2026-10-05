import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilArrowRight, cilCheckCircle } from '@coreui/icons'

const API_URL = import.meta.env.VITE_BACKEND_URL

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    try {
      setLoading(true)

      const response = await axios.post(
        `${API_URL}api/auth/login`,
        {
          email: email.trim(),
          password,
        },
        {
          timeout: 15000,
        },
      )

      const data = response?.data || {}

      /*
       * Keep the existing authentication response handling.
       */
      const token = data.token || data.accessToken || data.data?.token || data.data?.accessToken

      const user = data.user || data.data?.user || data.data

      if (!token) {
        throw new Error('Login token was not returned by the server.')
      }

      /*
       * Keep authentication data available to the rest of
       * the application.
       */
      localStorage.setItem('token', token)

      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      }

      /*
       * Remember login preference.
       */
      if (rememberMe) {
        localStorage.setItem('rememberLogin', 'true')
        localStorage.setItem('rememberedEmail', email.trim())
      } else {
        localStorage.removeItem('rememberLogin')
        localStorage.removeItem('rememberedEmail')
      }

      setSuccess('Login successful.')

      /*
       * Preserve existing role-based navigation.
       */
      const role = String(user?.role || '').toLowerCase()

      setTimeout(() => {
        if (role === 'cashier') {
          navigate('/pos', { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }, 250)
    } catch (err) {
      console.error('LOGIN ERROR:', err)

      if (err?.response?.status === 403) {
        setError(
          err?.response?.data?.message ||
            'Your account has been disabled. Please contact management.',
        )
      } else if (err?.response?.status === 401) {
        setError(err?.response?.data?.message || 'Invalid email address or password.')
      } else {
        setError(
          err?.response?.data?.message || err?.message || 'Unable to sign in. Please try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
        }

        body {
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;
          background: #ffffff;
        }

        button,
        input {
          font-family: inherit;
        }

        .login-page {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: 58% 42%;
          background: #ffffff;
          overflow: hidden;
        }

        /* =====================================================
           LEFT PANEL
        ===================================================== */

        .login-left {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 84% 8%,
              rgba(232, 189, 53, 0.12) 0,
              rgba(232, 189, 53, 0.12) 17%,
              transparent 17.2%
            ),
            #111111;
          color: #ffffff;
          padding: 52px 58px 42px;
          display: flex;
          flex-direction: column;
        }

        .login-left::before {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          right: -160px;
          top: -175px;
          border-radius: 50%;
          background: rgba(232, 189, 53, 0.075);
          pointer-events: none;
        }

        .login-left::after {
          content: "";
          position: absolute;
          width: 430px;
          height: 430px;
          left: -250px;
          bottom: -290px;
          border-radius: 50%;
          border: 1px solid rgba(232, 189, 53, 0.16);
          pointer-events: none;
        }

        .left-content {
          position: relative;
          z-index: 2;
          max-width: 650px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* =====================================================
           BRAND
        ===================================================== */

        .brand-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }

        .imvon-logo {
          width: 49px;
          height: 49px;
          object-fit: contain;
          border-radius: 11px;
          flex-shrink: 0;
        }

        .brand-business {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .brand-business-name {
          font-size: 22px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 2px;
          color: #ffffff;
          text-transform: uppercase;
        }

        .brand-business-subtitle {
          margin-top: 6px;
          font-size: 8px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: 2.4px;
          color: #e8bd35;
          text-transform: uppercase;
        }

        /* =====================================================
           BADGE
        ===================================================== */

        .platform-badge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 15px;
          border: 1px solid rgba(232, 189, 53, 0.38);
          border-radius: 20px;
          background: rgba(232, 189, 53, 0.045);
          color: #e8bd35;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #e8bd35;
          box-shadow: 0 0 10px rgba(232, 189, 53, 0.55);
        }

        /* =====================================================
           HERO
        ===================================================== */

        .hero {
          margin-top: 30px;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(46px, 5vw, 66px);
          line-height: 0.98;
          letter-spacing: -2.8px;
          font-weight: 900;
          color: #ffffff;
        }

        .hero-title span {
          display: block;
          color: #e8bd35;
        }

        .hero-description {
          max-width: 590px;
          margin: 30px 0 0;
          font-size: 16px;
          line-height: 1.8;
          color: #a8a8a8;
          font-weight: 400;
        }

        /* =====================================================
           FEATURES
        ===================================================== */

        .features {
          margin-top: 38px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .feature-icon {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(232, 189, 53, 0.09);
          color: #e8bd35;
        }

        .feature-text {
          display: flex;
          flex-direction: column;
        }

        .feature-title {
          font-size: 13px;
          line-height: 1.2;
          font-weight: 800;
          color: #ffffff;
        }

        .feature-description {
          margin-top: 5px;
          font-size: 11px;
          line-height: 1.3;
          color: #747474;
        }

        /* =====================================================
           LEFT FOOTER
        ===================================================== */

        .left-footer {
          margin-top: auto;
          padding-top: 35px;
          font-size: 10px;
          color: #666666;
          letter-spacing: 0.1px;
        }

        .footer-divider {
          display: inline-block;
          margin: 0 10px;
          color: #373737;
        }

        .footer-brand {
          color: #777777;
        }

        /* =====================================================
           RIGHT PANEL
        ===================================================== */

        .login-right {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 50px 70px;
        }

        .login-card {
          width: 100%;
          max-width: 430px;
        }

        .welcome-label {
          margin-bottom: 13px;
          color: #bd9700;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2.2px;
          text-transform: uppercase;
        }

        .login-title {
          margin: 0;
          color: #171717;
          font-size: 31px;
          line-height: 1.15;
          letter-spacing: -1.2px;
          font-weight: 900;
        }

        .login-description {
          margin: 16px 0 0;
          color: #777777;
          font-size: 13px;
          line-height: 1.8;
          max-width: 400px;
        }

        /* =====================================================
           FORM
        ===================================================== */

        .login-form {
          margin-top: 32px;
        }

        .field {
          margin-bottom: 23px;
        }

        .field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
        }

        .field-label {
          color: #353535;
          font-size: 12px;
          line-height: 1;
          font-weight: 800;
        }

        .forgot-link {
          border: 0;
          background: transparent;
          padding: 0;
          color: #b38d00;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .forgot-link:hover {
          color: #8f7100;
          text-decoration: underline;
        }

        .input-wrap {
          position: relative;
          width: 100%;
          height: 52px;
          display: flex;
          align-items: center;
          border: 1px solid #dcdcdc;
          border-radius: 11px;
          background: #ffffff;
          overflow: hidden;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .input-wrap:focus-within {
          border-color: #d6ad00;
          box-shadow: 0 0 0 3px rgba(232, 189, 53, 0.12);
        }

        .input-icon {
          width: 40px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999999;
          flex-shrink: 0;
        }

        .input-wrap input {
          width: 100%;
          height: 100%;
          border: 0;
          outline: 0;
          padding: 0 14px 0 1px;
          color: #242424;
          background: #ffffff;
          font-size: 13px;
          font-weight: 500;
        }

        .input-wrap input::placeholder {
          color: #a6a6a6;
        }

        .password-input {
          padding-right: 0 !important;
        }

        .show-password {
          height: 100%;
          min-width: 61px;
          border: 0;
          border-left: 1px solid #eeeeee;
          background: #fafafa;
          color: #858585;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .show-password:hover {
          background: #f1f1f1;
          color: #4e4e4e;
        }

        /* =====================================================
           OPTIONS
        ===================================================== */

        .login-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: -4px;
          margin-bottom: 24px;
        }

        .remember {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          user-select: none;
        }

        .remember input {
          width: 15px;
          height: 15px;
          margin: 0;
          accent-color: #e8bd35;
          cursor: pointer;
        }

        .remember span {
          font-size: 11px;
          color: #747474;
          font-weight: 500;
        }

        /* =====================================================
           ERROR / SUCCESS
        ===================================================== */

        .alert {
          border-radius: 10px;
          padding: 11px 13px;
          margin-bottom: 17px;
          font-size: 11px;
          line-height: 1.5;
        }

        .alert-error {
          background: #fff1f1;
          border: 1px solid #ffd1d1;
          color: #b42318;
        }

        .alert-success {
          background: #effaf3;
          border: 1px solid #c7ecd4;
          color: #16803c;
        }

        /* =====================================================
           SIGN IN BUTTON
        ===================================================== */

        .sign-in-button {
          width: 100%;
          height: 54px;
          border: 0;
          border-radius: 11px;
          background: #e8bd35;
          color: #111111;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(232, 189, 53, 0.20);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .sign-in-button:hover:not(:disabled) {
          background: #dcb12a;
          transform: translateY(-1px);
          box-shadow: 0 13px 28px rgba(232, 189, 53, 0.27);
        }

        .sign-in-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .sign-in-button:disabled {
          cursor: not-allowed;
          opacity: 0.75;
        }

        .button-arrow {
          display: flex;
          align-items: center;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: #111111;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =====================================================
           SECURITY CARD
        ===================================================== */

        .secure-card {
          margin-top: 28px;
          min-height: 65px;
          border-radius: 12px;
          background: #f7f7f7;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 12px 15px;
        }

        .secure-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #eeeeee;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c19b00;
          flex-shrink: 0;
        }

        .secure-text {
          display: flex;
          flex-direction: column;
        }

        .secure-title {
          font-size: 11px;
          font-weight: 900;
          color: #4b4b4b;
        }

        .secure-description {
          margin-top: 4px;
          font-size: 10px;
          color: #999999;
        }

        /* =====================================================
           POWERED BY
        ===================================================== */

        .powered-by {
          margin-top: 24px;
          text-align: center;
          font-size: 9px;
          color: #b1b1b1;
          letter-spacing: 0.3px;
        }

        .powered-by strong {
          color: #8e8e8e;
          font-weight: 900;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1000px) {
          .login-page {
            grid-template-columns: 1fr;
          }

          .login-left {
            min-height: 430px;
            padding: 40px 45px;
          }

          .login-right {
            min-height: auto;
            padding: 55px 45px;
          }

          .hero-title {
            font-size: 52px;
          }

          .features {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }

          .left-footer {
            display: none;
          }
        }

        @media (max-width: 650px) {
          .login-left {
            min-height: auto;
            padding: 30px 25px 35px;
          }

          .login-right {
            padding: 42px 25px 50px;
          }

          .brand-business-name {
            font-size: 19px;
          }

          .hero {
            margin-top: 25px;
          }

          .hero-title {
            font-size: 43px;
            letter-spacing: -2px;
          }

          .hero-description {
            font-size: 14px;
            margin-top: 22px;
          }

          .features {
            display: flex;
            margin-top: 28px;
            gap: 16px;
          }

          .feature-title {
            font-size: 12px;
          }

          .feature-description {
            font-size: 10px;
          }

          .login-title {
            font-size: 28px;
          }

          .login-card {
            max-width: 100%;
          }
        }

        @media (max-width: 400px) {
          .login-left {
            padding-left: 20px;
            padding-right: 20px;
          }

          .login-right {
            padding-left: 20px;
            padding-right: 20px;
          }

          .hero-title {
            font-size: 38px;
          }
        }
      `}</style>

      {/* =====================================================
          LEFT — PRINCESS CUTZ / IMVON
      ===================================================== */}

      <section className="login-left">
        <div className="left-content">
          {/* BRAND */}
          <div className="brand-row">
            <img src="assets/img/imvon.png" alt="IMVON" className="imvon-logo" />

            <div className="brand-business">
              <div className="brand-business-name">PRINCESS CUTZ</div>

              <div className="brand-business-subtitle">PREMIUM SALON</div>
            </div>
          </div>

          {/* PLATFORM BADGE */}
          <div className="platform-badge">
            <span className="badge-dot" />
            PROFESSIONAL SALON MANAGEMENT
          </div>

          {/* HERO */}
          <div className="hero">
            <h1 className="hero-title">
              Run your salon.
              <span>Smarter.</span>
            </h1>

            <p className="hero-description">
              Manage sales, customers, staff, inventory, commissions and daily operations from one
              powerful salon management platform.
            </p>
          </div>

          {/* FEATURES */}
          <div className="features">
            <div className="feature">
              <div className="feature-icon">
                <CIcon icon={cilCheckCircle} size="sm" />
              </div>

              <div className="feature-text">
                <div className="feature-title">Powerful POS</div>

                <div className="feature-description">Fast and reliable sales processing</div>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <CIcon icon={cilCheckCircle} size="sm" />
              </div>

              <div className="feature-text">
                <div className="feature-title">Smart Management</div>

                <div className="feature-description">Track your salon operations in real time</div>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <CIcon icon={cilCheckCircle} size="sm" />
              </div>

              <div className="feature-text">
                <div className="feature-title">Secure & Reliable</div>

                <div className="feature-description">Your business data stays protected</div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="left-footer">
            © {new Date().getFullYear()} Princess Cutz
            <span className="footer-divider">|</span>
            Powered by <span className="footer-brand">IMVON</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          RIGHT — LOGIN
      ===================================================== */}

      <section className="login-right">
        <div className="login-card">
          <div className="welcome-label">WELCOME BACK</div>

          <h2 className="login-title">Sign in to your account</h2>

          <p className="login-description">
            Enter your credentials to access your salon management system.
          </p>

          {/* FORM */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="field">
              <div className="field-header">
                <label className="field-label">Email Address</label>
              </div>

              <div className="input-wrap">
                <div className="input-icon">
                  <CIcon icon={cilUser} size="sm" />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter your email"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="field">
              <div className="field-header">
                <label className="field-label">Password</label>

                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    /*
                     * Keep this available for your existing
                     * forgot-password flow.
                     */
                    navigate('/forgot-password')
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrap">
                <div className="input-icon">
                  <CIcon icon={cilLockLocked} size="sm" />
                </div>

                <input
                  className="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* ALERTS */}
            {error && <div className="alert alert-error">{error}</div>}

            {success && <div className="alert alert-success">{success}</div>}

            {/* REMEMBER */}
            <div className="login-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />

                <span>Remember me</span>
              </label>
            </div>

            {/* SIGN IN */}
            <button type="submit" className="sign-in-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <span className="button-arrow">
                    <CIcon icon={cilArrowRight} size="sm" />
                  </span>
                </>
              )}
            </button>
          </form>

          {/* SECURITY */}
          <div className="secure-card">
            <div className="secure-icon">
              <CIcon icon={cilLockLocked} size="sm" />
            </div>

            <div className="secure-text">
              <div className="secure-title">Secure Login</div>

              <div className="secure-description">Your account information is protected.</div>
            </div>
          </div>

          {/* IMVON */}
          <div className="powered-by">
            Powered by <strong>IMVON</strong> — Run Your Business Smarter.
          </div>
        </div>
      </section>
    </div>
  )
}
