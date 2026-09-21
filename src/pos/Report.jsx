import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'

import ReturnModal from './ReturnModal'

import {
  cilSearch,
  cilCloudDownload,
  cilFilter,
  cilMoney,
  cilPeople,
  cilChart,
  cilCheckCircle,
  cilHome,
} from '@coreui/icons'

import CIcon from '@coreui/icons-react'

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
  const [providerFilter, setProviderFilter] = useState('')
  const [search, setSearch] = useState('')

  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState(null)

  const [sales, setSales] = useState([])
  const [report, setReport] = useState({})

  // =========================================================
  // HELPERS
  // =========================================================

  const money = (value) => {
    return `₦${Number(value || 0).toLocaleString()}`
  }

  const getProviderName = (sale) => {
    return sale.ServiceProvider?.fullname || sale.ServiceProvider?.User?.fullname || '-'
  }

  const getCashierName = (sale) => {
    return sale.RecordedBy?.fullname || sale.RecordedBy?.User?.fullname || '-'
  }

  const getCustomerName = (sale) => {
    return sale.Customer?.fullname || '-'
  }

  // const getServiceItems = (sale) => {
  //   return (
  //     sale.items?.filter(
  //       (item) =>
  //         item.itemType === 'service' ||
  //         item.saleType === 'service' ||
  //         item.Service ||
  //         item.service,
  //     ) || []
  //   )
  // }

  const getServiceItems = (sale) => {
    return (
      sale.SaleItems?.filter(
        (item) =>
          item.itemType === 'service' ||
          item.saleType === 'service' ||
          item.Service ||
          item.service,
      ) || []
    )
  }

  const getProductItems = (sale) => {
    return (
      sale.SaleItems?.filter(
        (item) =>
          item.itemType === 'product' ||
          item.saleType === 'product' ||
          item.Product ||
          item.product,
      ) || []
    )
  }

  const getServiceTotal = (sale) => {
    return getServiceItems(sale).reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
  }

  const getProductTotal = (sale) => {
    return getProductItems(sale).reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
  }

  // =========================================================
  // GET COMMISSION FOR SALE
  // =========================================================
  //
  // Your backend should return Commission with every sale.
  //
  // We support both:
  // sale.Commission
  // sale.commission
  //
  // =========================================================

  const getCommission = (sale) => {
    return sale.Commission || sale.commission || null
  }

  const getStaffShare = (sale) => {
    const commission = getCommission(sale)

    if (commission) {
      return Number(commission.commissionAmount || 0)
    }

    return 0
  }

  const getCommissionRate = (sale) => {
    const commission = getCommission(sale)

    if (commission) {
      return Number(commission.commissionRate || 0)
    }

    return 0
  }

  const getServiceType = (sale) => {
    /*
     * If you later add serviceType directly to Sale,
     * this will automatically use it.
     *
     * For the current commission system, the Commission
     * record is the source of truth for the rate.
     */

    if (sale.serviceType) {
      return sale.serviceType
    }

    const rate = getCommissionRate(sale)

    if (rate === 50) {
      return 'home_service'
    }

    if (rate === 30) {
      return 'in_salon'
    }

    return null
  }

  const getOwnerServiceProfit = (sale) => {
    const serviceRevenue = getServiceTotal(sale)
    const staffShare = getStaffShare(sale)

    return Math.max(serviceRevenue - staffShare, 0)
  }

  // =========================================================
  // SERVICE PROVIDERS
  // =========================================================

  const serviceProviders = useMemo(() => {
    return [
      ...new Set(
        sales
          .map((sale) => getProviderName(sale))
          .filter((provider) => provider && provider !== '-'),
      ),
    ]
  }, [sales])

  // =========================================================
  // FILTER SALES
  // =========================================================

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return sales.filter((sale) => {
      const provider = getProviderName(sale).toLowerCase()
      const customer = getCustomerName(sale).toLowerCase()
      const cashier = getCashierName(sale).toLowerCase()

      const invoice = (sale.invoiceNumber || sale.receiptNumber || '').toLowerCase()

      const services = getServiceItems(sale)
        .map(
          (item) => item.Service?.name || item.service?.name || item.serviceName || item.name || '',
        )
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !keyword ||
        invoice.includes(keyword) ||
        customer.includes(keyword) ||
        cashier.includes(keyword) ||
        provider.includes(keyword) ||
        services.includes(keyword)

      const matchesProvider = providerFilter === '' || getProviderName(sale) === providerFilter

      return matchesSearch && matchesProvider
    })
  }, [sales, search, providerFilter])

  // =========================================================
  // REPORT KPIs
  // =========================================================
  //
  // IMPORTANT:
  // These are calculated from filteredSales.
  //
  // Therefore:
  // Search staff -> KPIs change
  // Search service -> KPIs change
  // Select provider -> KPIs change
  //
  // =========================================================

  const kpis = useMemo(() => {
    let grossSales = 0
    let totalReturns = 0
    let netSales = 0
    let totalServiceSales = 0
    let totalProductSales = 0
    let productProfit = 0
    let staffShare = 0
    let ownerServiceProfit = 0
    let homeServiceSales = 0
    let inSalonServiceSales = 0

    filteredSales.forEach((sale) => {
      const saleAmount = Number(sale.totalAmount || 0)

      grossSales += saleAmount

      const serviceTotal = getServiceTotal(sale)
      const productTotal = getProductTotal(sale)

      totalServiceSales += serviceTotal
      totalProductSales += productTotal

      const commission = getStaffShare(sale)

      staffShare += commission

      ownerServiceProfit += getOwnerServiceProfit(sale)

      const serviceType = getServiceType(sale)

      if (serviceType === 'home_service') {
        homeServiceSales += serviceTotal
      }

      if (serviceType === 'in_salon') {
        inSalonServiceSales += serviceTotal
      }

      /*
       * If your sale response contains a product profit field,
       * use it here.
       *
       * Otherwise product profit can still be supplied by the
       * backend report.
       */
      if (sale.productProfit !== undefined) {
        productProfit += Number(sale.productProfit || 0)
      }
    })

    /*
     * If the backend supplies returns, use the backend value
     * when there is no per-sale return information.
     */
    totalReturns = Number(report.totalReturns || 0)

    netSales = grossSales - totalReturns

    /*
     * If product profit wasn't included per sale,
     * fall back to backend product profit.
     */
    if (filteredSales.length > 0 && productProfit === 0 && Number(report.productProfit || 0) > 0) {
      productProfit = Number(report.productProfit || 0)
    }

    const ownerProfit = productProfit + ownerServiceProfit

    const totalProfit = ownerProfit

    const totalTransactions = filteredSales.length

    const averageSale = totalTransactions > 0 ? netSales / totalTransactions : 0

    return {
      grossSales,
      totalReturns,
      netSales,
      totalTransactions,
      totalServiceSales,
      totalProductSales,
      productProfit,
      staffShare,
      ownerServiceProfit,
      ownerProfit,
      totalProfit,
      averageSale,
      homeServiceSales,
      inSalonServiceSales,
    }
  }, [filteredSales, report])

  // =========================================================
  // GET SALES REPORT
  // =========================================================

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
      console.error('Report Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getSalesReport()
  }, [])

  // =========================================================
  // RETURN
  // =========================================================

  const handleReturn = (sale) => {
    setSelectedSaleId(sale.id)
    setShowReturnModal(true)
  }

  // =========================================================
  // EXPORT EXCEL
  // =========================================================

  const exportExcel = () => {
    const exportData = filteredSales.map((sale) => {
      const provider = getProviderName(sale)

      const services = getServiceItems(sale)
        .map(
          (item) =>
            item.Service?.name ||
            item.service?.name ||
            item.serviceName ||
            item.name ||
            item.productName ||
            '-',
        )
        .join(', ')

      const commissionRate = getCommissionRate(sale)
      const staffShare = getStaffShare(sale)
      const serviceRevenue = getServiceTotal(sale)
      const ownerServiceProfit = getOwnerServiceProfit(sale)

      return {
        Invoice: sale.invoiceNumber || sale.receiptNumber || '-',

        Customer: getCustomerName(sale),

        'Sales By': getCashierName(sale),

        'Service Provider': provider,

        'Service Type': getServiceType(sale) === 'home_service' ? 'Home Service' : 'In-Salon',

        'Service Rendered': services || '-',

        'Service Revenue': serviceRevenue,

        'Commission Rate': `${commissionRate}%`,

        'Staff Share': staffShare,

        'Owner Service Profit': ownerServiceProfit,

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

  // =========================================================
  // KPI CARD
  // =========================================================

  const KpiCard = ({ title, value, icon, color, subtitle }) => (
    <CCard className="border-0 shadow-sm h-100">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-medium-emphasis small mb-2">{title}</div>

            <h3 className={`fw-bold mb-1 text-${color}`}>{value}</h3>

            {subtitle && <small className="text-medium-emphasis">{subtitle}</small>}
          </div>

          <div className={`rounded-circle bg-${color} bg-opacity-10 p-3`}>
            <CIcon icon={icon} className={`text-${color}`} size="xl" />
          </div>
        </div>
      </CCardBody>
    </CCard>
  )

  return (
    <>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="fw-bold mb-1">Sales & Profit Report</h4>

              <div className="text-medium-emphasis">
                Track sales, services, staff commissions and owner profitability.
              </div>
            </div>

            <CButton color="success" onClick={exportExcel} disabled={!filteredSales.length}>
              <CIcon icon={cilCloudDownload} className="me-2" />
              Export Excel
            </CButton>
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
    KPI SECTION 1 - SALES
===================================================== */}

      <CRow className="g-3 mb-3">
        {/* GROSS SALES */}
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Gross Sales</div>

                  <h3 className="fw-bold text-success mb-1">
                    ₦{Number(kpis.grossSales || 0).toLocaleString()}
                  </h3>

                  <small className="text-medium-emphasis">
                    {kpis.totalTransactions} transactions
                  </small>
                </div>

                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                  <CIcon icon={cilMoney} className="text-success" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* NET SALES */}
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Net Sales</div>

                  <h3 className="fw-bold text-primary mb-1">
                    ₦{Number(kpis.netSales || 0).toLocaleString()}
                  </h3>

                  <small className="text-medium-emphasis">
                    Average sale: ₦{Number(kpis.averageSale || 0).toLocaleString()}
                  </small>
                </div>

                <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                  <CIcon icon={cilChart} className="text-primary" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* SERVICE REVENUE */}
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Service Revenue</div>

                  <h3 className="fw-bold text-info mb-1">
                    ₦{Number(kpis.totalServiceSales || 0).toLocaleString()}
                  </h3>

                  <small className="text-medium-emphasis">
                    In-Salon: ₦{Number(kpis.inSalonServiceSales || 0).toLocaleString()}
                  </small>
                </div>

                <div className="rounded-circle bg-info bg-opacity-10 p-3">
                  <CIcon icon={cilPeople} className="text-info" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* PRODUCT SALES */}
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Product Sales</div>

                  <h3 className="fw-bold text-secondary mb-1">
                    ₦{Number(kpis.totalProductSales || 0).toLocaleString()}
                  </h3>

                  <small className="text-medium-emphasis">Product revenue</small>
                </div>

                <div className="rounded-circle bg-secondary bg-opacity-10 p-3">
                  <CIcon icon={cilMoney} className="text-secondary" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
  KPI SECTION 2 - PROFIT
===================================================== */}

      <CRow className="g-3 mb-4">
        {/* STAFF SHARE */}
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Staff Share</div>

                  <h3 className="fw-bold text-warning mb-1">
                    ₦{Number(kpis.staffShare || 0).toLocaleString()}
                  </h3>

                  <small className="text-medium-emphasis">Actual service commission</small>
                </div>

                <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                  <CIcon icon={cilPeople} className="text-warning" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* OWNER SERVICE PROFIT */}
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Owner Service Profit</div>

                  <h3 className="fw-bold text-success mb-1">
                    ₦{Number(kpis.ownerServiceProfit || 0).toLocaleString()}
                  </h3>

                  <small className="text-medium-emphasis">Service revenue − staff share</small>
                </div>

                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                  <CIcon icon={cilCheckCircle} className="text-success" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* OWNER PROFIT */}
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Owner Profit</div>

                  <h3 className="fw-bold text-success mb-1">
                    ₦{Number(kpis.ownerProfit || 0).toLocaleString()}
                  </h3>

                  <small className="text-medium-emphasis">Product + service profit</small>
                </div>

                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                  <CIcon icon={cilChart} className="text-success" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* HOME SERVICE */}
        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Home Service</div>

                  <h3 className="fw-bold text-dark mb-1">
                    ₦{Number(kpis.homeServiceSales || 0).toLocaleString()}
                  </h3>

                  <small className="text-medium-emphasis">50% staff share where applicable</small>
                </div>

                <div className="rounded-circle bg-dark bg-opacity-10 p-3">
                  <CIcon icon={cilHome} className="text-dark" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          FILTER PANEL
      ===================================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-transparent border-0">
          <div className="d-flex align-items-center">
            <CIcon icon={cilFilter} className="me-2" />

            <strong>Report Filters</strong>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Status</label>

              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={3}>
              <label className="small fw-semibold mb-1">Service Provider</label>

              <CFormSelect
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <option value="">All Service Providers</option>

                {serviceProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol xs={12} md={3}>
              <label className="small fw-semibold mb-1">Search</label>

              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>

                <CFormInput
                  placeholder="Invoice, customer, staff or service..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>
          </CRow>

          <div className="mt-3 d-flex gap-2">
            <CButton color="primary" onClick={getSalesReport} disabled={loading}>
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Loading...
                </>
              ) : (
                <>
                  <CIcon icon={cilFilter} className="me-2" />
                  Apply Date/Status Filter
                </>
              )}
            </CButton>

            {(providerFilter || search) && (
              <CButton
                color="secondary"
                variant="outline"
                onClick={() => {
                  setProviderFilter('')
                  setSearch('')
                }}
              >
                Clear Search
              </CButton>
            )}
          </div>
        </CCardBody>
      </CCard>

      {/* =====================================================
          ACTIVE FILTER SUMMARY
      ===================================================== */}

      {(providerFilter || search) && (
        <CCard className="border-0 shadow-sm mb-4">
          <CCardBody>
            <div className="d-flex align-items-center flex-wrap gap-3">
              <strong>Current View:</strong>

              {providerFilter && (
                <CBadge color="primary" className="px-3 py-2">
                  Provider: {providerFilter}
                </CBadge>
              )}

              {search && (
                <CBadge color="info" className="px-3 py-2">
                  Search: {search}
                </CBadge>
              )}

              <span className="text-medium-emphasis">
                {filteredSales.length} matching transaction
                {filteredSales.length !== 1 ? 's' : ''}
              </span>

              <strong>{money(kpis.netSales)}</strong>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* =====================================================
          SALES TABLE
      ===================================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1 fw-bold">Sales Transactions</h5>

              <small className="text-medium-emphasis">
                Showing {filteredSales.length} transaction
                {filteredSales.length !== 1 ? 's' : ''}
              </small>
            </div>

            <CBadge color="primary" className="px-3 py-2">
              Staff Share: {money(kpis.staffShare)}
            </CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <CTable hover responsive className="mb-0 align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Invoice</CTableHeaderCell>

                <CTableHeaderCell>Customer</CTableHeaderCell>

                <CTableHeaderCell>Sales By</CTableHeaderCell>

                <CTableHeaderCell>Service Provider</CTableHeaderCell>

                <CTableHeaderCell>Service Rendered</CTableHeaderCell>

                <CTableHeaderCell>Service Type</CTableHeaderCell>

                <CTableHeaderCell>Revenue</CTableHeaderCell>

                <CTableHeaderCell>Staff Share</CTableHeaderCell>

                <CTableHeaderCell>Owner Profit</CTableHeaderCell>

                <CTableHeaderCell>Card / Stand</CTableHeaderCell>

                <CTableHeaderCell>Status</CTableHeaderCell>

                <CTableHeaderCell>Date</CTableHeaderCell>

                <CTableHeaderCell>Action</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const provider = getProviderName(sale)

                  const services = getServiceItems(sale)

                  const serviceTotal = getServiceTotal(sale)

                  const staffShare = getStaffShare(sale)

                  const commissionRate = getCommissionRate(sale)

                  const ownerServiceProfit = getOwnerServiceProfit(sale)

                  const serviceType = getServiceType(sale)

                  const isHomeService = serviceType === 'home_service'

                  return (
                    <CTableRow key={sale.id}>
                      {/* INVOICE */}
                      <CTableDataCell>
                        <strong>{sale.invoiceNumber || sale.receiptNumber || '-'}</strong>
                      </CTableDataCell>

                      {/* CUSTOMER */}
                      <CTableDataCell>{getCustomerName(sale)}</CTableDataCell>

                      {/* CASHIER */}
                      <CTableDataCell>{getCashierName(sale)}</CTableDataCell>

                      {/* SERVICE PROVIDER */}
                      <CTableDataCell>
                        {provider !== '-' ? <CBadge color="info">{provider}</CBadge> : '-'}
                      </CTableDataCell>

                      {/* SERVICE RENDERED */}
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
                              <div key={item.id || index} className="mb-1">
                                <div className="fw-semibold">{serviceName}</div>

                                <small className="text-medium-emphasis">
                                  {item.quantity && Number(item.quantity) > 1
                                    ? `Qty: ${item.quantity} • `
                                    : ''}

                                  {money(item.subtotal)}
                                </small>
                              </div>
                            )
                          })
                        ) : (
                          <span className="text-medium-emphasis">No service</span>
                        )}
                      </CTableDataCell>

                      {/* SERVICE TYPE */}
                      <CTableDataCell>
                        {services.length > 0 ? (
                          <CBadge color={isHomeService ? 'dark' : 'primary'}>
                            {isHomeService ? 'Home Service' : 'In-Salon'}
                          </CBadge>
                        ) : (
                          '-'
                        )}

                        {commissionRate > 0 && (
                          <div className="small text-medium-emphasis mt-1">
                            {commissionRate}% staff
                          </div>
                        )}
                      </CTableDataCell>

                      {/* REVENUE */}
                      <CTableDataCell>
                        <div className="fw-bold">{money(Number(sale.totalAmount || 0))}</div>

                        {serviceTotal > 0 && (
                          <small className="text-info">Service: {money(serviceTotal)}</small>
                        )}
                      </CTableDataCell>

                      {/* STAFF SHARE */}
                      <CTableDataCell>
                        {staffShare > 0 ? (
                          <>
                            <div className="fw-bold text-warning">{money(staffShare)}</div>

                            <small className="text-medium-emphasis">{commissionRate}%</small>
                          </>
                        ) : (
                          '-'
                        )}
                      </CTableDataCell>

                      {/* OWNER PROFIT */}
                      <CTableDataCell>
                        {serviceTotal > 0 ? (
                          <div className="fw-bold text-success">{money(ownerServiceProfit)}</div>
                        ) : (
                          '-'
                        )}
                      </CTableDataCell>

                      {/* CARD / STAND */}
                      <CTableDataCell>
                        {isHomeService ? (
                          <CBadge color="dark">Home Service</CBadge>
                        ) : (
                          <>
                            <div>
                              <strong>Card:</strong> {sale.CardNumber || '-'}
                            </div>

                            <small className="text-medium-emphasis">
                              Stand: {sale.StandTag || '-'}
                            </small>
                          </>
                        )}
                      </CTableDataCell>

                      {/* STATUS */}
                      <CTableDataCell>
                        <CBadge
                          color={
                            sale.approvalStatus === 'approved'
                              ? 'success'
                              : sale.approvalStatus === 'cancelled'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {sale.approvalStatus || 'pending'}
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
                  <CTableDataCell colSpan="13" className="text-center py-5">
                    <CIcon icon={cilSearch} size="xl" className="text-medium-emphasis mb-3" />

                    <h5>No sales found</h5>

                    <p className="text-medium-emphasis mb-0">
                      Try changing your search, service provider or date filters.
                    </p>
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      {/* =====================================================
          RETURN MODAL
      ===================================================== */}

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
