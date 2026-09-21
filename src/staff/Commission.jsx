import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CSpinner,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'

import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilReload,
  cilFilter,
  cilCloudDownload,
  cilCheckCircle,
  cilClock,
  cilMoney,
  cilLoopCircular,
  cilUser,
  cilCalendar,
  cilX,
} from '@coreui/icons'

const Commission = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [staffs, setStaffs] = useState([])

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
  // GET COMMISSIONS
  // =========================================================

  const getCommissions = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/commissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setCommissions(response.data.commissions || [])
    } catch (error) {
      console.error('Commission Error:', error)

      Swal.fire({
        icon: 'error',
        title: 'Unable to Load Commissions',
        text: error?.response?.data?.message || 'There was a problem loading commission records.',
      })
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // GET STAFF
  // =========================================================

  const getStaffs = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/staffs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setStaffs(response.data.staffs || [])
    } catch (error) {
      console.error('Staff Error:', error)
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([getCommissions(), getStaffs()])
    }

    fetchData()
  }, [])

  // =========================================================
  // COMMISSION HELPERS
  // =========================================================

  const getOriginalCommission = (item) => {
    if (item.originalCommissionAmount !== undefined && item.originalCommissionAmount !== null) {
      return Number(item.originalCommissionAmount)
    }

    return Number(item.commissionAmount || 0)
  }

  const getCurrentCommission = (item) => {
    return Number(item.commissionAmount || 0)
  }

  const getReturnedCommission = (item) => {
    if (item.returnedCommissionAmount !== undefined && item.returnedCommissionAmount !== null) {
      return Number(item.returnedCommissionAmount)
    }

    const original = getOriginalCommission(item)
    const current = getCurrentCommission(item)

    return Math.max(original - current, 0)
  }

  const isReturned = (item) => {
    if (item.returned === true) return true
    if (item.isReturned === true) return true

    if (Number(item.returnedServiceTotal || 0) > 0) {
      return true
    }

    if (item.Sale?.status === 'refunded' || item.Sale?.status === 'voided') {
      return true
    }

    return false
  }

  // =========================================================
  // FILTERED COMMISSIONS
  // =========================================================

  const filteredCommissions = useMemo(() => {
    return commissions.filter((commission) => {
      const staffName =
        commission.Staff?.User?.fullname ||
        commission.Staff?.User?.name ||
        commission.Staff?.name ||
        ''

      const receiptNumber = commission.Sale?.receiptNumber || commission.Sale?.ReceiptNumber || ''

      const searchText = `${staffName} ${receiptNumber}`.toLowerCase()

      const searchMatch = searchText.includes(search.toLowerCase())

      const staffMatch =
        selectedStaff === '' || String(commission.StaffId) === String(selectedStaff)

      const statusMatch = statusFilter === '' || commission.status === statusFilter

      const date = commission.commissionDate ? new Date(commission.commissionDate) : null

      const monthMatch = monthFilter === '' || (date && date.getMonth() + 1 === Number(monthFilter))

      const yearMatch = yearFilter === '' || (date && date.getFullYear() === Number(yearFilter))

      return searchMatch && staffMatch && statusMatch && monthMatch && yearMatch
    })
  }, [commissions, search, selectedStaff, statusFilter, monthFilter, yearFilter])

  // =========================================================
  // COMMISSION KPIs
  // =========================================================

  // =========================================================
  // 1. CURRENT COMMISSION
  // =========================================================
  // Total commission currently applicable to all records
  // after service returns have been accounted for.
  //
  // Example:
  // Original = ₦10,000
  // Return adjustment = ₦3,000
  // Current = ₦7,000
  //
  // Current Commission = ₦7,000
  // =========================================================

  const totalCommission = filteredCommissions.reduce((sum, item) => {
    return sum + Number(item.currentCommissionAmount ?? item.commissionAmount ?? 0)
  }, 0)

  // =========================================================
  // 2. CURRENT PENDING COMMISSION
  // =========================================================
  // Only commissions that are still pending.
  //
  // IMPORTANT:
  // This uses the CURRENT amount after returns.
  //
  // Example:
  // Original commission = ₦10,000
  // Return adjustment  = ₦3,000
  // Current pending    = ₦7,000
  //
  // Pending KPI = ₦7,000
  // =========================================================

  const pendingCommission = filteredCommissions.reduce((sum, item) => {
    if (item.status !== 'pending') {
      return sum
    }

    return sum + Number(item.currentCommissionAmount ?? item.commissionAmount ?? 0)
  }, 0)

  // =========================================================
  // 3. PAID COMMISSION
  // =========================================================
  // Only commissions whose status is paid.
  //
  // These are commissions that have already been paid
  // to the service provider.
  // =========================================================

  const paidCommission = filteredCommissions.reduce((sum, item) => {
    if (item.status !== 'paid') {
      return sum
    }

    return sum + Number(item.currentCommissionAmount ?? item.commissionAmount ?? 0)
  }, 0)

  // =========================================================
  // 4. RETURN ADJUSTMENTS
  // =========================================================
  // Total commission removed because services were returned.
  //
  // Example:
  // Original commission = ₦10,000
  // Current commission  = ₦7,000
  // Return adjustment   = ₦3,000
  //
  // Return Adjustment KPI = ₦3,000
  //
  // This value comes from the backend calculation.
  // =========================================================

  const returnedCommission = filteredCommissions.reduce((sum, item) => {
    return sum + Number(item.returnedCommissionAmount || 0)
  }, 0)

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('')
    setMonthFilter('')
    setYearFilter('')
    setSelectedStaff('')
  }

  const hasFilters = search || statusFilter || monthFilter || yearFilter || selectedStaff

  // =========================================================
  // MARK COMMISSION AS PAID
  // =========================================================

  const markPaid = async (id, amount) => {
    if (Number(amount || 0) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Commission Due',
        text: 'This commission has no outstanding amount to pay.',
      })

      return
    }

    const result = await Swal.fire({
      title: 'Mark Commission as Paid?',
      text: `You are about to mark ${formatCurrency(amount)} as paid.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark as Paid',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#198754',
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}api/v1/commissions/${id}/pay`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      await Swal.fire({
        icon: 'success',
        title: 'Payment Recorded',
        text: 'Commission has been marked as paid.',
        timer: 1800,
        showConfirmButton: false,
      })

      getCommissions()
    } catch (error) {
      console.error(error)

      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: error?.response?.data?.message || 'Unable to mark commission as paid.',
      })
    }
  }

  // =========================================================
  // EXPORT EXCEL
  // =========================================================

  const exportExcel = () => {
    if (!filteredCommissions.length) {
      Swal.fire({
        icon: 'info',
        title: 'Nothing to Export',
        text: 'There are no commission records matching your filters.',
      })

      return
    }

    const worksheetData = filteredCommissions.map((item) => ({
      Staff: item.Staff?.User?.fullname || item.Staff?.name || 'Unknown',

      Receipt: item.Sale?.receiptNumber || item.Sale?.ReceiptNumber || '-',

      OriginalCommission: getOriginalCommission(item),

      ReturnedCommission: getReturnedCommission(item),

      CurrentCommission: getCurrentCommission(item),

      Rate: `${Number(item.commissionRate || 0)}%`,

      Date: item.commissionDate,

      Status: item.status?.toUpperCase() || '',

      Returned: isReturned(item) ? 'YES' : 'NO',
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commissions')

    XLSX.writeFile(workbook, 'CommissionReport.xlsx')
  }

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const renderStatus = (status) => {
    if (status === 'paid') {
      return (
        <CBadge color="success" className="px-3 py-2">
          <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
          PAID
        </CBadge>
      )
    }

    return (
      <CBadge color="warning" className="px-3 py-2">
        <CIcon icon={cilClock} size="sm" className="me-1" />
        PENDING
      </CBadge>
    )
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="commission-page">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody className="p-4">
          <CRow className="align-items-center">
            <CCol md={7}>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '52px',
                    height: '52px',
                  }}
                >
                  <CIcon icon={cilMoney} size="xl" className="text-primary" />
                </div>

                <div>
                  <h3 className="fw-bold mb-1">Staff Commission</h3>

                  <div className="text-body-secondary">
                    Track staff earnings, payments, adjustments and returned services.
                  </div>
                </div>
              </div>
            </CCol>

            <CCol md={5} className="text-md-end mt-3 mt-md-0">
              <CButton
                color="light"
                className="me-2 border"
                onClick={getCommissions}
                disabled={loading}
              >
                <CIcon icon={cilReload} className="me-2" />
                Refresh
              </CButton>

              <CButton color="primary" onClick={exportExcel} disabled={!filteredCommissions.length}>
                <CIcon icon={cilCloudDownload} className="me-2" />
                Export Excel
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <CRow className="mb-4">
        {/* TOTAL */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-body-secondary small fw-semibold mb-2">
                    CURRENT COMMISSION
                  </div>

                  <h4 className="fw-bold mb-1">{formatCurrency(totalCommission)}</h4>

                  <small className="text-body-secondary">
                    {filteredCommissions.length} record
                    {filteredCommissions.length !== 1 ? 's' : ''}
                  </small>
                </div>

                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{
                    width: 45,
                    height: 45,
                  }}
                >
                  <CIcon icon={cilMoney} className="text-primary" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* PENDING */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-body-secondary small fw-semibold mb-2">PENDING</div>

                  <h4 className="fw-bold mb-1 text-warning">{formatCurrency(pendingCommission)}</h4>

                  <small className="text-body-secondary">Awaiting payment</small>
                </div>

                <div
                  className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{
                    width: 45,
                    height: 45,
                  }}
                >
                  <CIcon icon={cilClock} className="text-warning" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* PAID */}

        <CCol sm={6} xl={3} className="mb-3 mb-xl-0">
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-body-secondary small fw-semibold mb-2">PAID</div>

                  <h4 className="fw-bold mb-1 text-success">{formatCurrency(paidCommission)}</h4>

                  <small className="text-body-secondary">Completed payments</small>
                </div>

                <div
                  className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{
                    width: 45,
                    height: 45,
                  }}
                >
                  <CIcon icon={cilCheckCircle} className="text-success" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* RETURNED */}

        <CCol sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-body-secondary small fw-semibold mb-2">
                    RETURN ADJUSTMENTS
                  </div>

                  <h4 className="fw-bold mb-1 text-danger">{formatCurrency(returnedCommission)}</h4>

                  <small className="text-body-secondary">Commission removed</small>
                </div>

                <div
                  className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center"
                  style={{
                    width: 45,
                    height: 45,
                  }}
                >
                  <CIcon icon={cilLoopCircular} className="text-danger" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-white border-0 pt-4 px-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <CIcon icon={cilFilter} className="me-2 text-primary" />

              <strong>Commission Filters</strong>
            </div>

            {hasFilters && (
              <CButton color="light" size="sm" className="border" onClick={resetFilters}>
                <CIcon icon={cilX} className="me-1" />
                Clear Filters
              </CButton>
            )}
          </div>
        </CCardHeader>

        <CCardBody className="px-4 pb-4">
          <CRow className="g-3">
            {/* SEARCH */}

            <CCol xs={12} lg={4}>
              <label className="form-label small fw-semibold">Search</label>

              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>

                <CFormInput
                  placeholder="Staff name or receipt number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>

            {/* STAFF */}

            <CCol xs={12} sm={6} lg={2}>
              <label className="form-label small fw-semibold">Staff</label>

              <CFormSelect value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                <option value="">All Staff</option>

                {staffs.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.User?.fullname || staff.User?.name || staff.name || `Staff #${staff.id}`}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            {/* STATUS */}

            <CCol xs={12} sm={6} lg={2}>
              <label className="form-label small fw-semibold">Status</label>

              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>

                <option value="pending">Pending</option>

                <option value="paid">Paid</option>
              </CFormSelect>
            </CCol>

            {/* MONTH */}

            <CCol xs={12} sm={6} lg={2}>
              <label className="form-label small fw-semibold">Month</label>

              <CFormSelect value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                <option value="">All Months</option>

                {[
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                ].map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            {/* YEAR */}

            <CCol xs={12} sm={6} lg={2}>
              <label className="form-label small fw-semibold">Year</label>

              <CFormSelect value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option value="">All Years</option>

                {Array.from(
                  {
                    length: 7,
                  },
                  (_, index) => new Date().getFullYear() - index,
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* =====================================================
          TABLE
      ====================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-white border-0 p-4">
          <CRow className="align-items-center">
            <CCol md={6}>
              <h5 className="fw-bold mb-1">Commission Records</h5>

              <div className="text-body-secondary small">
                Showing <strong>{filteredCommissions.length}</strong> of{' '}
                <strong>{commissions.length}</strong> commission records
              </div>
            </CCol>

            <CCol md={6} className="text-md-end mt-3 mt-md-0">
              {selectedStaff && (
                <CBadge color="primary" className="px-3 py-2">
                  <CIcon icon={cilUser} className="me-1" />
                  Staff Filter Applied
                </CBadge>
              )}
            </CCol>
          </CRow>
        </CCardHeader>

        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />

              <div className="text-body-secondary mt-3">Loading commission records...</div>
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-5 px-3">
              <div
                className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: 70,
                  height: 70,
                }}
              >
                <CIcon icon={cilMoney} size="xl" className="text-body-secondary" />
              </div>

              <h5 className="fw-bold">No Commission Records</h5>

              <p className="text-body-secondary mb-3">
                No commission records match the selected filters.
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

                    <CTableHeaderCell>Staff</CTableHeaderCell>

                    <CTableHeaderCell>Receipt</CTableHeaderCell>

                    <CTableHeaderCell>Rate</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Original</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Returned</CTableHeaderCell>

                    <CTableHeaderCell className="text-end">Current</CTableHeaderCell>

                    <CTableHeaderCell>Date</CTableHeaderCell>

                    <CTableHeaderCell>Status</CTableHeaderCell>

                    <CTableHeaderCell className="text-end px-4">Action</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {filteredCommissions.map((item, index) => {
                    const original = getOriginalCommission(item)

                    const returned = getReturnedCommission(item)

                    const current = getCurrentCommission(item)

                    const returnedRecord = isReturned(item)

                    return (
                      <CTableRow key={item.id}>
                        <CTableDataCell className="px-4 text-body-secondary">
                          {index + 1}
                        </CTableDataCell>

                        {/* STAFF */}

                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center me-2 fw-bold"
                              style={{
                                width: 38,
                                height: 38,
                              }}
                            >
                              {(item.Staff?.User?.fullname || item.Staff?.name || 'S')
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <div className="fw-semibold">
                                {item.Staff?.User?.fullname ||
                                  item.Staff?.User?.name ||
                                  item.Staff?.name ||
                                  'Unknown Staff'}
                              </div>

                              {returnedRecord && (
                                <small className="text-danger">
                                  <CIcon icon={cilLoopCircular} size="sm" className="me-1" />
                                  Return adjustment
                                </small>
                              )}
                            </div>
                          </div>
                        </CTableDataCell>

                        {/* RECEIPT */}

                        <CTableDataCell>
                          <span className="fw-semibold">
                            {item.Sale?.receiptNumber || item.Sale?.ReceiptNumber || '-'}
                          </span>
                        </CTableDataCell>

                        {/* RATE */}

                        <CTableDataCell>
                          <CBadge color="secondary" className="px-2 py-1">
                            {Number(item.commissionRate || 0)}%
                          </CBadge>
                        </CTableDataCell>

                        {/* ORIGINAL */}

                        <CTableDataCell className="text-end">
                          <span className="text-body-secondary">{formatCurrency(original)}</span>
                        </CTableDataCell>

                        {/* RETURNED */}

                        <CTableDataCell className="text-end">
                          {returned > 0 ? (
                            <span className="text-danger fw-semibold">
                              - {formatCurrency(returned)}
                            </span>
                          ) : (
                            <span className="text-body-secondary">—</span>
                          )}
                        </CTableDataCell>

                        {/* CURRENT */}

                        <CTableDataCell className="text-end">
                          <span
                            className={`fw-bold ${
                              current > 0 ? 'text-success' : 'text-body-secondary'
                            }`}
                          >
                            {formatCurrency(current)}
                          </span>
                        </CTableDataCell>

                        {/* DATE */}

                        <CTableDataCell>
                          <div className="d-flex align-items-center">
                            <CIcon
                              icon={cilCalendar}
                              size="sm"
                              className="me-2 text-body-secondary"
                            />

                            {item.commissionDate
                              ? new Date(item.commissionDate).toLocaleDateString('en-NG', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </div>
                        </CTableDataCell>

                        {/* STATUS */}

                        <CTableDataCell>{renderStatus(item.status)}</CTableDataCell>

                        {/* ACTION */}

                        <CTableDataCell className="text-end px-4">
                          {item.status === 'pending' ? (
                            <CButton
                              size="sm"
                              color="success"
                              variant="outline"
                              disabled={current <= 0}
                              onClick={() => markPaid(item.id, current)}
                            >
                              <CIcon icon={cilCheckCircle} className="me-1" />
                              Pay
                            </CButton>
                          ) : (
                            <span className="text-success small fw-semibold">
                              <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
                              Paid
                            </span>
                          )}
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
          SMALL FOOTER SUMMARY
      ====================================================== */}

      {!loading && filteredCommissions.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3 px-1">
          <small className="text-body-secondary">
            Commission figures are based on the currently selected filters.
          </small>

          <strong className="text-primary">Total: {formatCurrency(totalCommission)}</strong>
        </div>
      )}
    </div>
  )
}

export default Commission
