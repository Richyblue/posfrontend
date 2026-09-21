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

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const Report = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // =========================================================
  // STATE
  // =========================================================

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
    return (
      sale.ServiceProvider?.fullname ||
      sale.ServiceProvider?.User?.fullname ||
      sale.ServiceProvider?.user?.fullname ||
      '-'
    )
  }

  const getCashierName = (sale) => {
    return sale.RecordedBy?.fullname || sale.RecordedBy?.User?.fullname || '-'
  }

  const getCustomerName = (sale) => {
    return sale.Customer?.fullname || '-'
  }

  // =========================================================
  // RETURNS
  // =========================================================

  /*
   * Your Sale -> SalesReturn association currently does not
   * explicitly use an alias.
   *
   * We therefore support both possible Sequelize property
   * names here.
   */

  const getSaleReturns = (sale) => {
    return sale?.SalesReturns || sale?.salesReturns || sale?.SalesReturn || sale?.salesReturn || []
  }

  const getReturnedItems = (sale) => {
    return getSaleReturns(sale).flatMap(
      (returnRecord) => returnRecord.ReturnItems || returnRecord.returnItems || [],
    )
  }

  const getReturnedServiceItems = (sale) => {
    return getReturnedItems(sale).filter((item) => item.itemType === 'service')
  }

  const getReturnedProductItems = (sale) => {
    return getReturnedItems(sale).filter((item) => item.itemType === 'product')
  }

  /*
   * Get total returned amount for this sale.
   */

  const getSaleReturnTotal = (sale) => {
    return getSaleReturns(sale).reduce(
      (sum, returnRecord) => sum + Number(returnRecord.totalRefund || 0),
      0,
    )
  }

  /*
   * Get returned quantity for a specific service.
   */

  const getReturnedServiceQuantity = (sale, serviceId) => {
    return getReturnedServiceItems(sale)
      .filter((item) => Number(item.ServiceId) === Number(serviceId))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }

  /*
   * Get returned quantity for a specific product.
   */

  const getReturnedProductQuantity = (sale, productId) => {
    return getReturnedProductItems(sale)
      .filter((item) => Number(item.ProductId) === Number(productId))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  }

  /*
   * Determine service return status.
   */

  const getServiceReturnStatus = (sale, item) => {
    const returnedQuantity = getReturnedServiceQuantity(sale, item.ServiceId)

    const originalQuantity = Number(item.quantity || 0)

    if (returnedQuantity <= 0) {
      return {
        returned: false,
        partial: false,
        returnedQuantity: 0,
        remainingQuantity: originalQuantity,
      }
    }

    const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

    return {
      returned: true,
      partial: remainingQuantity > 0,
      returnedQuantity,
      remainingQuantity,
    }
  }

  /*
   * Determine product return status.
   */

  const getProductReturnStatus = (sale, item) => {
    const returnedQuantity = getReturnedProductQuantity(sale, item.ProductId)

    const originalQuantity = Number(item.quantity || 0)

    if (returnedQuantity <= 0) {
      return {
        returned: false,
        partial: false,
        returnedQuantity: 0,
        remainingQuantity: originalQuantity,
      }
    }

    const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

    return {
      returned: true,
      partial: remainingQuantity > 0,
      returnedQuantity,
      remainingQuantity,
    }
  }

  const REVENUE_COLORS = ['#321fdb', '#e55353', '#2eb85c']

  // =========================================================
  // SALE ITEMS
  // =========================================================

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

  // =========================================================
  // REMAINING SERVICE VALUE
  // =========================================================

  const getRemainingServiceTotal = (sale) => {
    return getServiceItems(sale).reduce((sum, item) => {
      const originalQuantity = Number(item.quantity || 0)

      const originalSubtotal = Number(item.subtotal || 0)

      const returnedQuantity = getReturnedServiceQuantity(sale, item.ServiceId)

      const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

      const unitPrice = originalQuantity > 0 ? originalSubtotal / originalQuantity : 0

      return sum + remainingQuantity * unitPrice
    }, 0)
  }

  // =========================================================
  // REMAINING PRODUCT VALUE
  // =========================================================

  const getRemainingProductTotal = (sale) => {
    return getProductItems(sale).reduce((sum, item) => {
      const originalQuantity = Number(item.quantity || 0)

      const originalSubtotal = Number(item.subtotal || 0)

      const returnedQuantity = getReturnedProductQuantity(sale, item.ProductId)

      const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

      const unitPrice = originalQuantity > 0 ? originalSubtotal / originalQuantity : 0

      return sum + remainingQuantity * unitPrice
    }, 0)
  }

  // =========================================================
  // ORIGINAL TOTALS
  // =========================================================

  const getServiceTotal = (sale) => {
    return getServiceItems(sale).reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
  }

  const getProductTotal = (sale) => {
    return getProductItems(sale).reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
  }

  // =========================================================
  // COMMISSION
  // =========================================================

  const getCommission = (sale) => {
    return sale.Commission || sale.commission || null
  }

  // =========================================================
  // STAFF SHARE
  // =========================================================

  /*
   * IMPORTANT:
   *
   * We no longer blindly use the original
   * commissionAmount.
   *
   * We calculate the commission from the remaining
   * service value so returned services do not remain
   * inside Staff Share.
   */

  const getStaffShare = (sale) => {
    const commission = getCommission(sale)

    if (commission?.status !== 'pending') {
      return 0
    }

    const commissionRate = Number(commission.commissionRate || 0)

    const remainingServiceRevenue = getRemainingServiceTotal(sale)

    return (remainingServiceRevenue * commissionRate) / 100
  }

  const getCommissionRate = (sale) => {
    const commission = getCommission(sale)

    if (commission) {
      return Number(commission.commissionRate || 0)
    }

    return 0
  }

  // =========================================================
  // SERVICE TYPE
  // =========================================================

  const getServiceType = (sale) => {
    /*
     * If Sale eventually stores serviceType directly,
     * this will use it automatically.
     */

    if (sale.serviceType) {
      return sale.serviceType
    }

    /*
     * Current system:
     *
     * 50% = Home Service
     * 30% = In-Salon
     */

    const rate = getCommissionRate(sale)

    if (rate === 50) {
      return 'home_service'
    }

    if (rate === 30) {
      return 'in_salon'
    }

    return null
  }

  // =========================================================
  // OWNER SERVICE PROFIT
  // =========================================================

  const getOwnerServiceProfit = (sale) => {
    const serviceRevenue = getRemainingServiceTotal(sale)

    const commission = getCommission(sale)

    const pendingCommission = commission?.status === 'pending' ? getStaffShare(sale) : 0

    return Math.max(serviceRevenue - pendingCommission, 0)
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
  // KPI CALCULATIONS
  // =========================================================

  const kpis = useMemo(() => {
    let grossSales = 0

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

      // =====================================================
      // SERVICE
      // =====================================================

      const serviceTotal = getRemainingServiceTotal(sale)

      totalServiceSales += serviceTotal

      // =====================================================
      // PRODUCTS
      // =====================================================

      const productTotal = getRemainingProductTotal(sale)

      totalProductSales += productTotal

      // =====================================================
      // STAFF COMMISSION
      // =====================================================

      staffShare += getStaffShare(sale)

      // =====================================================
      // OWNER SERVICE PROFIT
      // =====================================================

      ownerServiceProfit += getOwnerServiceProfit(sale)

      // =====================================================
      // SERVICE TYPE
      // =====================================================

      const serviceType = getServiceType(sale)

      if (serviceType === 'home_service') {
        homeServiceSales += serviceTotal
      }

      if (serviceType === 'in_salon') {
        inSalonServiceSales += serviceTotal
      }

      // =====================================================
      // PRODUCT PROFIT
      // =====================================================

      /*
       * Recalculate product profit based on the
       * remaining quantity so returned products
       * do not continue contributing profit.
       */

      getProductItems(sale).forEach((item) => {
        const originalQuantity = Number(item.quantity || 0)

        const originalSubtotal = Number(item.subtotal || 0)

        const returnedQuantity = getReturnedProductQuantity(sale, item.ProductId)

        const remainingQuantity = Math.max(originalQuantity - returnedQuantity, 0)

        const unitPrice = originalQuantity > 0 ? originalSubtotal / originalQuantity : 0

        const costPrice = Number(item.Product?.costPrice || 0)

        productProfit += (unitPrice - costPrice) * remainingQuantity
      })
    })

    // =======================================================
    // RETURNS
    // =======================================================

    /*
     * Keep your original report-level return logic.
     */

    const totalReturns = Number(report.totalReturns || 0)

    const netSales = grossSales - totalReturns

    // =======================================================
    // FALLBACK TO BACKEND PRODUCT PROFIT
    // =======================================================

    if (productProfit === 0 && Number(report.productProfit || 0) > 0) {
      productProfit = Number(report.productProfit || 0)
    }

    // =======================================================
    // OWNER PROFIT
    // =======================================================

    const ownerProfit = productProfit + ownerServiceProfit

    // =======================================================
    // EXPENSES
    // =======================================================

    const totalExpenses = Number(report.totalExpenses || 0)

    // =======================================================
    // NET PROFIT AFTER EXPENSES
    // =======================================================

    const netProfit = ownerProfit - totalExpenses

    const totalProfit = ownerProfit

    // =======================================================
    // TRANSACTIONS
    // =======================================================

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

      // NEW
      totalExpenses,
      netProfit,

      totalProfit,
      averageSale,
      homeServiceSales,
      inSalonServiceSales,
    }
  }, [filteredSales, report])

  // =========================================================
  // SALES TREND CHART
  // =========================================================

  const salesTrendData = useMemo(() => {
    const grouped = {}

    filteredSales.forEach((sale) => {
      const date = sale.createdAt
        ? new Date(sale.createdAt).toLocaleDateString('en-NG', {
            day: '2-digit',
            month: 'short',
          })
        : 'Unknown'

      if (!grouped[date]) {
        grouped[date] = {
          date,
          sales: 0,
        }
      }

      /*
       * Keep original chart logic.
       */

      grouped[date].sales += Number(sale.totalAmount || 0)
    })

    return Object.values(grouped)
  }, [filteredSales])

  // =========================================================
  // PROFIT CHART
  // =========================================================

  const profitChartData = useMemo(() => {
    return [
      {
        name: 'Service Revenue',
        amount: Number(kpis.totalServiceSales || 0),
      },

      {
        name: 'Staff Share',
        amount: Number(kpis.staffShare || 0),
      },

      {
        name: 'Owner Service Profit',
        amount: Number(kpis.ownerServiceProfit || 0),
      },
    ]
  }, [kpis])

  // =========================================================
  // REVENUE BREAKDOWN CHART
  // =========================================================

  const revenueBreakdownData = useMemo(() => {
    return [
      {
        name: 'In-Salon',
        value: Number(kpis.inSalonServiceSales || 0),
      },

      {
        name: 'Home Service',
        value: Number(kpis.homeServiceSales || 0),
      },

      {
        name: 'Products',
        value: Number(kpis.totalProductSales || 0),
      },
    ].filter((item) => item.value > 0)
  }, [kpis])

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

  // =========================================================
  // INITIAL LOAD
  // =========================================================

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
        .map((item) => {
          const status = getServiceReturnStatus(sale, item)

          const serviceName =
            item.Service?.name ||
            item.service?.name ||
            item.serviceName ||
            item.name ||
            item.productName ||
            '-'

          if (status.returned && !status.partial) {
            return `${serviceName} - RETURNED`
          }

          if (status.returned && status.partial) {
            return `${serviceName} - ${status.returnedQuantity} returned / ${status.remainingQuantity} remaining`
          }

          return serviceName
        })
        .join(', ')

      const commissionRate = getCommissionRate(sale)

      const staffShare = getStaffShare(sale)

      const serviceRevenue = getRemainingServiceTotal(sale)

      const ownerServiceProfit = getOwnerServiceProfit(sale)

      const returnAmount = getSaleReturnTotal(sale)

      return {
        Invoice: sale.invoiceNumber || sale.receiptNumber || '-',

        Customer: getCustomerName(sale),

        'Sales By': getCashierName(sale),

        'Service Provider': provider,

        'Service Type': getServiceType(sale) === 'home_service' ? 'Home Service' : 'In-Salon',

        'Service Rendered': services || '-',

        'Returned Amount': returnAmount,

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
  // UI
  // =========================================================

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
          KPI SECTION 1
      ===================================================== */}

      <CRow className="g-3 mb-3">
        {/* GROSS SALES */}

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Gross Sales</div>

                  <h3 className="fw-bold text-success mb-1">{money(kpis.grossSales)}</h3>

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

                  <h3 className="fw-bold text-primary mb-1">{money(kpis.netSales)}</h3>

                  <small className="text-medium-emphasis">
                    Average sale: {money(kpis.averageSale)}
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

                  <h3 className="fw-bold text-info mb-1">{money(kpis.totalServiceSales)}</h3>

                  <small className="text-medium-emphasis">
                    In-Salon: {money(kpis.inSalonServiceSales)}
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

                  <h3 className="fw-bold text-secondary mb-1">{money(kpis.totalProductSales)}</h3>

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
          KPI SECTION 2
      ===================================================== */}

      <CRow className="g-3 mb-4">
        {/* STAFF SHARE */}

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Staff Share</div>

                  <h3 className="fw-bold text-warning mb-1">{money(kpis.staffShare)}</h3>

                  <small className="text-medium-emphasis">Pending service commission</small>
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

                  <h3 className="fw-bold text-success mb-1">{money(kpis.ownerServiceProfit)}</h3>

                  <small className="text-medium-emphasis">
                    Service revenue − pending staff share
                  </small>
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

                  <h3 className="fw-bold text-success mb-1">{money(kpis.ownerProfit)}</h3>

                  <small className="text-medium-emphasis">Product + service profit</small>
                </div>

                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                  <CIcon icon={cilChart} className="text-success" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* NET PROFIT */}

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Net Profit</div>

                  <h3 className="fw-bold text-success mb-1">{money(kpis.netProfit)}</h3>

                  <small className="text-medium-emphasis">Owner profit − expenses</small>
                </div>

                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                  <CIcon icon={cilChart} className="text-success" size="xl" />
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        {/* EXPENSES */}

        <CCol xs={12} sm={6} xl={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-medium-emphasis small mb-2">Expenses</div>

                  <h3 className="fw-bold text-danger mb-1">{money(kpis.totalExpenses)}</h3>

                  <small className="text-medium-emphasis">Business expenses</small>
                </div>

                <div className="rounded-circle bg-danger bg-opacity-10 p-3">
                  <CIcon icon={cilMoney} className="text-danger" size="xl" />
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

                  <h3 className="fw-bold text-dark mb-1">{money(kpis.homeServiceSales)}</h3>

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
          ANALYTICS
      ===================================================== */}

      <CRow className="g-3 mb-4">
        {/* SALES TREND */}

        <CCol xs={12} lg={8}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Sales Performance</h5>

              <small className="text-medium-emphasis">
                Sales revenue for the current filtered report.
              </small>
            </CCardHeader>

            <CCardBody>
              {salesTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={salesTrendData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 10,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis dataKey="date" tickLine={false} axisLine={false} />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₦${Number(value).toLocaleString()}`}
                    />

                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="#321fdb"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: '#321fdb',
                      }}
                      activeDot={{
                        r: 6,
                        fill: '#321fdb',
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-medium-emphasis py-5">
                  No sales data available for the selected filters.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* REVENUE BREAKDOWN */}

        <CCol xs={12} lg={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Revenue Breakdown</h5>

              <small className="text-medium-emphasis">Services and product revenue</small>
            </CCardHeader>

            <CCardBody>
              {revenueBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={105}
                      innerRadius={55}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-medium-emphasis py-5">
                  No revenue data available.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =====================================================
          SERVICE / PROFIT ANALYSIS
      ===================================================== */}

      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard className="border-0 shadow-sm">
            <CCardHeader className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold mb-1">Service Revenue & Profit Analysis</h5>

              <small className="text-medium-emphasis">
                Compare service revenue, current pending staff share and owner service profit.
              </small>
            </CCardHeader>

            <CCardBody>
              {profitChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={330}>
                  <BarChart
                    data={profitChartData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 10,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis dataKey="name" tickLine={false} axisLine={false} />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₦${Number(value).toLocaleString()}`}
                    />

                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />

                    <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]}>
                      {profitChartData.map((entry, index) => (
                        <Cell
                          key={`profit-cell-${index}`}
                          fill={index === 0 ? '#321fdb' : index === 1 ? '#f9b115' : '#2eb85c'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-medium-emphasis py-5">
                  No profit data available.
                </div>
              )}
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
            {/* START DATE */}

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Start Date</label>

              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            {/* END DATE */}

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">End Date</label>

              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            {/* STATUS */}

            <CCol xs={12} md={2}>
              <label className="small fw-semibold mb-1">Status</label>

              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>

                <option value="approved">Approved</option>

                <option value="pending">Pending</option>

                <option value="cancelled">Cancelled</option>
              </CFormSelect>
            </CCol>

            {/* SERVICE PROVIDER */}

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

            {/* SEARCH */}

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

                  /*
                   * IMPORTANT:
                   * These are now RETURN-AWARE.
                   */

                  const serviceTotal = getRemainingServiceTotal(sale)

                  const productTotal = getRemainingProductTotal(sale)

                  const returnAmount = getSaleReturnTotal(sale)

                  const staffShare = getStaffShare(sale)

                  const commission = getCommission(sale)

                  const commissionRate = getCommissionRate(sale)

                  const ownerServiceProfit = getOwnerServiceProfit(sale)

                  const serviceType = getServiceType(sale)

                  const isHomeService = serviceType === 'home_service'

                  const commissionIsPending = commission?.status === 'pending'

                  const commissionIsPaid = commission?.status === 'paid'

                  const paidCommission = commissionIsPaid
                    ? Number(commission?.commissionAmount || 0)
                    : 0

                  /*
                   * Returned items
                   */

                  const hasReturnedService = getReturnedServiceItems(sale).length > 0

                  const hasReturnedProduct = getReturnedProductItems(sale).length > 0

                  /*
                   * Sale net amount
                   */

                  const saleNetAmount = Math.max(Number(sale.totalAmount || 0) - returnAmount, 0)

                  return (
                    <CTableRow key={sale.id}>
                      {/* INVOICE */}

                      <CTableDataCell>
                        <strong>{sale.invoiceNumber || sale.receiptNumber || '-'}</strong>

                        {returnAmount > 0 && (
                          <div className="mt-1">
                            <CBadge
                              color="danger"
                              style={{
                                fontSize: '10px',
                              }}
                            >
                              RETURNED: {money(returnAmount)}
                            </CBadge>
                          </div>
                        )}
                      </CTableDataCell>

                      {/* CUSTOMER */}

                      <CTableDataCell>{getCustomerName(sale)}</CTableDataCell>

                      {/* CASHIER */}

                      <CTableDataCell>{getCashierName(sale)}</CTableDataCell>

                      {/* PROVIDER */}

                      <CTableDataCell>
                        {provider !== '-' ? <CBadge color="info">{provider}</CBadge> : '-'}
                      </CTableDataCell>

                      {/* SERVICE */}

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

                            const returnStatus = getServiceReturnStatus(sale, item)

                            return (
                              <div key={item.id || index} className="mb-2">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <span
                                    className={
                                      returnStatus.returned && !returnStatus.partial
                                        ? 'text-decoration-line-through text-muted'
                                        : 'fw-semibold'
                                    }
                                  >
                                    {serviceName}
                                  </span>

                                  {returnStatus.returned && !returnStatus.partial && (
                                    <CBadge
                                      color="danger"
                                      style={{
                                        fontSize: '10px',
                                      }}
                                    >
                                      RETURNED
                                    </CBadge>
                                  )}

                                  {returnStatus.returned && returnStatus.partial && (
                                    <CBadge
                                      color="warning"
                                      textColor="dark"
                                      style={{
                                        fontSize: '10px',
                                      }}
                                    >
                                      PARTIALLY RETURNED
                                    </CBadge>
                                  )}
                                </div>

                                <small className="text-medium-emphasis">
                                  {returnStatus.returned ? (
                                    <>
                                      {returnStatus.partial
                                        ? `${returnStatus.returnedQuantity} returned / ${returnStatus.remainingQuantity} remaining`
                                        : `${returnStatus.returnedQuantity} returned`}
                                    </>
                                  ) : (
                                    <>
                                      {item.quantity && Number(item.quantity) > 1
                                        ? `Qty: ${item.quantity} • `
                                        : ''}

                                      {money(item.subtotal)}
                                    </>
                                  )}
                                </small>

                                {returnStatus.partial && (
                                  <div className="small text-success mt-1">
                                    Remaining value:{' '}
                                    {money(
                                      Number(item.subtotal || 0) *
                                        (returnStatus.remainingQuantity /
                                          Number(item.quantity || 1)),
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <span className="text-medium-emphasis">No service</span>
                        )}

                        {hasReturnedProduct && (
                          <div className="mt-2">
                            <CBadge
                              color="secondary"
                              style={{
                                fontSize: '10px',
                              }}
                            >
                              Product return
                            </CBadge>
                          </div>
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
                        <div className="fw-bold">{money(saleNetAmount)}</div>

                        {serviceTotal > 0 && (
                          <small className="text-info d-block">
                            Service: {money(serviceTotal)}
                          </small>
                        )}

                        {productTotal > 0 && (
                          <small className="text-secondary d-block">
                            Product: {money(productTotal)}
                          </small>
                        )}

                        {returnAmount > 0 && (
                          <small className="text-danger d-block">
                            Return: -{money(returnAmount)}
                          </small>
                        )}
                      </CTableDataCell>

                      {/* STAFF SHARE */}

                      <CTableDataCell>
                        {commissionIsPending && staffShare > 0 ? (
                          <>
                            <div className="fw-bold text-warning">{money(staffShare)}</div>

                            <small className="text-medium-emphasis">
                              {commissionRate}% Pending
                            </small>
                          </>
                        ) : commissionIsPaid && paidCommission > 0 ? (
                          <>
                            <div className="text-medium-emphasis">{money(paidCommission)}</div>

                            <CBadge color="secondary" className="mt-1">
                              Paid
                            </CBadge>
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

                        {returnAmount > 0 && (
                          <div className="mt-1">
                            <CBadge
                              color="danger"
                              style={{
                                fontSize: '10px',
                              }}
                            >
                              RETURN
                            </CBadge>
                          </div>
                        )}
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
