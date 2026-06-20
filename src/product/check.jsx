import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

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
const Dashboards = () => {
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
      <>
        <div
          className="
      d-flex
      justify-content-center
      align-items-center"
          style={{
            height: '70vh',
          }}
        >
          <CSpinner color="primary" />
        </div>

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
            <CCardBody
              title="Today's Sales"
              value={`₦${Number(dashboard.todaySales).toLocaleString()}`}
              color="success"
              icon={cilMoney}
            />
          </CCol>

          <CCol md={3}>
            <CCardBody
              title="Today's Profit"
              value={`₦${Number(dashboard.todayProfit).toLocaleString()}`}
              color="primary"
              icon={cilDollar}
            />
          </CCol>

          <CCol md={3}>
            <CCardBody
              title="Transactions"
              value={dashboard.todayTransactions}
              color="info"
              icon={cilCart}
            />
          </CCol>

          <CCol md={3}>
            <CCardBody
              title="Pending Commission"
              value={`₦${Number(dashboard.pendingCommission).toLocaleString()}`}
              color="warning"
              icon={cilPeople}
            />
          </CCol>
        </CRow>
        <CRow className="mb-4">
          <CCol md={3}>
            <CCardBody
              title="Monthly Sales"
              value={`₦${Number(dashboard.monthSales).toLocaleString()}`}
              color="success"
              icon={cilMoney}
            />
          </CCol>

          <CCol md={3}>
            <CCardBody
              title="Monthly Profit"
              value={`₦${Number(dashboard.monthProfit).toLocaleString()}`}
              color="primary"
              icon={cilChartLine}
            />
          </CCol>

          <CCol md={3}>
            <CCardBody
              title="Monthly Expenses"
              value={`₦${Number(dashboard.monthExpenses).toLocaleString()}`}
              color="danger"
              icon={cilWarning}
            />
          </CCol>

          <CCol md={3}>
            <CCardBody
              title="Monthly Commission"
              value={`₦${Number(dashboard.monthCommission).toLocaleString()}`}
              color="warning"
              icon={cilUser}
            />
          </CCol>
        </CRow>

        <CRow className="mb-4">
          <CCol md={3}>
            <CCardBody
              title="Products"
              value={dashboard.totalProducts}
              color="dark"
              icon={cilBasket}
            />
          </CCol>

          <CCol md={3}>
            <CCardBody
              title="Customers"
              value={dashboard.totalCustomers}
              color="success"
              icon={cilPeople}
            />
          </CCol>

          <CCol md={3}>
            <CCardBody title="Staff" value={dashboard.totalStaff} color="info" icon={cilUser} />
          </CCol>

          <CCol md={3}>
            <CCardBody
              title="Low Stock"
              value={dashboard.lowStockProducts}
              color="danger"
              icon={cilWarning}
            />
          </CCol>
        </CRow>

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

        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Product</CTableHeaderCell>

              <CTableHeaderCell>Qty Sold</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {dashboard.topProducts?.map((item) => (
              <CTableRow key={item.ProductId}>
                <CTableDataCell>{item.Product?.name}</CTableDataCell>

                <CTableDataCell></CTableDataCell>
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
                <CTableDataCell>{staff.Staff?.User?.fullname}</CTableDataCell>

                <CTableDataCell>
                  ₦{Number(staff.dataValues.totalCommission).toLocaleString()}
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </>
    )
  }
}

export default Dashboards
