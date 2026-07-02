import { CCard, CCardBody, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'

const KpiCard = ({ title, value, icon, color }) => {
  return (
    <CCol md={3} className="mb-3">
      <CCard className="shadow-sm border-0 h-100">
        <CCardBody>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-medium-emphasis">{title}</small>

              <h3 className="fw-bold mt-2">{value}</h3>
            </div>

            <CIcon icon={icon} size="xl" className={`text-${color}`} />
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  )
}

export default KpiCard
