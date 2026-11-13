import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { CAlert, CButton, CCard, CCardBody, CFormSelect, CSpinner } from '@coreui/react'
import Swal from 'sweetalert2'

import { clockIn, goOut, returnBack, clockOut } from '../services/kioskApi'

const API_URL = import.meta.env.VITE_BACKEND_URL

// =========================================================
// ACTION CONFIGURATION
// =========================================================

const ACTION_CONFIG = {
  clockin: {
    title: 'CLOCK IN',
    description: 'Confirm your attendance and begin your workday.',
    color: 'success',
  },
  goout: {
    title: 'GO OUT',
    description: 'Record your temporary departure from the salon.',
    color: 'warning',
  },
  return: {
    title: 'RETURN',
    description: 'Confirm that you have returned to the salon.',
    color: 'info',
  },
  clockout: {
    title: 'CLOCK OUT',
    description: 'Complete your attendance for today.',
    color: 'danger',
  },
}

// =========================================================
// STAFF INFORMATION HELPERS
// =========================================================

const getFirstValidText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value)
    }
  }

  return ''
}

const getStaffName = (staff) => {
  if (!staff || typeof staff !== 'object') return 'STAFF MEMBER'

  const name = getFirstValidText(
    staff.fullname,
    staff.fullName,
    staff.name,
    staff.staffName,
    staff.displayName,
    staff.employeeName,

    staff.User?.fullname,
    staff.User?.fullName,
    staff.User?.name,

    staff.user?.fullname,
    staff.user?.fullName,
    staff.user?.name,

    staff.Staff?.fullname,
    staff.Staff?.fullName,
    staff.Staff?.name,

    staff.staff?.fullname,
    staff.staff?.fullName,
    staff.staff?.name,

    staff.employee?.fullname,
    staff.employee?.fullName,
    staff.employee?.name,
  )

  return name || 'STAFF MEMBER'
}

const getStaffPosition = (staff) => {
  if (!staff || typeof staff !== 'object') return 'TEAM MEMBER'

  return (
    getFirstValidText(
      staff.position,
      staff.jobTitle,
      staff.designation,
      staff.roleName,
      staff.role?.name,

      staff.User?.position,
      staff.User?.jobTitle,
      staff.User?.designation,

      staff.user?.position,
      staff.user?.jobTitle,
      staff.user?.designation,

      staff.Staff?.position,
      staff.staff?.position,
    ) || 'TEAM MEMBER'
  )
}

const getInitials = (name) => {
  if (!name || name === 'STAFF MEMBER') return 'SM'

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

// =========================================================
// MAIN COMPONENT
// =========================================================

const ActionScreen = ({ staff, nextAction, verificationToken, setScreen, setSuccessData }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('restroom')
  const [expectedReturn, setExpectedReturn] = useState(15)

  // Staff photograph state
  const [staffPhoto, setStaffPhoto] = useState(null)
  const [photoError, setPhotoError] = useState(false)

  const action = ACTION_CONFIG[nextAction]

  const staffName = useMemo(() => getStaffName(staff), [staff])
  const staffPosition = useMemo(() => getStaffPosition(staff), [staff])
  const initials = useMemo(() => getInitials(staffName), [staffName])

  const canEmergencyClockOut = ['goout', 'return'].includes(nextAction)

  const actionPayload = useMemo(
    () => ({
      qrCode: staff?.qrCode,
      verificationToken,
    }),
    [staff?.qrCode, verificationToken],
  )

  // =======================================================
  // FETCH STAFF PHOTOGRAPH
  // Uses the same media endpoint as ViewStaff.jsx
  // =======================================================

  useEffect(() => {
    let isMounted = true

    const fetchStaffPhoto = async () => {
      // Reset photo when the staff member changes
      setStaffPhoto(null)
      setPhotoError(false)

      if (!staff?.id) {
        console.warn('Cannot fetch staff photograph: staff ID is missing.')
        return
      }

      try {
        const token = localStorage.getItem('token')

        if (!token) {
          console.warn('Cannot fetch staff photograph: authentication token is missing.')
          return
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }

        const { data } = await axios.get(`${API_URL}api/v1/staff/${staff.id}/media`, config)

        if (isMounted) {
          setStaffPhoto(data?.photo || null)
          setPhotoError(false)
        }
      } catch (err) {
        console.error(
          `Unable to load photograph for staff ${staff.id}:`,
          err.response?.data?.message || err.message,
        )

        if (isMounted) {
          setStaffPhoto(null)
          setPhotoError(true)
        }
      }
    }

    fetchStaffPhoto()

    return () => {
      isMounted = false
    }
  }, [staff?.id])

  // =======================================================
  // CONFIRM CLOCK OUT
  // =======================================================

  const confirmClockOut = async (emergency = false) => {
    const result = await Swal.fire({
      title: emergency ? 'Emergency Clock-Out?' : 'Confirm Clock-Out?',
      text: emergency
        ? 'This will end your attendance for today immediately, even if you are not scheduled to leave yet.'
        : 'Are you sure you want to complete your attendance for today?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: emergency ? 'Yes, Clock Out' : 'Confirm Clock-Out',
      cancelButtonText: 'Go Back',
      confirmButtonColor: '#b89552',
      cancelButtonColor: '#475569',
      reverseButtons: true,
      focusCancel: true,
    })

    return result.isConfirmed
  }

  // =======================================================
  // SUBMIT ATTENDANCE ACTION
  // =======================================================

  const submitAction = async ({ emergency = false } = {}) => {
    if (loading) return

    if (!staff?.qrCode) {
      setError('Staff QR code is missing. Please scan your staff card again.')
      return
    }

    if (!verificationToken) {
      setError('Face verification is required before attendance can continue.')
      return
    }

    if (!action) {
      setError('Invalid attendance action. Please scan your staff card again.')
      return
    }

    if (nextAction === 'clockout' && !emergency) {
      const confirmed = await confirmClockOut(false)
      if (!confirmed) return
    }

    if (emergency) {
      const confirmed = await confirmClockOut(true)
      if (!confirmed) return
    }

    try {
      setLoading(true)
      setError('')

      let response

      if (emergency) {
        response = await clockOut(actionPayload)
      } else {
        switch (nextAction) {
          case 'clockin':
            response = await clockIn(actionPayload)
            break

          case 'goout':
            response = await goOut({
              ...actionPayload,
              reason,
              expectedReturn: Number(expectedReturn),
            })
            break

          case 'return':
            response = await returnBack(actionPayload)
            break

          case 'clockout':
            response = await clockOut(actionPayload)
            break

          default:
            throw new Error('Invalid attendance action.')
        }
      }

      setSuccessData({
        action: emergency ? 'clockout' : nextAction,
        response: response?.data,
      })

      setScreen('success')
    } catch (err) {
      console.error('Kiosk attendance action failed:', err)

      setError(
        err.response?.data?.message ||
          err.message ||
          'The attendance action could not be completed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  // =======================================================
  // CANCEL
  // =======================================================

  const handleCancel = () => {
    if (loading) return
    setScreen('scan')
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="luxury-action-screen">
      <style>{`
        .luxury-action-screen {
          --gold: #c6a15b;
          --gold-light: #e8d4a5;
          --gold-dark: #94723b;
          --black: #090909;
          --panel: #121212;
          --muted: #a5a5a5;

          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 16px;

          background:
            radial-gradient(circle at 15% 10%, rgba(198,161,91,.13), transparent 32%),
            radial-gradient(circle at 90% 90%, rgba(198,161,91,.09), transparent 30%),
            linear-gradient(135deg, #050505, #111111 55%, #080808);
        }

        .luxury-terminal {
          width: 100%;
          max-width: 790px;
          overflow: hidden;
          border: 1px solid rgba(198,161,91,.48) !important;
          border-radius: 25px !important;
          background: var(--panel) !important;
          box-shadow:
            0 35px 100px rgba(0,0,0,.65),
            0 0 35px rgba(198,161,91,.07);
        }

        .luxury-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 30px;
          background: linear-gradient(110deg, #111111, #1a1711);
          border-bottom: 1px solid rgba(198,161,91,.35);
        }

        .luxury-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .luxury-brand-mark {
          width: 51px;
          height: 51px;
          flex: 0 0 51px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: #111;
          font-size: 23px;
          font-weight: 900;
          background: linear-gradient(145deg, #f1dfb5, #b58a43);
          box-shadow: 0 5px 22px rgba(198,161,91,.25);
        }

        .luxury-brand-name {
          color: #f6e8c7;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: 1.5px;
          line-height: 1.3;
        }

        .luxury-brand-subtitle {
          color: #a9a08e;
          font-size: 11px;
          margin-top: 4px;
          letter-spacing: 1.1px;
          text-transform: uppercase;
        }

        .luxury-online {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          color: #b9d9bc;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .luxury-online-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #36c878;
          box-shadow: 0 0 12px rgba(54,200,120,.6);
        }

        .luxury-content {
          padding: 36px 30px 42px;
          background:
            radial-gradient(ellipse at top, rgba(198,161,91,.06), transparent 55%),
            #101010;
          text-align: center;
        }

        .luxury-identity-label {
          color: var(--gold);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 19px;
        }

        .luxury-avatar {
          width: 112px;
          height: 112px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 50%;
          color: #15110a;
          font-size: 37px;
          font-weight: 900;
          background: linear-gradient(145deg, #f4e3bb, #c6a15b 65%, #98713b);
          border: 4px solid #c6a15b;
          box-shadow:
            0 0 0 5px rgba(198,161,91,.16),
            0 12px 38px rgba(198,161,91,.25);
        }

        .luxury-avatar img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          border-radius: 50%;
        }

        .luxury-welcome {
          color: #b4aa98;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 9px;
        }

        .luxury-staff-name {
          color: #ffffff !important;
          font-size: clamp(30px, 5.5vw, 43px) !important;
          font-weight: 950 !important;
          letter-spacing: .5px;
          line-height: 1.18 !important;
          margin: 0 auto 12px !important;
          padding: 0 8px;
          max-width: 100%;
          overflow-wrap: anywhere;
          text-shadow: 0 3px 20px rgba(0,0,0,.7);
        }

        .luxury-name-divider {
          width: 90px;
          height: 3px;
          margin: 0 auto 13px;
          border-radius: 5px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .luxury-staff-position {
          display: inline-block;
          max-width: 90%;
          padding: 8px 18px;
          border: 1px solid rgba(198,161,91,.35);
          border-radius: 30px;
          color: #e0c58e;
          background: rgba(198,161,91,.08);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.3px;
          text-transform: uppercase;
          overflow-wrap: anywhere;
        }

        .luxury-panel {
          width: 100%;
          max-width: 570px;
          margin: 34px auto 0;
          padding: 29px;
          border: 1px solid rgba(198,161,91,.32);
          border-radius: 20px;
          background: linear-gradient(145deg, #191919, #111111);
          box-shadow: 0 18px 45px rgba(0,0,0,.25);
          text-align: left;
        }

        .luxury-panel-label {
          color: var(--gold);
          text-align: center;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2.8px;
          margin-bottom: 11px;
        }

        .luxury-panel-title {
          color: #f8e9c8;
          text-align: center;
          font-size: 29px;
          font-weight: 950;
          letter-spacing: 1.4px;
          line-height: 1.2;
          margin-bottom: 9px;
        }

        .luxury-panel-description {
          color: #aaa49a;
          text-align: center;
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 27px;
        }

        .luxury-field-label {
          display: block;
          margin-bottom: 9px;
          color: #e8d6b2;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .5px;
        }

        .luxury-select {
          min-height: 51px !important;
          border: 1px solid rgba(198,161,91,.35) !important;
          border-radius: 10px !important;
          background-color: #202020 !important;
          color: #ffffff !important;
          box-shadow: none !important;
        }

        .luxury-select:focus {
          border-color: var(--gold) !important;
          box-shadow: 0 0 0 3px rgba(198,161,91,.12) !important;
        }

        .luxury-main-button {
          width: 100%;
          min-height: 59px;
          margin-top: 8px;
          border: 1px solid #e4c78f !important;
          border-radius: 11px !important;
          color: #15110a !important;
          background: linear-gradient(110deg, #f0dfb9, #c6a15b, #a77b38) !important;
          font-size: 15px !important;
          font-weight: 950 !important;
          letter-spacing: 1.1px;
          box-shadow: 0 8px 24px rgba(198,161,91,.15);
        }

        .luxury-main-button:hover:not(:disabled) {
          filter: brightness(1.09);
          transform: translateY(-1px);
        }

        .luxury-main-button:disabled {
          opacity: .5;
        }

        .luxury-secondary-button {
          width: 100%;
          min-height: 51px;
          margin-top: 12px;
          border: 1px solid #555 !important;
          border-radius: 11px !important;
          color: #e8e8e8 !important;
          background: #252525 !important;
          font-weight: 800 !important;
        }

        .luxury-emergency-button {
          width: 100%;
          min-height: 51px;
          margin-top: 18px;
          border-radius: 11px !important;
          font-weight: 900 !important;
          letter-spacing: .6px;
        }

        .luxury-emergency-note {
          color: #9b9284;
          text-align: center;
          font-size: 11px;
          line-height: 1.7;
          margin-top: 10px;
        }

        .luxury-error {
          border-radius: 10px !important;
        }

        .luxury-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 17px 30px;
          border-top: 1px solid rgba(198,161,91,.25);
          background: #0b0b0b;
          color: #817967;
          font-size: 10px;
          letter-spacing: .7px;
          text-transform: uppercase;
        }

        @media (max-width: 575px) {
          .luxury-action-screen {
            padding: 12px;
          }

          .luxury-terminal {
            border-radius: 19px !important;
          }

          .luxury-header {
            padding: 17px;
          }

          .luxury-brand-mark {
            width: 43px;
            height: 43px;
            flex-basis: 43px;
          }

          .luxury-brand-name {
            font-size: 15px;
          }

          .luxury-brand-subtitle {
            font-size: 9px;
          }

          .luxury-online {
            font-size: 9px;
          }

          .luxury-content {
            padding: 32px 16px;
          }

          .luxury-avatar {
            width: 94px;
            height: 94px;
            font-size: 32px;
          }

          .luxury-staff-name {
            font-size: clamp(27px, 8vw, 36px) !important;
          }

          .luxury-panel {
            padding: 23px 17px;
            margin-top: 28px;
          }

          .luxury-panel-title {
            font-size: 25px;
          }

          .luxury-footer {
            padding: 15px 16px;
            font-size: 9px;
          }
        }

        @media (max-width: 370px) {
          .luxury-online {
            font-size: 8px;
          }

          .luxury-brand {
            gap: 9px;
          }

          .luxury-brand-name {
            font-size: 13px;
          }

          .luxury-footer {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      <CCard className="luxury-terminal">
        {/* HEADER */}

        <div className="luxury-header">
          <div className="luxury-brand">
            <div className="luxury-brand-mark">P</div>

            <div>
              <div className="luxury-brand-name">PRINCESS SALON</div>
              <div className="luxury-brand-subtitle">Staff Attendance Terminal</div>
            </div>
          </div>

          <div className="luxury-online">
            <span className="luxury-online-dot" />
            Kiosk Online
          </div>
        </div>

        <CCardBody className="luxury-content">
          {/* STAFF IDENTITY */}

          <div className="luxury-identity-label">Verified Staff Identity</div>

          <div className="luxury-avatar">
            {staffPhoto && !photoError ? (
              <img
                src={staffPhoto}
                alt={`${staffName} profile`}
                onError={() => {
                  setPhotoError(true)
                }}
              />
            ) : (
              initials
            )}
          </div>

          <div className="luxury-welcome">Welcome Back</div>

          <h1 className="luxury-staff-name">{staffName}</h1>

          <div className="luxury-name-divider" />

          <div className="luxury-staff-position">{staffPosition}</div>

          {/* ATTENDANCE PANEL */}

          <div className="luxury-panel">
            <div className="luxury-panel-label">YOUR NEXT ATTENDANCE ACTION</div>

            <div className="luxury-panel-title">{action?.title || 'ACTION UNAVAILABLE'}</div>

            <div className="luxury-panel-description">
              {action?.description ||
                'Your next attendance action could not be determined. Please scan your staff card again.'}
            </div>

            {/* GO OUT OPTIONS */}

            {nextAction === 'goout' && (
              <div className="mb-4">
                <label className="luxury-field-label" htmlFor="goout-reason">
                  Reason for leaving
                </label>

                <CFormSelect
                  id="goout-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  size="lg"
                  disabled={loading}
                  className="luxury-select mb-3"
                >
                  <option value="restroom">Restroom</option>
                  <option value="buy_material">Buy materials</option>
                  <option value="bank">Bank</option>
                  <option value="lunch">Lunch</option>
                  <option value="official">Official assignment</option>
                  <option value="personal">Personal</option>
                </CFormSelect>

                <label className="luxury-field-label" htmlFor="expected-return">
                  Expected return
                </label>

                <CFormSelect
                  id="expected-return"
                  value={expectedReturn}
                  onChange={(event) => setExpectedReturn(Number(event.target.value))}
                  size="lg"
                  disabled={loading}
                  className="luxury-select"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </CFormSelect>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <CAlert
                color="danger"
                className="luxury-error mb-3"
                dismissible
                onClose={() => setError('')}
              >
                {error}
              </CAlert>
            )}

            {/* MAIN ACTION */}

            <CButton
              color={action?.color || 'secondary'}
              size="lg"
              disabled={loading || !action || !verificationToken || !staff?.qrCode}
              onClick={() => submitAction()}
              className="luxury-main-button"
            >
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  PROCESSING...
                </>
              ) : (
                action?.title || 'UNAVAILABLE'
              )}
            </CButton>

            {/* CANCEL */}

            <CButton
              color="light"
              size="lg"
              disabled={loading}
              onClick={handleCancel}
              className="luxury-secondary-button"
            >
              CANCEL
            </CButton>

            {/* EMERGENCY CLOCK OUT */}

            {canEmergencyClockOut && (
              <>
                <CButton
                  color="danger"
                  variant="outline"
                  size="lg"
                  disabled={loading || !verificationToken || !staff?.qrCode}
                  onClick={() => submitAction({ emergency: true })}
                  className="luxury-emergency-button"
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      PROCESSING...
                    </>
                  ) : (
                    'EMERGENCY CLOCK OUT'
                  )}
                </CButton>

                <div className="luxury-emergency-note">
                  Use only when you need to end your attendance before the normal clock-out process.
                </div>
              </>
            )}
          </div>
        </CCardBody>

        {/* FOOTER */}

        <div className="luxury-footer">
          <span>© {new Date().getFullYear()} Princess Salon</span>
          <span>Secure Staff Attendance</span>
        </div>
      </CCard>
    </div>
  )
}

export default ActionScreen
