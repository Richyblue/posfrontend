import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CSpinner,
} from '@coreui/react'

export default function DailyReportModal({ visible, onClose, report, loading }) {
  return (
    <CModal size="xl" visible={visible} onClose={onClose}>
      <CModalHeader>
        <CModalTitle>Daily Business Report</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CRow>
          <CCol md={3}>
            <CCard className="mb-3 border-start border-success border-4">
              <CCardBody>
                <small>My Sales Today</small>

                <h4>₦{Number(report?.mySales || 0).toLocaleString()}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol md={3}>
            <CCard className="mb-3 border-start border-primary border-4">
              <CCardBody>
                <small>Transactions</small>

                <h4>{report?.myTransactions || 0}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol md={3}>
            <CCard className="mb-3 border-start border-warning border-4">
              <CCardBody>
                <small>Customers Served</small>

                <h4>{report?.myCustomers || 0}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol md={3}>
            <CCard className="mb-3 border-start border-info border-4">
              <CCardBody>
                <small>Average Sale</small>

                <h4>₦{Number(report?.averageSale || 0).toLocaleString()}</h4>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
        <CRow>
          <CCol md={4}>
            <CCard className="mb-3">
              <CCardBody>
                <h6>Cash Sales</h6>

                <h4>₦{Number(report?.cashSales || 0).toLocaleString()}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol md={4}>
            <CCard className="mb-3">
              <CCardBody>
                <h6>Transfer Sales</h6>

                <h4>₦{Number(report?.transferSales || 0).toLocaleString()}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol md={4}>
            <CCard className="mb-3">
              <CCardBody>
                <h6>POS/Card Sales</h6>

                <h4>₦{Number(report?.cardSales || 0).toLocaleString()}</h4>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        <CRow>
          <CCol md={6}>
            <CCard className="mb-3">
              <CCardBody>
                <h6>Cashier</h6>

                <h4>{report?.cashierName}</h4>
              </CCardBody>
            </CCard>
          </CCol>

          <CCol md={6}>
            <CCard className="mb-3">
              <CCardBody>
                <h6>Report Date</h6>

                <h4>{report?.reportDate}</h4>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CModalBody>
    </CModal>
  )
}
