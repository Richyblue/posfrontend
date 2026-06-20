import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CFormInput,
  CButton,
  CCard,
  CCardBody,
  CBadge,
} from '@coreui/react'

export default function LoyaltyLookupModal({
  visible,
  onClose,
  cardNumber,
  setCardNumber,
  onSearch,
  cardResult,
}) {
  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Loyalty Card Lookup</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CFormInput
          placeholder="Enter Loyalty Card Number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />

        <CButton color="primary" className="w-100 mt-3 rounded-pill" onClick={onSearch}>
          Search Card
        </CButton>

        {cardResult && (
          <CCard className="mt-4 border-0 shadow-sm">
            <CCardBody>
              <div className="text-center">
                <h5 className="mb-1">{cardResult.Customer?.fullname}</h5>

                <small className="text-medium-emphasis">{cardResult.Customer?.phone}</small>
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Card Number</span>

                <strong>{cardResult.cardNumber}</strong>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Loyalty Points</span>

                <CBadge color="success" shape="rounded-pill">
                  {cardResult.Customer?.loyaltyPoints || 0}
                </CBadge>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CModalBody>
    </CModal>
  )
}
