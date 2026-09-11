import { useState } from 'react'

import { CCard, CCardBody, CButton, CFormSelect, CSpinner, CAlert } from '@coreui/react'

import { clockIn, goOut, returnBack, clockOut } from '../services/kioskApi'

const ActionScreen = ({ staff, nextAction, setScreen, setSuccessData }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [reason, setReason] = useState('restroom')
  const [expectedReturn, setExpectedReturn] = useState(15)

  const performAction = async () => {
    if (loading) return

    try {
      setLoading(true)
      setError('')

      const payload = {
        qrCode: staff.qrCode,
      }

      let response

      switch (nextAction) {
        case 'clockin':
          response = await clockIn(payload)
          break

        case 'goout':
          response = await goOut({
            qrCode: staff.qrCode,
            reason,
            expectedReturn,
          })
          break

        case 'return':
          response = await returnBack(payload)
          break

        case 'clockout':
          response = await clockOut(payload)
          break

        default:
          throw new Error('Invalid attendance action')
      }

      console.log('Kiosk action successful:', response)
      setSuccessData({
        action: nextAction,
        response: response.data,
      })
      setScreen('success')
    } catch (err) {
      console.error('Kiosk action failed:', err)

      setError(err.response?.data?.message || err.message || 'Operation Failed')
    } finally {
      setLoading(false)
    }
  }

  const getButtonColor = () => {
    switch (nextAction) {
      case 'clockin':
        return 'success'

      case 'goout':
        return 'warning'

      case 'return':
        return 'info'

      case 'clockout':
        return 'danger'

      default:
        return 'primary'
    }
  }

  const getTitle = () => {
    switch (nextAction) {
      case 'clockin':
        return 'CLOCK IN'

      case 'goout':
        return 'GO OUT'

      case 'return':
        return 'RETURN'

      case 'clockout':
        return 'CLOCK OUT'

      default:
        return 'CONTINUE'
    }
  }

  const getDescription = () => {
    switch (nextAction) {
      case 'clockin':
        return 'Confirm your attendance for today'

      case 'goout':
        return 'Record that you are leaving the salon'

      case 'return':
        return 'Confirm that you have returned to the salon'

      case 'clockout':
        return 'Complete your attendance for today'

      default:
        return ''
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0b1020 0%, #111827 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.08)',
          filter: 'blur(80px)',
          top: -200,
          left: -150,
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'rgba(236,72,153,0.06)',
          filter: 'blur(80px)',
          bottom: -200,
          right: -150,
        }}
      />

      {/* Main terminal */}
      <CCard
        className="border-0"
        style={{
          width: '100%',
          maxWidth: 900,
          borderRadius: 28,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 2,
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '25px 35px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              P
            </div>

            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#111827',
                }}
              >
                PRINCESS SALON
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: '#6b7280',
                  marginTop: 2,
                }}
              >
                Staff Attendance Terminal
              </div>
            </div>
          </div>

          <div className="text-end">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
                fontSize: 13,
                color: '#16a34a',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  background: '#22c55e',
                  borderRadius: '50%',
                  display: 'inline-block',
                }}
              />
              Kiosk Online
            </div>
          </div>
        </div>

        <CCardBody
          style={{
            padding: '55px 50px',
            textAlign: 'center',
          }}
        >
          {/* Staff avatar */}
          <div
            style={{
              width: 90,
              height: 90,
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 32,
              fontWeight: 800,
              boxShadow: '0 10px 30px rgba(79,70,229,0.25)',
            }}
          >
            {staff?.fullname?.charAt(0)?.toUpperCase()}
          </div>

          <div
            style={{
              fontSize: 14,
              color: '#6b7280',
              marginBottom: 6,
            }}
          >
            Welcome
          </div>

          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: 5,
            }}
          >
            {staff?.fullname}
          </h1>

          <div
            style={{
              fontSize: 15,
              color: '#6b7280',
              marginBottom: 35,
            }}
          >
            {staff?.position}
          </div>

          {/* Action */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: 20,
              padding: 30,
              maxWidth: 650,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              Attendance Action
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: '#111827',
                marginBottom: 8,
              }}
            >
              {getTitle()}
            </div>

            <div
              style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 25,
              }}
            >
              {getDescription()}
            </div>

            {/* GO OUT options */}
            {nextAction === 'goout' && (
              <div
                style={{
                  textAlign: 'left',
                  marginBottom: 25,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Reason for Leaving
                </label>

                <CFormSelect
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mb-4"
                  size="lg"
                >
                  <option value="restroom">Restroom</option>

                  <option value="buy_material">Buy Materials</option>

                  <option value="bank">Bank</option>

                  <option value="lunch">Lunch</option>

                  <option value="official">Official Assignment</option>

                  <option value="personal">Personal</option>
                </CFormSelect>

                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                    display: 'block',
                  }}
                >
                  Expected Return
                </label>

                <CFormSelect
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(Number(e.target.value))}
                  size="lg"
                >
                  <option value={15}>15 Minutes</option>

                  <option value={30}>30 Minutes</option>

                  <option value={45}>45 Minutes</option>

                  <option value={60}>60 Minutes</option>
                </CFormSelect>
              </div>
            )}

            {/* Error */}
            {error && (
              <CAlert color="danger" className="mb-4">
                {error}
              </CAlert>
            )}

            {/* Confirm */}
            <CButton
              color={getButtonColor()}
              size="lg"
              disabled={loading}
              onClick={performAction}
              style={{
                width: '100%',
                minHeight: 60,
                borderRadius: 14,
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                getTitle()
              )}
            </CButton>

            {/* Cancel */}
            <CButton
              color="light"
              size="lg"
              disabled={loading}
              onClick={() => setScreen('scan')}
              style={{
                width: '100%',
                minHeight: 55,
                marginTop: 12,
                borderRadius: 14,
                fontWeight: 600,
              }}
            >
              Cancel
            </CButton>
          </div>
        </CCardBody>

        {/* Footer */}
        <div
          style={{
            padding: '18px 35px',
            borderTop: '1px solid #e5e7eb',
            background: '#fafafa',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          <span>© {new Date().getFullYear()} Princess Salon</span>

          <span>Secure Staff Attendance</span>
        </div>
      </CCard>
    </div>
  )
}

export default ActionScreen
