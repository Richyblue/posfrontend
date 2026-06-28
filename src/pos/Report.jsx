import React, { useEffect, useState } from 'react'

import axios from 'axios'

import * as XLSX from 'xlsx'

import { saveAs } from 'file-saver'

import CIcon from '@coreui/icons-react'

import { cilSearch, cilTrash, cilPencil, cilCloudDownload } from '@coreui/icons'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CFormSelect,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CBadge,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
const Report = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)

  const [startDate, setStartDate] = useState('')

  const [endDate, setEndDate] = useState('')

  const [statusFilter, setStatusFilter] = useState('')
  const [cashierFilter, setCashierFilter] = useState('')
  const [providerFilter, setProviderFilter] = useState('')

  // STATES
  const [sales, setSales] = useState([])
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('today')

  // FILTER FIRST
  const filteredSales = sales.filter((sale) => {
    const keyword = search.toLowerCase()

    return (
      sale.receiptNumber?.toLowerCase().includes(keyword) ||
      sale.Customer?.fullname?.toLowerCase().includes(keyword) ||
      sale.RecordedBy?.fullname?.toLowerCase().includes(keyword)
    )
  })

  // KPI CALCULATIONS AFTER FILTER
  const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0)

  const totalTransactions = filteredSales.length

  const totalServiceSales = filteredSales.reduce((sum, sale) => {
    const serviceTotal =
      sale.items?.reduce(
        (itemSum, item) =>
          item.saleType === 'service' ? itemSum + Number(item.subtotal || 0) : itemSum,
        0,
      ) || 0

    return sum + serviceTotal
  }, 0)

  const productProfit = filteredSales.reduce((sum, sale) => {
    const profit =
      sale.items?.reduce((itemSum, item) => {
        if (item.saleType !== 'product') return itemSum

        return itemSum + (Number(item.price) - Number(item.costPrice)) * Number(item.quantity)
      }, 0) || 0

    return sum + profit
  }, 0)

  const ownerProfit = totalServiceSales * 0.7

  const staffCommissionPool = totalServiceSales * 0.3
  const totalProfits = ownerProfit + productProfit
  const getSalesReport = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/report`, {
        params: {
          startDate,
          endDate,
          status: statusFilter,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSales(response.data.sales)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getSalesReport()
    }
    fetchData()
  }, [])

  const filteredSaless = sales.filter((sale) => {
    const provider = sale.ServiceProvider?.User?.fullname || ''

    const cashier = sale.RecordedBy?.fullname || ''

    return true
  })

  const matchesProvider =
    providerFilter === '' ? true : provider.toLowerCase().includes(providerFilter.toLowerCase())

  // const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0)

  const totalProfit = sales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0)

  // const totalTransactions = sales.length

  const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0

  // const totalServiceSales = filteredSales.reduce((sum, sale) => {
  //   const serviceTotal =
  //     sale.items?.reduce(
  //       (itemSum, item) =>
  //         item.itemType === 'service' ? itemSum + Number(item.subtotal || 0) : itemSum,
  //       0,
  //     ) || 0

  //   return sum + serviceTotal
  // }, 0)

  // const ownerProfit = totalServiceSales * 0.6
  // const staffCommissionPool = totalServiceSales * 0.4

  const productSales = filteredSales.reduce((sum, sale) => {
    const productTotal =
      sale.items?.reduce(
        (itemSum, item) =>
          item.itemType === 'product' ? itemSum + Number(item.subtotal || 0) : itemSum,
        0,
      ) || 0

    return sum + productTotal
  }, 0)

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredSales)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report')

    XLSX.writeFile(workbook, 'SalesReport.xlsx')
  }

  const today = new Date()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const startOfWeek = new Date()
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  return (
    <>
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Total Sales</h6>
              <h3>₦{totalSales.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Transactions</h6>
              <h3>{totalTransactions}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Total Profit</h6>
              <h3>₦{productSales.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Average Sale</h6>
              <h3>₦{averageSale.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Total Sales</h6>
              <h3>₦{totalProfits.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Service Revenue</h6>
              <h3>₦{totalServiceSales.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Owner Profit (70%)</h6>
              <h3 className="text-success">₦{ownerProfit.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Staff Share (30%)</h6>
              <h3 className="text-primary">₦{staffCommissionPool.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-3">
        <CCol md={3}>
          <CFormInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CCol>

        <CCol md={3}>
          <CFormInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </CCol>

        <CCol md={3}>
          <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>

            <option value="approved">Approved</option>

            <option value="pending">Pending</option>

            <option value="cancelled">Cancelled</option>
          </CFormSelect>
        </CCol>

        <CCol md={3}>
          <CButton color="primary" onClick={getSalesReport}>
            Apply Filter
          </CButton>
        </CCol>
      </CRow>

      <CFormInput
        placeholder="Search Invoice..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      <CButton color="success" onClick={exportExcel}>
        Export Excel
      </CButton>

      <CTable hover responsive bordered>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Invoice</CTableHeaderCell>

            <CTableHeaderCell>Customer</CTableHeaderCell>
            <CTableHeaderCell>Sales By</CTableHeaderCell>

            <CTableHeaderCell>Attended By</CTableHeaderCell>
            <CTableHeaderCell>Card/Stand Tag</CTableHeaderCell>

            <CTableHeaderCell>Amount</CTableHeaderCell>

            <CTableHeaderCell>Status</CTableHeaderCell>

            <CTableHeaderCell>Date</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {filteredSales.map((sale) => (
            <CTableRow key={sale.id}>
              <CTableDataCell> {sale.invoiceNumber || sale.receiptNumber}</CTableDataCell>

              <CTableDataCell>{sale.Customer?.fullname}</CTableDataCell>
              <CTableDataCell>{sale.RecordedBy?.fullname}</CTableDataCell>

              <CTableDataCell>
                {sale.ServiceProvider?.fullname || sale.ServiceProvider?.User?.fullname || '-'}
              </CTableDataCell>

              <CTableDataCell>
                <div>
                  <strong>Card:</strong> {sale.cardNumber || '-'}
                  <br />
                  <small className="text-muted">Stand: {sale.standTag || '-'}</small>
                </div>
              </CTableDataCell>

              <CTableDataCell>₦{Number(sale.totalAmount).toLocaleString()}</CTableDataCell>

              <CTableDataCell>
                <CBadge color={sale.approvalStatus === 'approved' ? 'success' : 'warning'}>
                  {sale.approvalStatus}
                </CBadge>
              </CTableDataCell>

              <CTableDataCell>{new Date(sale.createdAt).toLocaleDateString()}</CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </>
  )
}

export default Report
