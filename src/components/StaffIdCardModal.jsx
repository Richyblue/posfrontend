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
import html2canvas from 'html2canvas'

const API_URL = import.meta.env.VITE_BACKEND_URL

const StaffIDCardModal = ({ visible, onClose, staff }) => {
  const [loading, setLoading] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [staffPhoto, setStaffPhoto] = useState('')
  const [staffSignature, setStaffSignature] = useState('')
  const [mediaError, setMediaError] = useState(false)

  const cardRef = useRef(null)

  const fullname = staff?.User?.fullname || 'Staff Member'
  const position = staff?.position || 'Staff'
  const staffId = staff?.id || ''

  const initials = fullname
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()

  // LOAD STAFF QR CODE, PHOTOGRAPH AND SIGNATURE
  useEffect(() => {
    if (!visible || !staff?.id) return

    let isMounted = true

    const loadStaffCardData = async () => {
      try {
        setLoading(true)
        setQrImage('')
        setQrCode('')
        setStaffPhoto('')
        setStaffSignature('')
        setMediaError(false)

        const token = localStorage.getItem('token')

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }

        const [qrResult, mediaResult] = await Promise.allSettled([
          axios.get(`${API_URL}api/v1/${staff.id}/qrcode`, config),
          axios.get(`${API_URL}api/v1/staff/${staff.id}/media`, config),
        ])

        if (!isMounted) return

        if (qrResult.status === 'fulfilled') {
          setQrImage(qrResult.value.data.qrImage || '')
          setQrCode(qrResult.value.data.qrCode || '')
        } else {
          console.error('Failed to load QR code:', qrResult.reason)
        }

        if (mediaResult.status === 'fulfilled') {
          setStaffPhoto(mediaResult.value.data.photo || '')
          setStaffSignature(mediaResult.value.data.signature || '')
        } else {
          console.error('Failed to load staff media:', mediaResult.reason)
          setMediaError(true)
        }
      } catch (error) {
        console.error('Failed to load staff ID card:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadStaffCardData()

    return () => {
      isMounted = false
    }
  }, [visible, staff?.id])

  // GENERATE A SAFE FILE NAME
  const getFileName = (extension) => {
    const safeName = fullname
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')

    return `${safeName || 'staff'}-ID-card.${extension}`
  }

  // DOWNLOAD CARD AS PNG, JPG OR JPEG
  const downloadCard = async (format) => {
    if (!cardRef.current || !qrImage) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
      })

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
      const quality = format === 'png' ? undefined : 0.98

      const imageUrl = canvas.toDataURL(mimeType, quality)

      const link = document.createElement('a')
      link.href = imageUrl
      link.download = getFileName(format)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to download ID card:', error)
      alert('Unable to download ID card. Please try again.')
    }
  }

  // PRINT ID CARD
  const printCard = () => {
    const cardHTML = cardRef.current?.outerHTML

    if (!cardHTML) return

    const printWindow = window.open('', '_blank', 'width=600,height=850')

    if (!printWindow) {
      alert('Please allow pop-ups to print the ID card.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fullname} - Staff ID Card</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 25px;
              background: #f3f4f6;
              font-family: Arial, sans-serif;
            }

            .print-card {
              width: 380px;
              height: 650px;
              margin: auto;
              box-shadow: none !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            @media print {
              body {
                padding: 0;
                background: white;
              }

              .print-card {
                margin: 0 auto;
                page-break-inside: avoid;
              }

              @page {
                margin: 10mm;
              }
            }
          </style>
        </head>

        <body>
          ${cardHTML}

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.focus()
                window.print()
                window.close()
              }, 500)
            }
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" backdrop="static">
      <CModalHeader>
        <CModalTitle className="fw-bold">
          <i className="fas fa-id-card me-2 text-primary"></i>
          Premium Staff ID Card
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div className="text-center">
          {loading ? (
            <div style={{ padding: 90 }}>
              <CSpinner color="primary" size="lg" />
              <div className="mt-3 text-muted">Preparing staff ID card...</div>
            </div>
          ) : !qrImage ? (
            <div className="py-5">
              <i className="fas fa-qrcode text-danger" style={{ fontSize: 45 }}></i>

              <h6 className="mt-3 fw-bold">QR Code Unavailable</h6>

              <p className="text-muted mb-0">
                The attendance QR code could not be loaded. Please try again.
              </p>
            </div>
          ) : (
            <>
              {/* PREMIUM STAFF ID CARD */}

              <div
                ref={cardRef}
                className="print-card"
                style={{
                  width: 380,
                  height: 650,
                  maxWidth: '100%',
                  margin: '0 auto',
                  borderRadius: 24,
                  overflow: 'hidden',
                  background: '#ffffff',
                  boxShadow: '0 22px 55px rgba(31, 41, 55, 0.20)',
                  border: '1px solid #e5e7eb',
                  position: 'relative',
                  fontFamily: 'Arial, sans-serif',
                  color: '#111827',
                }}
              >
                {/* TOP BRAND HEADER */}

                <div
                  style={{
                    height: 145,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    textAlign: 'center',
                    padding: '24px 18px 35px',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: 21,
                      fontWeight: 900,
                      letterSpacing: 2.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    PRINCESS CUTZ
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2,
                      marginTop: 7,
                      opacity: 0.9,
                    }}
                  >
                    STAFF IDENTIFICATION
                  </div>

                  <div
                    style={{
                      width: 45,
                      height: 3,
                      background: '#ffffff',
                      margin: '15px auto 0',
                      borderRadius: 10,
                      opacity: 0.85,
                    }}
                  />

                  {/* DECORATIVE HEADER CIRCLE */}

                  <div
                    style={{
                      position: 'absolute',
                      width: 130,
                      height: 130,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.13)',
                      top: -65,
                      right: -35,
                    }}
                  />
                </div>

                {/* STAFF PHOTOGRAPH */}

                <div
                  style={{
                    textAlign: 'center',
                    marginTop: -58,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: '50%',
                      margin: '0 auto',
                      padding: 5,
                      background: '#ffffff',
                      border: '3px solid #7c3aed',
                      boxShadow: '0 7px 20px rgba(79,70,229,0.22)',
                    }}
                  >
                    {staffPhoto ? (
                      <img
                        src={staffPhoto}
                        alt={fullname}
                        crossOrigin="anonymous"
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: 34,
                          fontWeight: 900,
                        }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 11,
                      fontSize: 20,
                      fontWeight: 900,
                      color: '#111827',
                      textTransform: 'uppercase',
                      padding: '0 15px',
                      lineHeight: 1.2,
                    }}
                  >
                    {fullname}
                  </div>

                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: 7,
                      padding: '5px 17px',
                      borderRadius: 30,
                      background: '#ede9fe',
                      color: '#5b21b6',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {position}
                  </div>
                </div>

                {/* QR ATTENDANCE SECTION */}

                <div
                  style={{
                    margin: '19px 25px 0',
                    padding: '15px 12px 12px',
                    border: '2px solid #6d28d9',
                    borderRadius: 17,
                    background: 'linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)',
                    textAlign: 'center',
                    boxShadow: '0 5px 18px rgba(109,40,217,0.10)',
                  }}
                >
                  <div
                    style={{
                      color: '#5b21b6',
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 1.5,
                      marginBottom: 10,
                    }}
                  >
                    STAFF ATTENDANCE QR
                  </div>

                  <div
                    style={{
                      width: 205,
                      height: 205,
                      maxWidth: '100%',
                      margin: '0 auto',
                      padding: 7,
                      background: '#ffffff',
                      border: '3px solid #4f46e5',
                      borderRadius: 12,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={qrImage}
                      alt="Staff Attendance QR Code"
                      crossOrigin="anonymous"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 9,
                      color: '#6b7280',
                      fontWeight: 700,
                      marginTop: 8,
                      wordBreak: 'break-all',
                    }}
                  >
                    {qrCode}
                  </div>

                  <div
                    style={{
                      marginTop: 7,
                      fontSize: 10,
                      color: '#4f46e5',
                      fontWeight: 900,
                      letterSpacing: 1,
                    }}
                  >
                    SCAN TO RECORD ATTENDANCE
                  </div>
                </div>

                {/* STAFF INFORMATION AND SIGNATURE */}

                <div
                  style={{
                    margin: '14px 25px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    gap: 12,
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: '#9ca3af',
                        fontWeight: 800,
                        letterSpacing: 1,
                      }}
                    >
                      STAFF ID
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: '#312e81',
                        fontWeight: 900,
                        marginTop: 3,
                      }}
                    >
                      #{staffId}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 135,
                      textAlign: 'center',
                    }}
                  >
                    {staffSignature ? (
                      <img
                        src={staffSignature}
                        alt="Staff Signature"
                        crossOrigin="anonymous"
                        style={{
                          width: '100%',
                          height: 39,
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: 39,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          color: '#9ca3af',
                          fontStyle: 'italic',
                        }}
                      >
                        {mediaError ? 'Signature unavailable' : 'No signature'}
                      </div>
                    )}

                    <div
                      style={{
                        borderTop: '1px solid #7c3aed',
                        paddingTop: 4,
                        fontSize: 8,
                        color: '#6b7280',
                        fontWeight: 800,
                        letterSpacing: 1,
                      }}
                    >
                      STAFF SIGNATURE
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER */}

                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 42,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    textAlign: 'center',
                  }}
                >
                  OFFICIAL STAFF ATTENDANCE ID
                </div>
              </div>

              {/* DOWNLOAD FORMAT GUIDE */}

              <div className="mt-3 text-muted" style={{ fontSize: 12 }}>
                Download a high-resolution copy of this staff ID card.
              </div>
            </>
          )}
        </div>
      </CModalBody>

      <CModalFooter className="d-flex flex-wrap justify-content-between gap-2">
        <CButton color="secondary" variant="outline" onClick={onClose}>
          Close
        </CButton>

        <div className="d-flex flex-wrap gap-2">
          <CButton color="dark" disabled={loading || !qrImage} onClick={printCard}>
            <i className="fas fa-print me-2"></i>
            Print
          </CButton>

          <CButton
            color="success"
            disabled={loading || !qrImage}
            onClick={() => downloadCard('png')}
          >
            <i className="fas fa-download me-1"></i>
            PNG
          </CButton>

          <CButton
            color="primary"
            disabled={loading || !qrImage}
            onClick={() => downloadCard('jpg')}
          >
            <i className="fas fa-download me-1"></i>
            JPG
          </CButton>

          <CButton color="info" disabled={loading || !qrImage} onClick={() => downloadCard('jpeg')}>
            <i className="fas fa-download me-1"></i>
            JPEG
          </CButton>
        </div>
      </CModalFooter>
    </CModal>
  )
}

export default StaffIDCardModal
