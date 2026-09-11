import { useEffect, useRef, useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
} from '@coreui/react'

import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

const StaffIDCardModal = ({ visible, onClose, staff }) => {
  const [loading, setLoading] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [qrCode, setQrCode] = useState('')

  const cardRef = useRef(null)

  useEffect(() => {
    if (!visible || !staff?.id) return

    const loadQRCode = async () => {
      try {
        setLoading(true)

        const token = localStorage.getItem('token')

        const response = await axios.get(`${API_URL}api/v1/${staff.id}/qrcode`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setQrImage(response.data.qrImage)
        setQrCode(response.data.qrCode)
      } catch (error) {
        console.error('Failed to load QR code:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQRCode()
  }, [visible, staff])

  const printCard = () => {
    const cardHTML = cardRef.current?.outerHTML

    if (!cardHTML) return

    const printWindow = window.open('', '_blank', 'width=600,height=800')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Staff ID Card</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 30px;
              background: #f3f4f6;
              font-family: Arial, sans-serif;
            }

            .print-card {
              width: 350px;
              height: 550px;
              margin: auto;
            }

            @media print {
              body {
                padding: 0;
                background: white;
              }

              .print-card {
                margin: 0;
              }
            }
          </style>
        </head>

        <body>
          ${cardHTML}
        </body>
      </html>
    `)

    printWindow.document.close()

    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center">
      <CModalHeader>
        <CModalTitle>Staff ID Card</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div className="text-center">
          {loading ? (
            <div
              style={{
                padding: 80,
              }}
            >
              <CSpinner />

              <div className="mt-3 text-muted">Generating QR Code...</div>
            </div>
          ) : (
            <div
              ref={cardRef}
              className="print-card"
              style={{
                width: 350,
                height: 550,
                margin: '0 auto',
                borderRadius: 22,
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                border: '1px solid #e5e7eb',
                position: 'relative',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {/* HEADER */}

              <div
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  padding: '25px 20px 30px',
                  color: '#fff',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2,
                  }}
                >
                  PRINCESS SALON
                </div>

                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.85,
                    marginTop: 5,
                  }}
                >
                  STAFF IDENTIFICATION CARD
                </div>
              </div>

              {/* STAFF */}

              <div
                style={{
                  textAlign: 'center',
                  padding: '25px 20px 10px',
                }}
              >
                <div
                  style={{
                    width: 75,
                    height: 75,
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4f46e5',
                    fontSize: 28,
                    fontWeight: 800,
                  }}
                >
                  {staff?.fullname?.charAt(0)?.toUpperCase()}
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#111827',
                  }}
                >
                  {staff?.fullname}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  {staff?.position || 'Staff'}
                </div>
              </div>

              {/* QR */}

              <div
                style={{
                  textAlign: 'center',
                  padding: '10px 20px',
                }}
              >
                {qrImage && (
                  <img
                    src={qrImage}
                    alt="Staff QR Code"
                    style={{
                      width: 170,
                      height: 170,
                      objectFit: 'contain',
                    }}
                  />
                )}

                <div
                  style={{
                    fontSize: 9,
                    color: '#6b7280',
                    wordBreak: 'break-all',
                    marginTop: 5,
                  }}
                >
                  {qrCode}
                </div>
              </div>

              {/* FOOTER */}

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '14px 20px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: '#6b7280',
                  }}
                >
                  SCAN QR CODE FOR
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#111827',
                    marginTop: 3,
                  }}
                >
                  STAFF ATTENDANCE
                </div>
              </div>
            </div>
          )}
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Close
        </CButton>

        <CButton color="primary" disabled={loading || !qrImage} onClick={printCard}>
          Print ID Card
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default StaffIDCardModal
