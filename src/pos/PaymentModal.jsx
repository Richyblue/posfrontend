import { useEffect, useState } from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CFormTextarea,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CAlert,
} from '@coreui/react'

export default function PaymentModal({
  show,
  onHide,
  total,
  onSubmit,
  processing,
  staff = [],
  currentUser,
}) {
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [serviceProviderId, setServiceProviderId] = useState('')
  const [serviceType, setServiceType] = useState('in_salon')
  const [note, setNote] = useState('')
  const [standTag, setStandTag] = useState('')
  const [cardNumber, setCardNumber] = useState('')

  // =========================================================
  // DETERMINE IF HOME SERVICE
  // =========================================================

  const isHomeService = serviceType === 'home_service'

  // =========================================================
  // WHEN HOME SERVICE IS SELECTED
  // CLEAR STAND + CARD
  // =========================================================

  useEffect(() => {
    if (isHomeService) {
      setStandTag('')
      setCardNumber('')
    }
  }, [isHomeService])

  // =========================================================
  // RESET FORM WHEN MODAL OPENS
  // =========================================================

  useEffect(() => {
    if (show) {
      setPaymentMethod('cash')
      setServiceProviderId('')
      setServiceType('in_salon')
      setNote('')
      setStandTag('')
      setCardNumber('')
    }
  }, [show])

  // =========================================================
  // HANDLE SUBMIT
  // =========================================================

  const handleSubmit = () => {
    onSubmit({
      paymentMethod,
      serviceProviderId,

      // Home service automatically sends empty values
      standTag: isHomeService ? '' : standTag,
      cardNumber: isHomeService ? '' : cardNumber,

      note,

      // VERY IMPORTANT
      serviceType,
    })
  }

  // =========================================================
  // ACTIVE STAFF
  // =========================================================

  const activeStaff = staff.filter(
    (item) =>
      (item.User?.isActive === true || item.User?.isActive === 1) && item.User?.fullname?.trim(),
  )

  return (
    <CModal visible={show} onClose={onHide} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle>Complete Payment</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {/* =====================================================
            PAYMENT SUMMARY
        ====================================================== */}

        <CCard className="border-0 bg-light mb-4">
          <CCardBody>
            <CRow>
              <CCol md={6}>
                <small className="text-medium-emphasis">Amount Payable</small>

                <h2 className="fw-bold mt-2 text-success">₦{Number(total).toLocaleString()}</h2>
              </CCol>

              <CCol md={6}>
                <small className="text-medium-emphasis">Sales By</small>

                <h5 className="mt-2">{currentUser?.fullname || 'Current User'}</h5>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* =====================================================
            SERVICE TYPE
        ====================================================== */}

        <CRow className="mb-3">
          <CCol md={12}>
            <label className="form-label fw-semibold">Service Type</label>

            <CFormSelect value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              <option value="in_salon">In-Salon Service</option>

              <option value="home_service">Home Service</option>
            </CFormSelect>

            <small className="text-muted">Select where the service will be provided.</small>
          </CCol>
        </CRow>

        {/* =====================================================
            HOME SERVICE NOTICE
        ====================================================== */}

        {isHomeService && (
          <CAlert color="warning" className="mb-3">
            <strong>Home Service Selected</strong>

            <div className="small mt-1">
              Stand number and card number are not required for home services.
            </div>
          </CAlert>
        )}

        {/* =====================================================
            PAYMENT METHOD
        ====================================================== */}

        <CRow className="mb-3">
          <CCol md={12}>
            <label className="form-label fw-semibold">Payment Method</label>

            <CFormSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>

              <option value="transfer">Bank Transfer</option>

              <option value="pos">POS</option>

              <option value="mixed">Mixed Payment</option>
            </CFormSelect>
          </CCol>
        </CRow>

        {/* =====================================================
            SERVICE PROVIDER
        ====================================================== */}

        <CRow className="mb-3">
          <CCol md={12}>
            <label className="form-label fw-semibold">Service Provider</label>

            <CFormSelect
              value={serviceProviderId}
              onChange={(e) => setServiceProviderId(e.target.value)}
            >
              <option value="">Select Staff</option>

              {activeStaff.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.User.fullname.trim()}
                </option>
              ))}
            </CFormSelect>

            <small className="text-muted">Staff that attended to the customer</small>
          </CCol>
        </CRow>

        {/* =====================================================
            STAND + CARD
            ONLY SHOW FOR IN-SALON
        ====================================================== */}

        {!isHomeService && (
          <CRow className="mb-3">
            {/* STAND */}

            <CCol md={6}>
              <label className="form-label fw-semibold">Stand Tag</label>

              <CFormSelect value={standTag} onChange={(e) => setStandTag(e.target.value)}>
                <option value="">Select Stand</option>

                {[...Array(20)].map((_, i) => (
                  <option key={i + 1} value={`Stand ${i + 1}`}>
                    Stand {i + 1}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            {/* CARD */}

            <CCol md={6}>
              <label className="form-label fw-semibold">Card Number</label>

              <CFormSelect value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}>
                <option value="">Select Card</option>

                {[...Array(100)].map((_, i) => {
                  const number = String(i + 1).padStart(3, '0')

                  return (
                    <option key={i + 1} value={number}>
                      Card #{number}
                    </option>
                  )
                })}
              </CFormSelect>
            </CCol>
          </CRow>
        )}

        {/* =====================================================
            REMARKS
        ====================================================== */}

        <CRow>
          <CCol md={12}>
            <label className="form-label fw-semibold">Remarks</label>

            <CFormTextarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isHomeService ? 'Optional home service remarks...' : 'Optional note...'}
            />
          </CCol>
        </CRow>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onHide}>
          Cancel
        </CButton>

        <CButton color="success" disabled={processing} onClick={handleSubmit}>
          {processing ? 'Processing...' : 'Complete Sale'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
