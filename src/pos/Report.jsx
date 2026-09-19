import React, { useEffect, useState } from 'react'

import axios from 'axios'

import * as XLSX from 'xlsx'

import CIcon from '@coreui/icons-react'
import ReturnModal from './ReturnModal'

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
  const [showReturnModal, setShowReturnModal] = useState(false)

  const [selectedSaleId, setSelectedSaleId] = useState(null)

  // STATES
  const [sales, setSales] = useState([])
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('today')
  const [report, setReport] = useState({})

  // ==========================================
  // GET UNIQUE SERVICE PROVIDERS
  // ==========================================

  const serviceProviders = [
    ...new Map(
      sales
        .map((sale) => {
          const provider =
            sale.ServiceProvider?.fullname || sale.ServiceProvider?.User?.fullname || ''

          if (!provider) return null

          return [provider, provider]
        })
        .filter(Boolean),
    ).values(),
  ]

  // ==========================================
  // FILTER SALES
  // ==========================================

  const filteredSales = sales.filter((sale) => {
    const keyword = search.toLowerCase()

    const provider = sale.ServiceProvider?.fullname || sale.ServiceProvider?.User?.fullname || ''

    const matchesSearch =
      sale.receiptNumber?.toLowerCase().includes(keyword) ||
      sale.invoiceNumber?.toLowerCase().includes(keyword) ||
      sale.Customer?.fullname?.toLowerCase().includes(keyword) ||
      sale.RecordedBy?.fullname?.toLowerCase().includes(keyword) ||
      provider.toLowerCase().includes(keyword)

    const matchesProvider = providerFilter === '' || provider === providerFilter

    return matchesSearch && matchesProvider
  })

  const handleReturn = (sale) => {
    console.log('Sale ID:', sale.id)

    setSelectedSaleId(sale.id)

    setShowReturnModal(true)
  }

  // ==========================================
  // REPORT VALUES FROM BACKEND
  // ==========================================

  const grossSales = report.grossSales || 0

  const totalReturns = report.totalReturns || 0

  const netSales = report.netSales || 0

  const totalTransactions = report.totalTransactions || 0

  const totalServiceSales = report.totalServiceSales || 0

  const totalProductSales = report.totalProductSales || 0

  const productProfit = report.productProfit || 0

  const ownerProfit = report.ownerProfit || 0

  const staffCommissionPool = report.staffShare || 0

  const totalProfits = report.totalProfit || 0

  const averageSale = totalTransactions > 0 ? netSales / totalTransactions : 0

  // ==========================================
  // GET SALES REPORT
  // ==========================================

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

  // ==========================================
  // PRODUCT SALES
  // ==========================================

  const productSales = filteredSales.reduce((sum, sale) => {
    const productTotal =
      sale.items?.reduce(
        (itemSum, item) =>
          item.itemType === 'product' ? itemSum + Number(item.subtotal || 0) : itemSum,
        0,
      ) || 0

    return sum + productTotal
  }, 0)

  // ==========================================
  // EXPORT EXCEL
  // ==========================================

  const exportExcel = () => {
    const exportData = filteredSales.map((sale) => {
      const provider = sale.ServiceProvider?.fullname || sale.ServiceProvider?.User?.fullname || '-'

      const services =
        sale.items
          ?.filter((item) => item.itemType === 'service' || item.saleType === 'service')
          .map((item) => {
            return (
              item.Service?.name ||
              item.service?.name ||
              item.serviceName ||
              item.name ||
              item.productName ||
              '-'
            )
          })
          .join(', ') || '-'

      return {
        Invoice: sale.invoiceNumber || sale.receiptNumber || '-',
        Customer: sale.Customer?.fullname || '-',
        'Sales By': sale.RecordedBy?.fullname || '-',
        'Service Provider': provider,
        Services: services,
        'Card Number': sale.CardNumber || '-',
        'Stand Tag': sale.StandTag || '-',
        Amount: Number(sale.totalAmount || 0),
        Status: sale.approvalStatus || '-',
        Date: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)

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
      {/* ==========================================
          KPI CARDS
      ========================================== */}

      <CRow className="mb-4">
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Gross Sales</h6>

              <h3 className="text-success">₦{grossSales.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Total Returns</h6>

              <h3 className="text-danger">₦{totalReturns.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Net Sales</h6>

              <h3 className="text-primary">₦{netSales.toLocaleString()}</h3>
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
      </CRow>

      <CRow className="mb-4">
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Product Profit</h6>

              <h3>₦{productProfit.toLocaleString()}</h3>
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

      {/* ==========================================
          FILTERS
      ========================================== */}

      <CRow className="mb-3">
        <CCol md={2}>
          <CFormInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CCol>

        <CCol md={2}>
          <CFormInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </CCol>

        <CCol md={2}>
          <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>

            <option value="approved">Approved</option>

            <option value="pending">Pending</option>

            <option value="cancelled">Cancelled</option>
          </CFormSelect>
        </CCol>

        {/* SERVICE PROVIDER FILTER */}
        <CCol md={3}>
          <CFormSelect value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
            <option value="">All Service Providers</option>

            {serviceProviders.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </CFormSelect>
        </CCol>

        <CCol md={3}>
          <CButton color="primary" onClick={getSalesReport} disabled={loading}>
            {loading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              'Apply Filter'
            )}
          </CButton>

          {providerFilter && (
            <CButton color="secondary" className="ms-2" onClick={() => setProviderFilter('')}>
              Clear Staff
            </CButton>
          )}
        </CCol>
      </CRow>

      {/* ==========================================
          SEARCH
      ========================================== */}

      <CFormInput
        placeholder="Search Invoice, Customer, Staff or Service Provider..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      {/* ==========================================
          CURRENT FILTER INFORMATION
      ========================================== */}

      {providerFilter && (
        <CCard className="mb-3">
          <CCardBody>
            <strong>Viewing Sales For:</strong> <CBadge color="primary">{providerFilter}</CBadge>
            <span className="ms-3">
              <strong>Transactions:</strong> {filteredSales.length}
            </span>
            <span className="ms-3">
              <strong>Sales:</strong> ₦
              {filteredSales
                .reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0)
                .toLocaleString()}
            </span>
          </CCardBody>
        </CCard>
      )}

      {/* ==========================================
          EXPORT
      ========================================== */}

      <CButton color="success" onClick={exportExcel} className="mb-3">
        Export Excel
      </CButton>

      {/* ==========================================
          SALES TABLE
      ========================================== */}

      <CTable hover responsive bordered>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Invoice</CTableHeaderCell>

            <CTableHeaderCell>Customer</CTableHeaderCell>

            <CTableHeaderCell>Sales By</CTableHeaderCell>

            <CTableHeaderCell>Service Provider</CTableHeaderCell>

            <CTableHeaderCell>Service Rendered</CTableHeaderCell>

            <CTableHeaderCell>Card/Stand Tag</CTableHeaderCell>

            <CTableHeaderCell>Amount</CTableHeaderCell>

            <CTableHeaderCell>Status</CTableHeaderCell>

            <CTableHeaderCell>Date</CTableHeaderCell>

            <CTableHeaderCell>Action</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {filteredSales.length > 0 ? (
            filteredSales.map((sale) => {
              const provider =
                sale.ServiceProvider?.fullname || sale.ServiceProvider?.User?.fullname || '-'

              // Get all services rendered on this sale
              const services =
                sale.items?.filter(
                  (item) => item.itemType === 'service' || item.saleType === 'service',
                ) || []

              return (
                <CTableRow key={sale.id}>
                  {/* INVOICE */}
                  <CTableDataCell>{sale.invoiceNumber || sale.receiptNumber}</CTableDataCell>

                  {/* CUSTOMER */}
                  <CTableDataCell>{sale.Customer?.fullname || '-'}</CTableDataCell>

                  {/* SALES BY / CASHIER */}
                  <CTableDataCell>{sale.RecordedBy?.fullname || '-'}</CTableDataCell>

                  {/* SERVICE PROVIDER */}
                  <CTableDataCell>
                    <CBadge color="info">{provider}</CBadge>
                  </CTableDataCell>

                  {/* SERVICES RENDERED */}
                  <CTableDataCell>
                    {services.length > 0 ? (
                      services.map((item, index) => {
                        const serviceName =
                          item.Service?.name ||
                          item.service?.name ||
                          item.serviceName ||
                          item.name ||
                          item.productName ||
                          'Service'

                        return (
                          <div key={item.id || index}>
                            <strong>{serviceName}</strong>

                            {item.quantity && Number(item.quantity) > 1 && (
                              <small className="text-muted ms-1">× {item.quantity}</small>
                            )}

                            {item.subtotal && (
                              <small className="text-muted ms-2">
                                ₦{Number(item.subtotal).toLocaleString()}
                              </small>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <span className="text-muted">No service</span>
                    )}
                  </CTableDataCell>

                  {/* CARD / STAND */}
                  <CTableDataCell>
                    <strong>Card:</strong> {sale.CardNumber || '-'}
                    <br />
                    <small className="text-muted">Stand: {sale.StandTag || '-'}</small>
                  </CTableDataCell>

                  {/* AMOUNT */}
                  <CTableDataCell>₦{Number(sale.totalAmount || 0).toLocaleString()}</CTableDataCell>

                  {/* STATUS */}
                  <CTableDataCell>
                    <CBadge color={sale.approvalStatus === 'approved' ? 'success' : 'warning'}>
                      {sale.approvalStatus}
                    </CBadge>
                  </CTableDataCell>

                  {/* DATE */}
                  <CTableDataCell>
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : '-'}
                  </CTableDataCell>

                  {/* ACTION */}
                  <CTableDataCell>
                    <CButton
                      color="warning"
                      size="sm"
                      disabled={sale.status === 'refunded'}
                      onClick={() => handleReturn(sale)}
                    >
                      {sale.status === 'refunded' ? 'Returned' : 'Return'}
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              )
            })
          ) : (
            <CTableRow>
              <CTableDataCell colSpan="10" className="text-center py-4">
                <strong>No sales found</strong>

                <br />

                <small className="text-muted">
                  Try selecting another service provider or changing your filters.
                </small>
              </CTableDataCell>
            </CTableRow>
          )}
        </CTableBody>
      </CTable>

      {/* ==========================================
          RETURN MODAL
      ========================================== */}

      <ReturnModal
        show={showReturnModal}
        onHide={() => setShowReturnModal(false)}
        saleId={selectedSaleId}
        reload={getSalesReport}
      />
    </>
  )
}

export default Report
