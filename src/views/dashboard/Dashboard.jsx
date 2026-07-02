import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import CIcon from '@coreui/icons-react'
import KpiCard from './KpiCard'

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
    /*
    ==========================================
    TODAY
    ==========================================
    */
    todaySales: 0,
    todayProfit: 0,
    todayTransactions: 0,
    todayCustomers: 0,
    todayExpenses: 0,
    todayCommission: 0,

    /*
    ==========================================
    MONTH
    ==========================================
    */
    monthSales: 0,
    monthProfit: 0,
    monthExpenses: 0,
    monthCommission: 0,

    /*
    ==========================================
    SALES ANALYTICS
    ==========================================
    */
    grossSales: 0,
    totalReturns: 0,
    netSales: 0,
    averageSale: 0,

    /*
    ==========================================
    REVENUE
    ==========================================
    */
    serviceRevenue: 0,
    productRevenue: 0,
    ownerProfit: 0,
    staffShare: 0,

    /*
    ==========================================
    PAYMENT BREAKDOWN
    ==========================================
    */
    cashSales: 0,
    transferSales: 0,
    posSales: 0,
    mixedSales: 0,

    /*
    ==========================================
    BUSINESS
    ==========================================
    */
    totalProducts: 0,
    totalCustomers: 0,
    totalStaff: 0,
    inventoryValue: 0,

    /*
    ==========================================
    ALERTS
    ==========================================
    */
    lowStockProducts: 0,
    outOfStockProducts: 0,
    pendingCommission: 0,
    totalAlerts: 0,

    /*
    ==========================================
    TABLES
    ==========================================
    */
    topProducts: [],
    topStaff: [],

    /*
    ==========================================
    CHARTS
    ==========================================
    */
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
        <KpiCard
          title="Today's Sales"
          value={money(dashboard.todaySales)}
          icon={cilMoney}
          color="success"
        />

        <KpiCard
          title="Today's Profit"
          value={money(dashboard.todayProfit)}
          icon={cilDollar}
          color="primary"
        />

        <KpiCard
          title="Transactions"
          value={dashboard.todayTransactions}
          icon={cilCart}
          color="info"
        />

        <KpiCard
          title="Today's Customers"
          value={dashboard.todayCustomers}
          icon={cilPeople}
          color="warning"
        />
      </CRow>
      <CRow className="mb-4">
        <KpiCard
          title="Monthly Sales"
          value={money(dashboard.monthSales)}
          icon={cilMoney}
          color="success"
        />

        <KpiCard
          title="Monthly Profit"
          value={money(dashboard.monthProfit)}
          icon={cilChartLine}
          color="primary"
        />

        <KpiCard
          title="Monthly Expenses"
          value={money(dashboard.monthExpenses)}
          icon={cilWarning}
          color="danger"
        />

        <KpiCard
          title="Monthly Commission"
          value={money(dashboard.monthCommission)}
          icon={cilUser}
          color="warning"
        />
      </CRow>
      <CRow className="mb-4">
        <KpiCard
          title="Gross Sales"
          value={money(dashboard.grossSales)}
          icon={cilMoney}
          color="success"
        />

        <KpiCard
          title="Returns"
          value={money(dashboard.totalReturns)}
          icon={cilWarning}
          color="danger"
        />

        <KpiCard
          title="Net Sales"
          value={money(dashboard.netSales)}
          icon={cilDollar}
          color="primary"
        />

        <KpiCard
          title="Average Sale"
          value={money(dashboard.averageSale)}
          icon={cilChartLine}
          color="info"
        />
      </CRow>
      <CRow className="mb-4">
        <KpiCard
          title="Service Revenue"
          value={money(dashboard.serviceRevenue)}
          icon={cilUserFemale}
          color="success"
        />

        <KpiCard
          title="Product Revenue"
          value={money(dashboard.productRevenue)}
          icon={cilBasket}
          color="info"
        />

        <KpiCard
          title="Owner Profit"
          value={money(dashboard.ownerProfit)}
          icon={cilDollar}
          color="primary"
        />

        <KpiCard
          title="Staff Share"
          value={money(dashboard.staffShare)}
          icon={cilPeople}
          color="warning"
        />
      </CRow>
      <CRow className="mb-4">
        <KpiCard
          title="Cash Sales"
          value={money(dashboard.cashSales)}
          icon={cilMoney}
          color="success"
        />

        <KpiCard
          title="Transfer Sales"
          value={money(dashboard.transferSales)}
          icon={cilDollar}
          color="primary"
        />

        <KpiCard title="POS Sales" value={money(dashboard.posSales)} icon={cilCart} color="info" />

        <KpiCard
          title="Mixed Sales"
          value={money(dashboard.mixedSales)}
          icon={cilBasket}
          color="warning"
        />
      </CRow>
      <CRow className="mb-4">
        <KpiCard
          title="Products"
          value={dashboard.totalProducts}
          icon={cilBasket}
          color="primary"
        />

        <KpiCard
          title="Customers"
          value={dashboard.totalCustomers}
          icon={cilPeople}
          color="success"
        />

        <KpiCard title="Staff" value={dashboard.totalStaff} icon={cilUser} color="warning" />

        <KpiCard
          title="Inventory Value"
          value={money(dashboard.inventoryValue)}
          icon={cilMoney}
          color="info"
        />
      </CRow>
      <CRow className="mb-4">
        <KpiCard
          title="Low Stock"
          value={dashboard.lowStockProducts}
          icon={cilWarning}
          color="warning"
        />

        <KpiCard
          title="Out Of Stock"
          value={dashboard.outOfStockProducts}
          icon={cilWarning}
          color="danger"
        />

        <KpiCard
          title="Pending Commission"
          value={money(dashboard.pendingCommission)}
          icon={cilPeople}
          color="primary"
        />

        <KpiCard
          title="Total Alerts"
          value={dashboard.totalAlerts}
          icon={cilWarning}
          color="danger"
        />
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
