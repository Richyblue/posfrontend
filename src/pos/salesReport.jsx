import React, { useEffect, useState } from 'react'

import axios from 'axios'

import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CFormInput,
  CFormSelect,
  CButton,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CSpinner,
} from '@coreui/react'

const MySales = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)

  const [sales, setSales] = useState([])

  const [report, setReport] = useState({})

  const [search, setSearch] = useState('')

  const [period, setPeriod] = useState('today')

  const [startDate, setStartDate] = useState('')

  const [endDate, setEndDate] = useState('')

  const getSalesReport = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/reports/my-sales`, {
        params: {
          period,
          startDate,
          endDate,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReport(response.data)

      setSales(response.data.sales || [])
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

  const filteredSales = sales.filter(
    (sale) =>
      sale.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
      sale.customer?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      <h3 className="mb-4">My Sales Dashboard</h3>

      {/* Filters */}

      <CCard className="shadow-sm border-0 mb-4">
        <CCardBody>
          <CRow>
            <CCol md={3}>
              <CFormSelect value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="today">Today</option>

                <option value="yesterday">Yesterday</option>

                <option value="week">This Week</option>

                <option value="month">This Month</option>

                <option value="custom">Custom Range</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol md={3}>
              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol md={3}>
              <CButton color="primary" className="w-100" onClick={getSalesReport}>
                Filter Report
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* KPI Cards */}

      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="border-start border-success border-4 shadow-sm">
            <CCardBody>
              <small>Gross Sales</small>

              <h3>₦{Number(report.grossSales || 0).toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-start border-danger border-4 shadow-sm">
            <CCardBody>
              <small>Returns</small>

              <h3>₦{Number(report.totalReturns || 0).toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-start border-primary border-4 shadow-sm">
            <CCardBody>
              <small>Net Sales</small>

              <h3>₦{Number(report.netSales || 0).toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-start border-info border-4 shadow-sm">
            <CCardBody>
              <small>Transactions</small>

              <h3>{report.totalTransactions || 0}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      {/* Payment Breakdown */}

      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="shadow-sm">
            <CCardBody>
              <small>Cash Sales</small>

              <h4>₦{Number(report.cashSales || 0).toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm">
            <CCardBody>
              <small>Transfer Sales</small>

              <h4>₦{Number(report.transferSales || 0).toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm">
            <CCardBody>
              <small>POS Sales</small>

              <h4>₦{Number(report.posSales || 0).toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm">
            <CCardBody>
              <small>Mixed Sales</small>

              <h4>₦{Number(report.mixedSales || 0).toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="shadow-sm border-start border-warning border-4">
            <CCardBody>
              <small>Customers Served</small>

              <h4>{report.customersServed || 0}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-start border-info border-4">
            <CCardBody>
              <small>Items Sold</small>

              <h4>{report.itemsSold || 0}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-start border-success border-4">
            <CCardBody>
              <small>Average Sale</small>

              <h4>₦{Number(report.averageSale || 0).toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="shadow-sm border-start border-primary border-4">
            <CCardBody>
              <small>Service Revenue</small>

              <h4>₦{Number(report.totalServiceSales || 0).toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      {/* Search */}

      <CCard className="shadow-sm border-0">
        <CCardBody>
          <div className="mb-3">
            <CFormInput
              placeholder="Search receipt or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-5">
              <CSpinner />
            </div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Receipt</CTableHeaderCell>

                  <CTableHeaderCell>Customer</CTableHeaderCell>
                  <CTableHeaderCell>Card No.</CTableHeaderCell>

                  <CTableHeaderCell>Stand Tag</CTableHeaderCell>

                  <CTableHeaderCell>Staff ID</CTableHeaderCell>

                  <CTableHeaderCell>Payment</CTableHeaderCell>

                  <CTableHeaderCell>Amount</CTableHeaderCell>

                  <CTableHeaderCell>Date</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredSales.map((sale, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{sale.receiptNumber}</CTableDataCell>

                    <CTableDataCell>{sale.customer}</CTableDataCell>
                    <CTableDataCell>{sale.CardNumber || '-'}</CTableDataCell>

                    <CTableDataCell>{sale.StandTag || '-'}</CTableDataCell>

                    <CTableDataCell>{sale.serviceProviderId || '-'}</CTableDataCell>

                    <CTableDataCell>{sale.paymentMethod}</CTableDataCell>

                    <CTableDataCell>₦{Number(sale.amount).toLocaleString()}</CTableDataCell>

                    <CTableDataCell>{new Date(sale.createdAt).toLocaleString()}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default MySales
