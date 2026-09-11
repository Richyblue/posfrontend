import { useState } from 'react'

import { CCard, CCardBody, CSpinner, CAlert } from '@coreui/react'

import LiveClock from '../components/LiveClock'
import QRScanner from '../components/QRScanner'

import { scanQR } from '../services/kioskApi'

const ScanScreen = ({ setScreen, setStaff, setNextAction }) => {
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const handleScan = async (qrCode) => {
    if (loading) return

    try {
      setLoading(true)

      setError('')

      const response = await scanQR({
        qrCode,
      })

      setStaff(response.data.staff)

      setNextAction(response.data.nextAction)

      setScreen('action')
    } catch (err) {
      console.error(err)

      setError(err.response?.data?.message || 'Invalid Staff Card')

      setTimeout(() => {
        setError('')
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="kiosk-screen"
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0b1020 0%, #111827 50%, #0f172a 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '30px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.08)',
          filter: 'blur(80px)',
          top: '-200px',
          left: '-150px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'rgba(236, 72, 153, 0.06)',
          filter: 'blur(80px)',
          bottom: '-200px',
          right: '-150px',
        }}
      />

      {/* Main kiosk */}
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          minHeight: '720px',
          background: 'rgba(255, 255, 255, 0.97)',
          borderRadius: '28px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '25px 35px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            {/* Logo */}
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
                  letterSpacing: '0.5px',
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

          {/* Live status */}
          <div className="text-end">
            <div
              className="d-flex align-items-center justify-content-end gap-2"
              style={{
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
                  boxShadow: '0 0 0 5px rgba(34,197,94,0.12)',
                }}
              />
              Kiosk Online
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              Secure Attendance System
            </div>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '45px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 850,
              textAlign: 'center',
            }}
          >
            {/* Clock */}
            <div
              style={{
                marginBottom: 10,
              }}
            >
              <LiveClock />
            </div>

            <div
              style={{
                fontSize: 14,
                color: '#6b7280',
                marginBottom: 30,
              }}
            >
              Welcome to today's attendance
            </div>

            {/* Scanner area */}
            <div
              style={{
                width: '100%',
                maxWidth: 620,
                margin: '0 auto',
                padding: 18,
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 24,
                boxShadow: '0 12px 35px rgba(15,23,42,0.08)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  borderRadius: 18,
                  overflow: 'hidden',
                  background: '#0f172a',
                  minHeight: 420,
                }}
              >
                {/* Scanner loading */}
                {loading ? (
                  <div
                    style={{
                      minHeight: 420,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                    }}
                  >
                    <CSpinner
                      style={{
                        width: 55,
                        height: 55,
                      }}
                    />

                    <div
                      style={{
                        marginTop: 22,
                        fontSize: 18,
                        fontWeight: 600,
                      }}
                    >
                      Verifying Staff ID
                    </div>

                    <div
                      style={{
                        marginTop: 7,
                        fontSize: 13,
                        color: '#94a3b8',
                      }}
                    >
                      Please wait...
                    </div>
                  </div>
                ) : (
                  <QRScanner onSuccess={handleScan} />
                )}

                {/* Scanner instruction overlay */}
                {!loading && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 18,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15,23,42,0.85)',
                      backdropFilter: 'blur(10px)',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: 30,
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Position your QR card inside the frame
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  margin: '22px auto 0',
                  maxWidth: 620,
                  padding: '14px 20px',
                  borderRadius: 14,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {/* Instruction */}
            {!error && !loading && (
              <div
                style={{
                  marginTop: 25,
                }}
              >
                <div
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    color: '#111827',
                  }}
                >
                  Scan Your Staff QR Card
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: '#6b7280',
                    fontSize: 14,
                  }}
                >
                  Your attendance will be recorded automatically
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '18px 35px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fafafa',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            © {new Date().getFullYear()} Princess Salon
          </div>

          <div
            style={{
              fontSize: 12,
              color: '#9ca3af',
            }}
          >
            Secure Staff Attendance
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScanScreen
