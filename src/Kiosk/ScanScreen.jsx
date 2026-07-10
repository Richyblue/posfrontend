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
      className="d-flex justify-content-center align-items-center"
      style={{
        height: '100vh',
        background: '#f4f6f9',
      }}
    >
      <CCard
        className="shadow-sm border-0"
        style={{
          width: 750,
          borderRadius: 20,
        }}
      >
        <CCardBody className="text-center p-5">
          <h1 className="fw-bold text-primary">PRINCESS SALON</h1>

          <h4 className="text-muted">Staff Attendance Kiosk</h4>

          <hr />

          <LiveClock />

          <div className="my-4">
            {loading ? (
              <div
                style={{
                  height: 300,
                }}
                className="d-flex justify-content-center align-items-center"
              >
                <CSpinner size="lg" />
              </div>
            ) : (
              <QRScanner onSuccess={handleScan} />
            )}
          </div>

          {error && <CAlert color="danger">{error}</CAlert>}

          <h3 className="mt-3 fw-bold">Scan Your Staff QR Card</h3>

          <p className="text-medium-emphasis">Hold your staff card in front of the camera</p>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default ScanScreen
