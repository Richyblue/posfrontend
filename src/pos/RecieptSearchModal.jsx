import { CModal, CModalHeader, CModalTitle, CModalBody, CFormInput, CButton } from '@coreui/react'

export default function ReceiptSearchModal({
  visible,
  onClose,
  receiptNumber,
  setReceiptNumber,
  onSearch,
}) {
  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Reprint Receipt</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CFormInput
          placeholder="Receipt Number"
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
        />

        <CButton color="primary" className="w-100 mt-3" onClick={onSearch}>
          Search Receipt
        </CButton>
      </CModalBody>
    </CModal>
  )
}
