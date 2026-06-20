import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import CIcon from '@coreui/icons-react'

import {
  CAvatar,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAlert,
  CSpinner,
} from '@coreui/react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

import { Line } from 'react-chartjs-2'
import {
  cilMoney,
  cilDollar,
  cilPeople,
  cilCart,
  cilBasket,
  cilUser,
  cilWarning,
  cilChartLine,
  cilUserFemale,
} from '@coreui/icons'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)
const Dashboard = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const [dashboard, setDashboard] = useState({
    todaySales: 0,

    todayTransactions: 0,

    todayExpenses: 0,

    todayCommission: 0,

    todayProfit: 0,

    monthSales: 0,

    monthExpenses: 0,

    monthCommission: 0,

    monthProfit: 0,

    totalProducts: 0,

    totalCustomers: 0,

    totalStaff: 0,

    lowStockProducts: 0,

    outOfStockProducts: 0,

    pendingCommission: 0,

    topProducts: [],

    topStaff: [],

    sevenDaysSales: [],
  })
  const {
    lowStockProducts,

    outOfStockProducts,

    pendingCommission,

    sevenDaysSales,
  } = dashboard

  const money = (value) => `₦${Number(value || 0).toLocaleString()}`
  const totalAlerts = lowStockProducts + outOfStockProducts + (pendingCommission > 0 ? 1 : 0)
  const salesLabels = sevenDaysSales.map((item) => item.date)

  const salesData = sevenDaysSales.map((item) => item.sales)
  const [loading, setLoading] = useState(false)

  const [refreshing, setRefreshing] = useState(false)

  const getDashboard = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/dashboard`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setDashboard(response.data.dashboard)

      console.log(response.data.dashboard)
    } catch (error) {
      console.error(error)

      Swal.fire({
        icon: 'error',

        title: 'Failed',

        text: error.response?.data?.message || 'Unable to load dashboard',
      })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getDashboard()
    }
    fetchData()
  }, [])

  const refreshDashboard = async () => {
    try {
      setRefreshing(true)

      await getDashboard()

      Swal.fire({
        icon: 'success',

        title: 'Dashboard Updated',

        timer: 1500,

        showConfirmButton: false,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setRefreshing(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await refreshDashboard()
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <CSpinner color="primary" />
      </div>
    )
  }
  return (
    <>
      {dashboard.lowStockProducts > 0 && (
        <CAlert color="warning">
          {dashboard.lowStockProducts}
          products are below reorder level
        </CAlert>
      )}
      {dashboard.outOfStockProducts > 0 && (
        <CAlert color="danger">
          {dashboard.outOfStockProducts}
          products are out of stock
        </CAlert>
      )}
      {dashboard.pendingCommission > 0 && (
        <CAlert color="info">
          Pending Commission: ₦{Number(dashboard.pendingCommission).toLocaleString()}
        </CAlert>
      )}
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-medium-emphasis">Today's Sales</div>
                  <h3 className="fw-bold mt-2">
                    ₦{Number(dashboard?.todaySales || 0).toLocaleString()}
                  </h3>
                </div>

                <CIcon icon={cilMoney} size="xl" className="text-success" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-medium-emphasis">Today's Profit</div>
                  <h3 className="fw-bold mt-2">
                    ₦{Number(dashboard?.todayProfit || 0).toLocaleString()}
                  </h3>
                </div>

                <CIcon icon={cilDollar} size="xl" className="text-primary" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-medium-emphasis">Transactions</div>
                  <h3 className="fw-bold mt-2">{dashboard?.todayTransactions || 0}</h3>
                </div>

                <CIcon icon={cilCart} size="xl" className="text-info" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-medium-emphasis">Pending Commission</div>
                  <h3 className="fw-bold mt-2">
                    ₦{Number(dashboard?.pendingCommission || 0).toLocaleString()}
                  </h3>
                </div>

                <CIcon icon={cilPeople} size="xl" className="text-warning" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-medium-emphasis">Monthly Sales</div>
                  <h3 className="fw-bold mt-2">
                    ₦{Number(dashboard?.monthSales || 0).toLocaleString()}
                  </h3>
                </div>

                <CIcon icon={cilMoney} size="xl" className="text-success" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-medium-emphasis">Monthly Profit</div>
                  <h3 className="fw-bold mt-2">
                    ₦{Number(dashboard?.monthProfit || 0).toLocaleString()}
                  </h3>
                </div>

                <CIcon icon={cilChartLine} size="xl" className="text-primary" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-medium-emphasis">Monthly Expenses</div>
                  <h3 className="fw-bold mt-2">
                    ₦{Number(dashboard?.monthExpenses || 0).toLocaleString()}
                  </h3>
                </div>

                <CIcon icon={cilWarning} size="xl" className="text-danger" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-medium-emphasis">Monthly Commission</div>
                  <h3 className="fw-bold mt-2">
                    ₦{Number(dashboard?.monthCommission || 0).toLocaleString()}
                  </h3>
                </div>

                <CIcon icon={cilUser} size="xl" className="text-warning" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="text-medium-emphasis">Products</div>
              <h3 className="fw-bold mt-2">{dashboard?.totalProducts || 0}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="text-medium-emphasis">Customers</div>
              <h3 className="fw-bold mt-2">{dashboard?.totalCustomers || 0}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="text-medium-emphasis">Staff</div>
              <h3 className="fw-bold mt-2">{dashboard?.totalStaff || 0}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-0">
            <CCardBody>
              <div className="text-medium-emphasis">Low Stock</div>
              <h3 className="fw-bold mt-2 text-danger">{dashboard?.lowStockProducts || 0}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>{' '}
      <CCard className="p-3">
        <Line
          data={{
            labels: dashboard.sevenDaysSales.map((d) => d.date),

            datasets: [
              {
                label: 'Sales',

                data: dashboard.sevenDaysSales.map((d) => d.sales),
              },
            ],
          }}
        />
      </CCard>
      <CTable hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Product</CTableHeaderCell>

            <CTableHeaderCell>Qty Sold</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {(dashboard.topProducts || []).map((item) => (
            <CTableRow key={item.ProductId}>
              <CTableDataCell>{item.Product?.name}</CTableDataCell>

              <CTableDataCell>{item?.dataValues?.totalSold || item?.totalSold || 0}</CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
      <CTable hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Staff</CTableHeaderCell>

            <CTableHeaderCell>Commission</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {dashboard.topStaff?.map((staff) => (
            <CTableRow key={staff.StaffId}>
              <CTableDataCell>{staff?.Staff?.User?.fullname || 'Unknown'}</CTableDataCell>

              <CTableDataCell>
                ₦{Number(staff?.satffId?.totalCommission).toLocaleString()}
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </>
  )
}

export default Dashboard
