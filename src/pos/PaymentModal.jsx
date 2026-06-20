import { useState } from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CFormInput,
  CFormTextarea,
  CRow,
  CCol,
  CCard,
  CCardBody,
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

  const [note, setNote] = useState('')

  const handleSubmit = () => {
    onSubmit({
      paymentMethod,
      serviceProviderId,
      note,
    })
  }

  return (
    <CModal visible={show} onClose={onHide} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle>Complete Payment</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {/* PAYMENT SUMMARY */}

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

        {/* PAYMENT METHOD */}

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

        {/* SERVICE PROVIDER */}

        <CRow className="mb-3">
          <CCol md={12}>
            <label className="form-label fw-semibold">Service Provider</label>

            <CFormSelect
              value={serviceProviderId}
              onChange={(e) => setServiceProviderId(e.target.value)}
            >
              <option value="">Select Staff</option>

              {staff.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.User?.fullname}
                </option>
              ))}
            </CFormSelect>

            <small className="text-muted">Staff that attended to the customer</small>
          </CCol>
        </CRow>

        {/* NOTE */}

        <CRow>
          <CCol md={12}>
            <label className="form-label fw-semibold">Remarks</label>

            <CFormTextarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
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
