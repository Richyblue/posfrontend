import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react'

export default function ClearCartModal({ visible, onClose, onConfirm }) {
  return (
    <CModal visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Clear Cart</CModalTitle>
      </CModalHeader>

      <CModalBody>Are you sure you want to clear all items?</CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Cancel
        </CButton>

        <CButton color="danger" onClick={onConfirm}>
          Clear
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
