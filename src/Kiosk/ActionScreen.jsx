import { useState } from 'react'

import { CCard, CCardBody, CButton, CFormSelect, CSpinner, CAlert } from '@coreui/react'

import { clockIn, goOut, returnBack, clockOut } from '../services/kioskApi'

const ActionScreen = ({ staff, nextAction, setScreen }) => {
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  const [reason, setReason] = useState('Restroom')

  const [expectedReturn, setExpectedReturn] = useState(15)

  const performAction = async () => {
    try {
      setLoading(true)

      const payload = {
        qrCode: staff.qrCode,
      }

      switch (nextAction) {
        case 'clockin':
          await clockIn(payload)
          break

        case 'goout':
          await goOut({
            qrCode: staff.qrCode,
            reason,
            expectedReturn,
          })
          break

        case 'return':
          await returnBack(payload)
          break

        case 'clockout':
          await clockOut(payload)
          break

        default:
          break
      }

      setScreen('success')
    } catch (err) {
      console.error(err)

      setError(err.response?.data?.message || 'Operation Failed')
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
        return ''
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
        className="shadow-lg border-0"
        style={{
          width: 700,
          borderRadius: 20,
        }}
      >
        <CCardBody className="text-center p-5">
          <h2 className="fw-bold">Welcome</h2>

          <h1 className="text-primary">{staff.fullname}</h1>

          <h5 className="text-muted">{staff.position}</h5>

          <hr />

          {nextAction === 'goout' && (
            <>
              <CFormSelect
                className="mb-3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option>Restroom</option>

                <option>Buy Materials</option>

                <option>Bank</option>

                <option>Official Assignment</option>

                <option>Personal</option>
              </CFormSelect>

              <CFormSelect
                className="mb-4"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
              >
                <option value={15}>15 Minutes</option>

                <option value={30}>30 Minutes</option>

                <option value={45}>45 Minutes</option>

                <option value={60}>60 Minutes</option>
              </CFormSelect>
            </>
          )}

          {error && <CAlert color="danger">{error}</CAlert>}

          <CButton
            color={getButtonColor()}
            size="lg"
            className="px-5 py-3"
            disabled={loading}
            onClick={performAction}
          >
            {loading ? <CSpinner size="sm" /> : getTitle()}
          </CButton>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default ActionScreen
