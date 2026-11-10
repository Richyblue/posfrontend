import { useMemo, useState } from 'react'
import { CAlert, CButton, CCard, CCardBody, CFormSelect, CSpinner } from '@coreui/react'
import Swal from 'sweetalert2'

import { clockIn, goOut, returnBack, clockOut } from '../services/kioskApi'

const ACTION_CONFIG = {
  clockin: {
    title: 'CLOCK IN',
    description: 'Confirm your attendance and start your workday.',
    color: 'success',
  },
  goout: {
    title: 'GO OUT',
    description: 'Record that you are temporarily leaving the salon.',
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

const ActionScreen = ({ staff, nextAction, verificationToken, setScreen, setSuccessData }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('restroom')
  const [expectedReturn, setExpectedReturn] = useState(15)

  const action = ACTION_CONFIG[nextAction]
  const staffName = staff?.fullname || staff?.fullName || staff?.name || 'Staff Member'

  const initials = staffName.trim().charAt(0).toUpperCase()

  const canEmergencyClockOut = ['goout', 'return'].includes(nextAction)

  const actionPayload = useMemo(
    () => ({
      qrCode: staff?.qrCode,
      verificationToken,
    }),
    [staff?.qrCode, verificationToken],
  )

  const confirmClockOut = async (emergency = false) => {
    const result = await Swal.fire({
      title: emergency ? 'Emergency clock-out?' : 'Confirm clock-out?',
      text: emergency
        ? 'This will end your attendance for today immediately, even if you are not scheduled to leave yet.'
        : 'Are you sure you want to complete your attendance for today?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: emergency ? 'Yes, clock out' : 'Confirm clock-out',
      cancelButtonText: 'Go back',
      confirmButtonColor: '#dc3545',
      reverseButtons: true,
      focusCancel: true,
    })

    return result.isConfirmed
  }

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
            throw new Error('Invalid attendance action. Please scan your staff card again.')
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

  const handleCancel = () => {
    if (loading) return
    setScreen('scan')
  }

  return (
    <div className="action-screen">
      <style>{`
        .action-screen {
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          background:
            radial-gradient(circle at 10% 5%, rgba(99,102,241,.18), transparent 30%),
            radial-gradient(circle at 90% 95%, rgba(236,72,153,.12), transparent 30%),
            linear-gradient(135deg, #0b1020 0%, #111827 52%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 16px;
        }

        .action-terminal {
          width: 100%;
          max-width: 760px;
          border: 0;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 28px 80px rgba(0,0,0,.38);
        }

        .action-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 28px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }

        .action-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .action-brand-mark {
          width: 48px;
          height: 48px;
          flex: 0 0 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 21px;
          font-weight: 800;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }

        .action-online {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          color: #15803d;
          font-size: 12px;
          font-weight: 700;
        }

        .action-online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34,197,94,.12);
        }

        .action-content {
          padding: 42px 28px;
          background: #fff;
          text-align: center;
        }

        .action-avatar {
          width: 82px;
          height: 82px;
          margin: 0 auto 15px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 30px;
          font-weight: 800;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          box-shadow: 0 10px 28px rgba(79,70,229,.22);
        }

        .action-panel {
          width: 100%;
          max-width: 560px;
          margin: 28px auto 0;
          padding: 26px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #f8fafc;
          text-align: left;
        }

        .action-panel-title {
          color: #111827;
          text-align: center;
          font-size: 27px;
          line-height: 1.2;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .action-panel-description {
          color: #64748b;
          text-align: center;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .action-field-label {
          display: block;
          margin-bottom: 7px;
          color: #374151;
          font-size: 13px;
          font-weight: 700;
        }

        .action-main-button {
          width: 100%;
          min-height: 58px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 800;
        }

        .action-secondary-button {
          width: 100%;
          min-height: 52px;
          margin-top: 10px;
          border-radius: 12px;
          font-weight: 700;
        }

        .action-emergency-button {
          width: 100%;
          min-height: 50px;
          margin-top: 18px;
          border-radius: 12px;
          border-width: 1.5px;
          font-weight: 800;
        }

        .action-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 28px;
          background: #fafafa;
          border-top: 1px solid #e5e7eb;
          color: #94a3b8;
          font-size: 12px;
        }

        @media (max-width: 575px) {
          .action-screen {
            padding: 12px;
            align-items: flex-start;
          }

          .action-terminal {
            border-radius: 18px;
            margin: auto 0;
          }

          .action-header {
            padding: 16px;
          }

          .action-brand-mark {
            width: 42px;
            height: 42px;
            flex-basis: 42px;
          }

          .action-content {
            padding: 30px 16px;
          }

          .action-panel {
            padding: 20px 16px;
            margin-top: 22px;
          }

          .action-panel-title {
            font-size: 24px;
          }

          .action-online {
            font-size: 11px;
          }

          .action-footer {
            padding: 14px 16px;
          }
        }
      `}</style>

      <CCard className="action-terminal">
        <div className="action-header">
          <div className="action-brand">
            <div className="action-brand-mark">P</div>

            <div>
              <div
                style={{
                  color: '#111827',
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                PRINCESS SALON
              </div>

              <div
                style={{
                  color: '#64748b',
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Staff Attendance Terminal
              </div>
            </div>
          </div>

          <div className="action-online">
            <span className="action-online-dot" />
            Kiosk Online
          </div>
        </div>

        <CCardBody className="action-content">
          <div className="action-avatar">{initials}</div>

          <div
            style={{
              color: '#64748b',
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            Welcome
          </div>

          <h1
            style={{
              color: '#111827',
              fontSize: 'clamp(24px, 4vw, 31px)',
              lineHeight: 1.2,
              fontWeight: 800,
              marginBottom: 5,
              overflowWrap: 'anywhere',
            }}
          >
            {staffName}
          </h1>

          <div style={{ color: '#64748b', fontSize: 14 }}>
            {staff?.position || staff?.role || 'Staff'}
          </div>

          <div className="action-panel">
            <div
              style={{
                color: '#64748b',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.2,
                marginBottom: 8,
              }}
            >
              ATTENDANCE ACTION
            </div>

            <div className="action-panel-title">{action?.title || 'ACTION UNAVAILABLE'}</div>

            <div className="action-panel-description">
              {action?.description ||
                'Your next attendance action could not be determined. Please scan your staff card again.'}
            </div>

            {nextAction === 'goout' && (
              <div className="mb-4">
                <label className="action-field-label" htmlFor="goout-reason">
                  Reason for leaving
                </label>

                <CFormSelect
                  id="goout-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  size="lg"
                  disabled={loading}
                  className="mb-3"
                >
                  <option value="restroom">Restroom</option>
                  <option value="buy_material">Buy materials</option>
                  <option value="bank">Bank</option>
                  <option value="lunch">Lunch</option>
                  <option value="official">Official assignment</option>
                  <option value="personal">Personal</option>
                </CFormSelect>

                <label className="action-field-label" htmlFor="expected-return">
                  Expected return
                </label>

                <CFormSelect
                  id="expected-return"
                  value={expectedReturn}
                  onChange={(event) => setExpectedReturn(Number(event.target.value))}
                  size="lg"
                  disabled={loading}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </CFormSelect>
              </div>
            )}

            {error && (
              <CAlert color="danger" className="mb-3" dismissible onClose={() => setError('')}>
                {error}
              </CAlert>
            )}

            <CButton
              color={action?.color || 'secondary'}
              size="lg"
              disabled={loading || !action || !verificationToken || !staff?.qrCode}
              onClick={() => submitAction()}
              className="action-main-button"
            >
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                action?.title || 'UNAVAILABLE'
              )}
            </CButton>

            <CButton
              color="light"
              size="lg"
              disabled={loading}
              onClick={handleCancel}
              className="action-secondary-button"
            >
              Cancel
            </CButton>

            {canEmergencyClockOut && (
              <>
                <CButton
                  color="danger"
                  variant="outline"
                  size="lg"
                  disabled={loading || !verificationToken || !staff?.qrCode}
                  onClick={() => submitAction({ emergency: true })}
                  className="action-emergency-button"
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    'EMERGENCY CLOCK OUT'
                  )}
                </CButton>

                <div
                  className="small text-body-secondary mt-2"
                  style={{
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  Use only when you need to end your attendance before the normal clock-out process.
                </div>
              </>
            )}
          </div>
        </CCardBody>

        <div className="action-footer">
          <span>© {new Date().getFullYear()} Princess Salon</span>
          <span>Secure Staff Attendance</span>
        </div>
      </CCard>
    </div>
  )
}

export default ActionScreen
