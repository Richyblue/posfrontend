import { useEffect, useRef, useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react'

import axios from 'axios'
import html2canvas from 'html2canvas'

const API_URL = import.meta.env.VITE_BACKEND_URL

const StaffIDCardModal = ({ visible, onClose, staff }) => {
  const [loading, setLoading] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState('')

  const cardRef = useRef(null)

  /*
   * ROBUST STAFF NAME HANDLER
   * Supports different possible backend field names.
   */
  const getStaffName = () => {
    if (!staff) return 'Staff Member'

    const possibleNames = [
      staff.fullname,
      staff.fullName,
      staff.name,
      staff.staffName,
      staff.staff_name,
      staff.displayName,
      staff.display_name,
      staff.username,
      [staff.firstName, staff.lastName].filter(Boolean).join(' '),
      [staff.first_name, staff.last_name].filter(Boolean).join(' '),
    ]

    const validName = possibleNames.find(
      (name) => typeof name === 'string' && name.trim().length > 0,
    )

    return validName?.trim() || 'Staff Member'
  }

  const getStaffInitials = () => {
    const name = getStaffName()

    if (!name || name === 'Staff Member') {
      return 'SM'
    }

    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('')

    return initials || 'SM'
  }

  const getStaffPosition = () => {
    return (
      staff?.position ||
      staff?.role ||
      staff?.jobTitle ||
      staff?.job_title ||
      staff?.department ||
      'Staff Member'
    )
  }

  const getStaffId = () => {
    return (
      staff?.staffId ||
      staff?.staff_id ||
      staff?.employeeId ||
      staff?.employee_id ||
      staff?.id ||
      'N/A'
    )
  }

  const getStaffPhoto = () => {
    return (
      staff?.profileImage ||
      staff?.profile_image ||
      staff?.photo ||
      staff?.image ||
      staff?.avatar ||
      ''
    )
  }

  const formatDate = (date = new Date()) => {
    return new Date(date).toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Lagos',
    })
  }

  useEffect(() => {
    if (!visible || !staff?.id) return

    const loadQRCode = async () => {
      try {
        setLoading(true)
        setError('')
        setQrImage('')
        setQrCode('')

        const token = localStorage.getItem('token')

        const response = await axios.get(`${API_URL}api/v1/${staff.id}/qrcode`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setQrImage(response.data?.qrImage || '')
        setQrCode(response.data?.qrCode || '')
      } catch (error) {
        console.error('Failed to load QR code:', error)

        setError(
          error?.response?.data?.message || 'Unable to generate staff QR code. Please try again.',
        )
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

    if (!printWindow) {
      setError('Please allow pop-ups in your browser to print the card.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${getStaffName()} - Staff ID Card</title>

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: Arial, sans-serif;
            }

            .print-card {
              width: 380px !important;
              height: 600px !important;
              margin: 20px auto !important;
              box-shadow: none !important;
              transform: none !important;
            }

            @media print {
              @page {
                size: auto;
                margin: 0;
              }

              body {
                padding: 0;
                background: white;
              }

              .print-card {
                margin: 0 !important;
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
    }, 700)
  }

  const downloadAsJPG = async () => {
    if (!cardRef.current) return

    try {
      setLoading(true)
      setError('')

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imageURL = canvas.toDataURL('image/jpeg', 0.95)

      const downloadLink = document.createElement('a')

      downloadLink.href = imageURL
      downloadLink.download = `${getStaffName()
        .replace(/\s+/g, '-')
        .toLowerCase()}-staff-id-card.jpg`

      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    } catch (error) {
      console.error('Failed to download ID card:', error)
      setError('Unable to download the ID card as JPG.')
    } finally {
      setLoading(false)
    }
  }

  const staffName = getStaffName()
  const staffInitials = getStaffInitials()
  const staffPosition = getStaffPosition()
  const staffId = getStaffId()
  const staffPhoto = getStaffPhoto()

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" backdrop="static">
      <CModalHeader>
        <CModalTitle className="fw-bold">Staff Identification Card</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {error && (
          <CAlert color="danger" className="mb-4">
            {error}
          </CAlert>
        )}

        <div className="text-center">
          {loading ? (
            <div
              style={{
                padding: 80,
              }}
            >
              <CSpinner color="primary" size="lg" />

              <div className="mt-3 text-muted">Preparing staff ID card...</div>
            </div>
          ) : (
            <div
              ref={cardRef}
              className="print-card"
              style={{
                width: 380,
                height: 600,
                margin: '0 auto',
                borderRadius: 26,
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)',
                border: '1px solid #e2e8f0',
                position: 'relative',
                fontFamily: 'Inter, Arial, Helvetica, sans-serif',
                color: '#0f172a',
              }}
            >
              {/* TOP BRANDING SECTION */}
              <div
                style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #111827 0%, #312e81 55%, #7c3aed 100%)',
                  padding: '28px 24px 48px',
                  color: '#ffffff',
                  textAlign: 'center',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    top: -100,
                    right: -60,
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    bottom: -80,
                    left: -40,
                  }}
                />

                <div
                  style={{
                    position: 'relative',
                    fontSize: 21,
                    fontWeight: 900,
                    letterSpacing: 2,
                  }}
                >
                  PRINCESS CUTZ
                </div>

                <div
                  style={{
                    position: 'relative',
                    marginTop: 7,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 2.5,
                    color: '#ddd6fe',
                  }}
                >
                  PREMIUM GROOMING EXPERIENCE
                </div>

                <div
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    marginTop: 18,
                    padding: '7px 14px',
                    borderRadius: 30,
                    border: '1px solid rgba(255,255,255,0.35)',
                    background: 'rgba(255,255,255,0.12)',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                  }}
                >
                  STAFF IDENTIFICATION
                </div>
              </div>

              {/* STAFF PROFILE SECTION */}
              <div
                style={{
                  position: 'relative',
                  marginTop: -38,
                  textAlign: 'center',
                  padding: '0 24px',
                }}
              >
                <div
                  style={{
                    width: 92,
                    height: 92,
                    margin: '0 auto 15px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #eef2ff, #ddd6fe)',
                    border: '5px solid #ffffff',
                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    color: '#4338ca',
                    fontSize: 30,
                    fontWeight: 900,
                  }}
                >
                  {staffPhoto ? (
                    <img
                      src={staffPhoto}
                      alt={staffName}
                      crossOrigin="anonymous"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    staffInitials
                  )}
                </div>

                <div
                  style={{
                    fontSize: 23,
                    fontWeight: 900,
                    lineHeight: 1.2,
                    color: '#111827',
                    wordBreak: 'break-word',
                  }}
                >
                  {staffName}
                </div>

                <div
                  style={{
                    marginTop: 7,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#6366f1',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {staffPosition}
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    marginTop: 12,
                    padding: '6px 13px',
                    borderRadius: 20,
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#22c55e',
                    }}
                  />
                  ACTIVE STAFF
                </div>
              </div>

              {/* STAFF INFORMATION */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  margin: '22px 24px 12px',
                }}
              >
                <div
                  style={{
                    padding: '11px 13px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#94a3b8',
                      letterSpacing: 1,
                    }}
                  >
                    STAFF ID
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#1e293b',
                      wordBreak: 'break-word',
                    }}
                  >
                    {staffId}
                  </div>
                </div>

                <div
                  style={{
                    padding: '11px 13px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#94a3b8',
                      letterSpacing: 1,
                    }}
                  >
                    ISSUE DATE
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 12,
                      fontWeight: 900,
                      color: '#1e293b',
                    }}
                  >
                    {formatDate()}
                  </div>
                </div>
              </div>

              {/* QR CODE SECTION */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '8px 24px 100px',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  SECURE ATTENDANCE QR CODE
                </div>

                <div
                  style={{
                    width: 172,
                    height: 172,
                    margin: '0 auto',
                    padding: 9,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  {qrImage ? (
                    <img
                      src={qrImage}
                      alt="Staff QR Code"
                      crossOrigin="anonymous"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#94a3b8',
                      }}
                    >
                      QR unavailable
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 9,
                    color: '#64748b',
                    wordBreak: 'break-all',
                    marginTop: 8,
                  }}
                >
                  {qrCode || 'QR code generated for attendance'}
                </div>
              </div>

              {/* FOOTER */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '17px 24px',
                  background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
                  borderTop: '1px solid #e2e8f0',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: 1.2,
                  }}
                >
                  PROPERTY OF PRINCESS CUTZ
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: '#312e81',
                    marginTop: 5,
                    letterSpacing: 0.5,
                  }}
                >
                  SCAN FOR STAFF ATTENDANCE
                </div>

                <div
                  style={{
                    fontSize: 9,
                    color: '#94a3b8',
                    marginTop: 5,
                  }}
                >
                  If found, please return to Princess Cutz.
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

        <CButton color="dark" disabled={loading || !qrImage} onClick={downloadAsJPG}>
          Download JPG
        </CButton>

        <CButton color="primary" disabled={loading || !qrImage} onClick={printCard}>
          Print ID Card
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default StaffIDCardModal
