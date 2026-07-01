import React from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CCard,
  CCardBody,
  CRow,
  CCol,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from '@coreui/react'

const ViewReturnModal = ({ show, onHide, returnData }) => {
  if (!returnData) return null

  return (
    <CModal visible={show} size="xl" onClose={onHide}>
      <CModalHeader>
        <CModalTitle>Return Details</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CCard className="mb-4">
          <CCardBody>
            <CRow>
              <CCol md={4}>
                <strong>Return Number</strong>
                <br />
                {returnData.returnNumber}
              </CCol>

              <CCol md={4}>
                <strong>Invoice</strong>
                <br />
                {returnData.Sale?.receiptNumber}
              </CCol>

              <CCol md={4}>
                <strong>Customer</strong>
                <br />
                {returnData.Customer?.fullname || 'Walk-in Customer'}
              </CCol>
            </CRow>

            <hr />

            <CRow>
              <CCol md={4}>
                <strong>Refund Type</strong>
                <br />
                {returnData.refundType}
              </CCol>

              <CCol md={4}>
                <strong>Status</strong>
                <br />

                <CBadge
                  color={
                    returnData.status === 'approved'
                      ? 'success'
                      : returnData.status === 'pending'
                        ? 'warning'
                        : 'danger'
                  }
                >
                  {returnData.status}
                </CBadge>
              </CCol>

              <CCol md={4}>
                <strong>Total Refund</strong>
                <br />

                <span className="text-danger fw-bold">
                  ₦{Number(returnData.totalRefund || 0).toLocaleString()}
                </span>
              </CCol>
            </CRow>

            <hr />

            <CRow>
              <CCol md={6}>
                <strong>Reason</strong>
                <br />
                {returnData.reason || '-'}
              </CCol>

              <CCol md={6}>
                <strong>Processed By</strong>
                <br />
                {returnData.ProcessedBy?.fullname || '-'}
              </CCol>
            </CRow>

            <hr />

            <strong>Remarks</strong>

            <div className="border rounded p-3 mt-2">
              {returnData.remarks || 'No remarks'}
            </div>
          </CCardBody>
        </CCard>

        <h5 className="mb-3">Returned Items</h5>

        <CTable bordered hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Item</CTableHeaderCell>
              <CTableHeaderCell>Type</CTableHeaderCell>
              <CTableHeaderCell>Qty</CTableHeaderCell>
              <CTableHeaderCell>Price</CTableHeaderCell>
              <CTableHeaderCell>Subtotal</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {returnData.ReturnItems?.length > 0 ? (
              returnData.ReturnItems.map((item) => (
                <CTableRow key={item.id}>
                  <CTableDataCell>
                    {item.Product?.name ||
                      item.Service?.name ||
                      '-'}
                  </CTableDataCell>

                  <CTableDataCell>
                    {item.itemType}
                  </CTableDataCell>

                  <CTableDataCell>
                    {item.quantity}
                  </CTableDataCell>

                  <CTableDataCell>
                    ₦{Number(item.price).toLocaleString()}
                  </CTableDataCell>

                  <CTableDataCell>
                    ₦{Number(item.subtotal).toLocaleString()}
                  </CTableDataCell>
                </CTableRow>
              ))
            ) : (
              <CTableRow>
                <CTableDataCell
                  colSpan={5}
                  className="text-center"
                >
                  No returned items found.
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onHide}>
          Close
        </CButton>

        <CButton
          color="primary"
          onClick={() => window.print()}
        >
          Print
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ViewReturnModal