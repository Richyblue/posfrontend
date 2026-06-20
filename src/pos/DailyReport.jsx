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
        {loading ? (
          <div className="text-center py-5">
            <CSpinner />
          </div>
        ) : (
          <CRow>
            <CCol md={3}>
              <CCard className="mb-3 border-start border-success border-4">
                <CCardBody>
                  <small>Today's Sales</small>

                  <h4>₦{Number(report?.todaySales || 0).toLocaleString()}</h4>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={3}>
              <CCard className="mb-3 border-start border-danger border-4">
                <CCardBody>
                  <small>Expenses</small>

                  <h4>₦{Number(report?.todayExpenses || 0).toLocaleString()}</h4>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={3}>
              <CCard className="mb-3 border-start border-warning border-4">
                <CCardBody>
                  <small>Commission</small>

                  <h4>₦{Number(report?.todayCommission || 0).toLocaleString()}</h4>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={3}>
              <CCard className="mb-3 border-start border-primary border-4">
                <CCardBody>
                  <small>Profit</small>

                  <h4>₦{Number(report?.todayProfit || 0).toLocaleString()}</h4>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}

        {!loading && (
          <CRow>
            <CCol md={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <h6>Transactions</h6>

                  <h3>{report?.todayTransactions || 0}</h3>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <h6>Customers</h6>

                  <h3>{report?.totalCustomers || 0}</h3>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <h6>Products</h6>

                  <h3>{report?.totalProducts || 0}</h3>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}

        {!loading && (
          <CRow>
            <CCol md={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <h6>Staff</h6>

                  <h3>{report?.totalStaff || 0}</h3>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <h6>Low Stock</h6>

                  <h3 className="text-warning">{report?.lowStockProducts || 0}</h3>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol md={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <h6>Out Of Stock</h6>

                  <h3 className="text-danger">{report?.outOfStockProducts || 0}</h3>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}
      </CModalBody>
    </CModal>
  )
}
