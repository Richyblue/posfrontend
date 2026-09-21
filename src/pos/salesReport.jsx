import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
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
  CBadge,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'

import {
  cilSearch,
  cilReload,
  cilFilter,
  cilCloudDownload,
  cilMoney,
  cilPeople,
  cilCart,
  cilCreditCard,
  cilArrowCircleBottom,
  cilCheckCircle,
  cilCalendar,
  cilX,
  cilUser,
  cilTag,
  cilBriefcase,
} from '@coreui/icons'

const MySales = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)
  const [sales, setSales] = useState([])
  const [report, setReport] = useState({})

  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('today')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  const formatCurrency = (amount) => {
    return `₦${Number(amount || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return '-'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return '-'
    }

    return parsedDate.toLocaleDateString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (date) => {
    if (!date) return '-'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return '-'
    }

    return parsedDate.toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // =========================================================
  // GET SALES REPORT
  // =========================================================

  const getSalesReport = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/reports/my-sales`, {
        params: {
          period,
          startDate: period === 'custom' ? startDate : '',
          endDate: period === 'custom' ? endDate : '',
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReport(response.data || {})
      setSales(response.data?.sales || [])
    } catch (error) {
      console.error('MY SALES REPORT ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    getSalesReport()
  }, [])

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredSales = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    if (!searchValue) {
      return sales
    }

    return sales.filter((sale) => {
      const receipt = sale.receiptNumber || ''

      const customer = sale.customer || ''

      const cardNumber = sale.CardNumber || ''

      const standTag = sale.StandTag || ''

      const serviceProvider = sale.serviceProvider || ''

      return (
        String(receipt).toLowerCase().includes(searchValue) ||
        String(customer).toLowerCase().includes(searchValue) ||
        String(cardNumber).toLowerCase().includes(searchValue) ||
        String(standTag).toLowerCase().includes(searchValue) ||
        String(serviceProvider).toLowerCase().includes(searchValue)
      )
    })
  }, [sales, search])

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch('')
    setPeriod('today')
    setStartDate('')
    setEndDate('')

    setTimeout(() => {
      getSalesReport()
    }, 0)
  }

  // =========================================================
  // CHECK IF FILTERS ARE ACTIVE
  // =========================================================

  const hasFilters = search || period !== 'today' || startDate || endDate

  // =========================================================
  // PAYMENT BADGE
  // =========================================================

  const renderPaymentBadge = (paymentMethod) => {
    const method = String(paymentMethod || '').toLowerCase()

    if (method === 'cash') {
      return (
        <CBadge color="success" className="px-3 py-2">
          Cash
        </CBadge>
      )
    }

    if (method === 'transfer') {
      return (
        <CBadge color="info" className="px-3 py-2">
          Transfer
        </CBadge>
      )
    }

    if (method === 'pos') {
      return (
        <CBadge color="primary" className="px-3 py-2">
          POS
        </CBadge>
      )
    }

    if (method === 'mixed') {
      return (
        <CBadge color="secondary" className="px-3 py-2">
          Mixed
        </CBadge>
      )
    }

    return (
      <CBadge color="light" className="text-dark border px-3 py-2">
        {paymentMethod || 'Unknown'}
      </CBadge>
    )
  }

  // =========================================================
  // SALE STATUS
  // =========================================================

  const getSaleStatus = (sale) => {
    if (sale.returned === true || sale.isReturned === true || sale.status === 'refunded') {
      return 'returned'
    }

    if (Number(sale.returnAmount || 0) > 0) {
      return 'partial'
    }

    return 'completed'
  }

  const renderSaleStatus = (sale) => {
    const status = getSaleStatus(sale)

    if (status === 'returned') {
      return (
        <CBadge color="danger" className="px-3 py-2">
          <CIcon icon={cilArrowCircleBottom} size="sm" className="me-1" />
          Returned
        </CBadge>
      )
    }

    if (status === 'partial') {
      return (
        <CBadge color="warning" className="px-3 py-2">
          Partially Returned
        </CBadge>
      )
    }

    return (
      <CBadge color="success" className="px-3 py-2">
        <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
        Completed
      </CBadge>
    )
  }

  // =========================================================
  // SALE AMOUNT
  // =========================================================

  const getSaleAmount = (sale) => {
    if (sale.netAmount !== undefined && sale.netAmount !== null) {
      return Number(sale.netAmount)
    }

    return Number(sale.amount || sale.totalAmount || 0)
  }

  // =========================================================
  // RETURN AMOUNT
  // =========================================================

  const getSaleReturnAmount = (sale) => {
    return Number(sale.returnAmount || sale.totalReturn || 0)
  }

  return (
    <div className="my-sales-page">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody className="p-4">
          <CRow className="align-items-center">
            <CCol md={7}>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '54px',
                    height: '54px',
                  }}
                >
                  <CIcon icon={cilCart} size="xl" className="text-primary" />
                </div>

                <div>
                  <h3 className="fw-bold mb-1">My Sales Dashboard</h3>

                  <div className="text-body-secondary">
                    View and track your sales, payments, customers and returns.
                  </div>
                </div>
              </div>
            </CCol>

            <CCol md={5} className="text-md-end mt-3 mt-md-0">
              <CButton
                color="light"
                className="border me-2"
                onClick={getSalesReport}
                disabled={loading}
              >
                <CIcon icon={cilReload} className="me-2" />
                Refresh
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-white border-0 px-4 pt-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <CIcon icon={cilFilter} className="text-primary me-2" />

              <strong>Sales Period</strong>
            </div>

            {hasFilters && (
              <CButton color="light" size="sm" className="border" onClick={resetFilters}>
                <CIcon icon={cilX} className="me-1" />
                Reset
              </CButton>
            )}
          </div>
        </CCardHeader>

        <CCardBody className="px-4 pb-4">
          <CRow className="g-3 align-items-end">
            <CCol xs={12} md={3}>
              <label className="form-label small fw-semibold">Period</label>

              <CFormSelect value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="today">Today</option>

                <option value="yesterday">Yesterday</option>

                <option value="week">This Week</option>

                <option value="month">This Month</option>

                <option value="custom">Custom Range</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} sm={6} md={3}>
              <label className="form-label small fw-semibold">Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                disabled={period !== 'custom'}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} sm={6} md={3}>
              <label className="form-label small fw-semibold">End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                disabled={period !== 'custom'}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={3}>
              <CButton
                color="primary"
                className="w-100"
                onClick={getSalesReport}
                disabled={loading || (period === 'custom' && (!startDate || !endDate))}
              >
                <CIcon icon={cilFilter} className="me-2" />
                Apply Filter
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* =====================================================
          PRIMARY KPIs
      ====================================================== */}

      <CRow className="mb-4">
        {/* GROSS SALES */}

        <CCol xs={12} sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-body-secondary small fw-semibold mb-2">GROSS SALES</div>

                  <h4 className="fw-bold mb-1">{formatCurrency(report.grossSales)}</h4>

                  <small className="text-body-secondary">Before returns</small>
                </div>

                <div
                  className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{
                    width: 46,
                    height: 46,
                  }}
                >
                  <CIcon icon={cilMoney} className="text-success" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* RETURNS */}

        <CCol xs={12} sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-body-secondary small fw-semibold mb-2">RETURNS</div>

                  <h4 className="fw-bold mb-1 text-danger">
                    {formatCurrency(report.totalReturns)}
                  </h4>

                  <small className="text-body-secondary">Returned sales value</small>
                </div>

                <div
                  className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{
                    width: 46,
                    height: 46,
                  }}
                >
                  <CIcon icon={cilArrowCircleBottom} className="text-danger" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* NET SALES */}

        <CCol xs={12} sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-body-secondary small fw-semibold mb-2">NET SALES</div>

                  <h4 className="fw-bold mb-1 text-primary">{formatCurrency(report.netSales)}</h4>

                  <small className="text-body-secondary">After returns</small>
                </div>

                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{
                    width: 46,
                    height: 46,
                  }}
                >
                  <CIcon icon={cilCart} className="text-primary" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* TRANSACTIONS */}

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-body-secondary small fw-semibold mb-2">TRANSACTIONS</div>

                  <h4 className="fw-bold mb-1">
                    {Number(report.totalTransactions || 0).toLocaleString()}
                  </h4>

                  <small className="text-body-secondary">Sales recorded</small>
                </div>

                <div
                  className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{
                    width: 46,
                    height: 46,
                  }}
                >
                  <CIcon icon={cilCart} className="text-info" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          PAYMENT BREAKDOWN
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-white border-0 px-4 pt-4">
          <h5 className="fw-bold mb-1">Payment Breakdown</h5>

          <small className="text-body-secondary">Sales grouped by payment method</small>
        </CCardHeader>

        <CCardBody className="px-4">
          <CRow className="g-3">
            {/* CASH */}

            <CCol xs={12} sm={6} lg={3}>
              <div className="border rounded-3 p-3 h-100">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 42,
                      height: 42,
                    }}
                  >
                    <CIcon icon={cilMoney} className="text-success" />
                  </div>

                  <span className="fw-semibold">Cash Sales</span>
                </div>

                <h5 className="fw-bold mb-0">{formatCurrency(report.cashSales)}</h5>
              </div>
            </CCol>

            {/* TRANSFER */}

            <CCol xs={12} sm={6} lg={3}>
              <div className="border rounded-3 p-3 h-100">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 42,
                      height: 42,
                    }}
                  >
                    <CIcon icon={cilCreditCard} className="text-info" />
                  </div>

                  <span className="fw-semibold">Transfer Sales</span>
                </div>

                <h5 className="fw-bold mb-0">{formatCurrency(report.transferSales)}</h5>
              </div>
            </CCol>

            {/* POS */}

            <CCol xs={12} sm={6} lg={3}>
              <div className="border rounded-3 p-3 h-100">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 42,
                      height: 42,
                    }}
                  >
                    <CIcon icon={cilCreditCard} className="text-primary" />
                  </div>

                  <span className="fw-semibold">POS Sales</span>
                </div>

                <h5 className="fw-bold mb-0">{formatCurrency(report.posSales)}</h5>
              </div>
            </CCol>

            {/* MIXED */}

            <CCol xs={12} sm={6} lg={3}>
              <div className="border rounded-3 p-3 h-100">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 42,
                      height: 42,
                    }}
                  >
                    <CIcon icon={cilMoney} className="text-secondary" />
                  </div>

                  <span className="fw-semibold">Mixed Sales</span>
                </div>

                <h5 className="fw-bold mb-0">{formatCurrency(report.mixedSales)}</h5>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* =====================================================
          PERFORMANCE SUMMARY
      ====================================================== */}

      <CRow className="mb-4">
        <CCol xs={12} sm={6} lg={3} className="mb-3 mb-lg-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: 42,
                    height: 42,
                  }}
                >
                  <CIcon icon={cilPeople} className="text-warning" />
                </div>

                <span className="text-body-secondary small fw-semibold">CUSTOMERS SERVED</span>
              </div>

              <h4 className="fw-bold mb-0">
                {Number(report.customersServed || 0).toLocaleString()}
              </h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} lg={3} className="mb-3 mb-lg-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: 42,
                    height: 42,
                  }}
                >
                  <CIcon icon={cilCart} className="text-info" />
                </div>

                <span className="text-body-secondary small fw-semibold">ITEMS SOLD</span>
              </div>

              <h4 className="fw-bold mb-0">{Number(report.itemsSold || 0).toLocaleString()}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} lg={3} className="mb-3 mb-lg-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: 42,
                    height: 42,
                  }}
                >
                  <CIcon icon={cilMoney} className="text-success" />
                </div>

                <span className="text-body-secondary small fw-semibold">AVERAGE SALE</span>
              </div>

              <h4 className="fw-bold mb-0">{formatCurrency(report.averageSale)}</h4>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} sm={6} lg={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: 42,
                    height: 42,
                  }}
                >
                  <CIcon icon={cilBriefcase} className="text-primary" />
                </div>

                <span className="text-body-secondary small fw-semibold">SERVICE REVENUE</span>
              </div>

              <h4 className="fw-bold mb-0">{formatCurrency(report.totalServiceSales)}</h4>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          SALES TABLE
      ====================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-white border-0 p-4">
          <CRow className="align-items-center">
            <CCol md={7}>
              <h5 className="fw-bold mb-1">My Sales</h5>

              <small className="text-body-secondary">
                Showing <strong>{filteredSales.length}</strong> of <strong>{sales.length}</strong>{' '}
                transactions
              </small>
            </CCol>

            <CCol md={5} className="mt-3 mt-md-0">
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>

                <CFormInput
                  placeholder="Search receipt, customer, staff..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>
          </CRow>
        </CCardHeader>

        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />

              <div className="text-body-secondary mt-3">Loading your sales...</div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div
                className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: 70,
                  height: 70,
                }}
              >
                <CIcon icon={cilCart} size="xl" className="text-body-secondary" />
              </div>

              <h5 className="fw-bold">No Sales Found</h5>

              <p className="text-body-secondary mb-3">
                There are no sales matching the selected period or search.
              </p>

              {hasFilters && (
                <CButton color="primary" variant="outline" onClick={resetFilters}>
                  Clear Filters
                </CButton>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell className="px-4">#</CTableHeaderCell>

                    <CTableHeaderCell>Receipt</CTableHeaderCell>

                    <CTableHeaderCell>Customer</CTableHeaderCell>

                    <CTableHeaderCell>Card No.</CTableHeaderCell>

                    <CTableHeaderCell>Stand Tag</CTableHeaderCell>

                    <CTableHeaderCell>Service Provider</CTableHeaderCell>

                    <CTableHeaderCell>Payment</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Amount</CTableHeaderCell>

                    <CTableHeaderCell>Status</CTableHeaderCell>

                    <CTableHeaderCell>Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {filteredSales.map((sale, index) => {
                    const returnAmount = getSaleReturnAmount(sale)

                    const saleAmount = getSaleAmount(sale)

                    return (
                      <CTableRow key={sale.id || sale.receiptNumber || index}>
                        {/* NUMBER */}

                        <CTableDataCell className="px-4 text-body-secondary">
                          {index + 1}
                        </CTableDataCell>

                        {/* RECEIPT */}

                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-2"
                              style={{
                                width: 36,
                                height: 36,
                              }}
                            >
                              <CIcon icon={cilCart} size="sm" />
                            </div>

                            <div>
                              <div className="fw-semibold">{sale.receiptNumber || '-'}</div>

                              {sale.saleType && (
                                <small className="text-body-secondary text-capitalize">
                                  {sale.saleType}
                                </small>
                              )}
                            </div>
                          </div>
                        </CTableDataCell>

                        {/* CUSTOMER */}

                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon icon={cilUser} size="sm" className="text-body-secondary me-2" />

                            <span>{sale.customer || 'Walk-in Customer'}</span>
                          </div>
                        </CTableDataCell>

                        {/* CARD */}

                        <CTableDataCell>
                          {sale.CardNumber ? (
                            <CBadge color="light" className="text-dark border">
                              {sale.CardNumber}
                            </CBadge>
                          ) : (
                            <span className="text-body-secondary">—</span>
                          )}
                        </CTableDataCell>

                        {/* STAND */}

                        <CTableDataCell>
                          {sale.StandTag ? (
                            <CBadge color="light" className="text-dark border">
                              <CIcon icon={cilTag} size="sm" className="me-1" />

                              {sale.StandTag}
                            </CBadge>
                          ) : (
                            <span className="text-body-secondary">—</span>
                          )}
                        </CTableDataCell>

                        {/* SERVICE PROVIDER */}

                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center me-2"
                              style={{
                                width: 32,
                                height: 32,
                              }}
                            >
                              <CIcon icon={cilUser} size="sm" />
                            </div>

                            <span className="fw-semibold">{sale.serviceProvider || '—'}</span>
                          </div>
                        </CTableDataCell>

                        {/* PAYMENT */}

                        <CTableDataCell>{renderPaymentBadge(sale.paymentMethod)}</CTableDataCell>

                        {/* AMOUNT */}

                        <CTableDataCell className="text-end">
                          <div className="fw-bold">{formatCurrency(saleAmount)}</div>

                          {returnAmount > 0 && (
                            <small className="text-danger">
                              Return: {formatCurrency(returnAmount)}
                            </small>
                          )}
                        </CTableDataCell>

                        {/* STATUS */}

                        <CTableDataCell>{renderSaleStatus(sale)}</CTableDataCell>

                        {/* DATE */}

                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon
                              icon={cilCalendar}
                              size="sm"
                              className="text-body-secondary me-2"
                            />

                            <span className="small">{formatDateTime(sale.createdAt)}</span>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      {!loading && filteredSales.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3 px-1">
          <small className="text-body-secondary">
            Sales shown are based on the selected reporting period.
          </small>

          <strong className="text-primary">Net Sales: {formatCurrency(report.netSales)}</strong>
        </div>
      )}
    </div>
  )
}

export default MySales
