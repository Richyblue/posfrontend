import { useState } from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormTextarea,
  CFormSelect,
  CCard,
  CCardBody,
  CRow,
  CCol,
} from '@coreui/react'

export default function HoldSaleModal({
  show,
  onHide,
  onSave,
  customers = [],
  total = 0,
  cartCount = 0,
}) {
  const [customerId, setCustomerId] = useState('')

  const [note, setNote] = useState('')

  const handleSave = () => {
    onSave({
      customerId,
      note,
    })

    setCustomerId('')
    setNote('')
  }

  return (
    <CModal visible={show} onClose={onHide} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle>Hold Transaction</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CCard className="border-0 bg-light mb-3">
          <CCardBody>
            <CRow>
              <CCol md={6}>
                <small className="text-medium-emphasis">Cart Items</small>

                <h4>{cartCount}</h4>
              </CCol>

              <CCol md={6}>
                <small className="text-medium-emphasis">Total Amount</small>

                <h4 className="text-success">₦{Number(total).toLocaleString()}</h4>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <div className="mb-3">
          <label className="form-label fw-semibold">Customer</label>

          <CFormSelect value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Walk-in Customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.fullname}
              </option>
            ))}
          </CFormSelect>
        </div>

        <div>
          <label className="form-label fw-semibold">Hold Note</label>

          <CFormTextarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Example: Customer stepped out, returning later..."
          />
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onHide}>
          Cancel
        </CButton>

        <CButton color="warning" onClick={handleSave}>
          Hold Sale
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
