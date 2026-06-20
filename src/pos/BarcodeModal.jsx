import { CModal, CModalHeader, CModalTitle, CModalBody, CFormInput } from '@coreui/react'

export default function BarcodeModal({ visible, onClose, barcode, setBarcode, onSearch }) {
  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Scan Barcode</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CFormInput
          autoFocus
          placeholder="Scan Barcode..."
          value={barcode}
          onChange={(e) => {
            setBarcode(e.target.value)

            if (e.target.value.length > 5) {
              onSearch(e.target.value)
            }
          }}
        />
      </CModalBody>
    </CModal>
  )
}
