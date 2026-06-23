import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilUserPlus,
  cilPeople,
  cilSave,
  cilCreditCard,
  cilBarcode,
  cilPrint,
  cilTrash,
  cilChart,
  cilNotes,
  cilUser,
  cilCart,
  cilSpeedometer,
} from '@coreui/icons'
import axios from 'axios'
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CButton,
  CNav,
  CForm,
  CTable,
  CCardBody,
  CFormInput,
  CFormSelect,
  CNavItem,
  CNavLink,
  CFormCheck,
} from '@coreui/react'
import CustomerSearchModal from '../pos/CustomerSearchModal'

import PaymentModal from '../pos/PaymentModal'

import ReceiptModal from '../pos/ReceiptModal'

import HoldSaleModal from '../pos/HoldSaleModal'
import NewCustomerModal from '../pos/NewCustomerModal'
import LoyaltyLookupModal from '../pos/LoyaltyLookUpModal'
import BarcodeModal from '../pos/BarcodeModal'
import ReceiptSearchModal from '../pos/RecieptSearchModal'
import ClearCartModal from '../pos/ClearCartModal'
import DailyReportModal from '../pos/DailyReport'
import { DocsComponents, DocsExample } from 'src/components'
import ShowHeldSalesModal from './ShowHeldSalesModal'
import { Link, NavLink } from 'react-router-dom'
import LogoutButton from '../auth/logout'
const POSPage = () => {
  const [activeTab, setActiveTab] = useState('services')

  // const [cart, setCart] = useState([])
  const dispatch = useDispatch()
  const [customerss, setCustomerss] = useState([])
  const [services, setService] = useState([])
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const [discount, setDiscount] = useState(0)

  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [settings, setFormData] = useState(null)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [sale, setSale] = useState(null)
  const [saleData, setSaleData] = useState(null)
  const [products, setProducts] = useState([])
  const [staff, setStaffs] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [customers, setCustomers] = useState([])
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false)
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState(0)
  const [showClearCartModal, setShowClearCartModal] = useState(false)
  const [processingSale, setProcessingSale] = useState(false)
  const clearPOS = () => {
    setCart([])

    setDiscount(0)

    setSelectedCustomer(null)

    setUsePoints(false)

    setUseWallet(false)

    localStorage.removeItem(CART_KEY)
  }
  const currentUser = JSON.parse(localStorage.getItem('user'))

  const CART_KEY = `pos_cart_${currentUser.id}`

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(CART_KEY)

    return savedCart ? JSON.parse(savedCart) : []
  })
  // const currentUser = JSON.parse(localStorage.getItem('user'))
  const [showDailyReportModal, setShowDailyReportModal] = useState(false)
  const [report, setReport] = useState({})
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [cardNumber, setCardNumber] = useState('')

  const [cardResult, setCardResult] = useState(null)
  const [usePoints, setUsePoints] = useState(false)

  const [useWallet, setUseWallet] = useState(false)

  // const pointsDiscount = usePoints ? Math.min(selectedCustomer?.loyaltyPoints || 0, subtotal) : 0
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false)
  const [heldSales, setHeldSales] = useState([])
  // Calculate total pages

  const walletUsed = useWallet
    ? Math.min(selectedCustomer?.walletBalance || 0, subtotal - pointsDiscount)
    : 0
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart))
  }, [cart])
  useEffect(() => {
    localStorage.setItem('pos_customer', JSON.stringify(customerss))
  }, [customerss])
  useEffect(() => {
    dispatch({
      type: 'set',
      sidebarShow: false,
    })
  }, [])

  useEffect(() => {
    document.body.classList.add('sidebar-hidden')

    return () => {
      document.body.classList.remove('sidebar-hidden')
    }
  }, [])

  // useEffect(() => {
  //   dispatch({
  //     type: 'set',
  //     sidebarUnfoldable: false,
  //   })

  //   return () => {
  //     dispatch({
  //       type: 'set',
  //       sidebarUnfoldable: true,
  //     })
  //   }
  // }, [])

  const getStaff = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/staffs`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setStaffs(response.data.staffs)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getStaff()
    }
    fetchData()
  }, [])
  // product section

  const getProducts = async () => {
    const token = localStorage.getItem('token') // Retrieve token

    if (!token) {
      console.error('No token found in localStorage')
      return // Exit if token is missing
    }

    try {
      console.log('Fetching products with token:', token)

      const response = await axios.get(`${API_URL}api/v1/products`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add token to headers
        },
      })

      if (response.data && response.data.products) {
        setProducts(response.data.products) // Update state with products
        console.log('Products fetched successfully:', response.data.products)
      } else {
        console.warn('No products found in response:', response.data)
      }
    } catch (error) {
      // Log detailed error information
      if (error.response) {
        console.error('API Error:', error.response.status, error.response.data)
      } else if (error.request) {
        console.error('No response received:', error.request)
      } else {
        console.error('Error setting up request:', error.message)
      }
    }
  }

  // Fetch products on component mount
  useEffect(() => {
    const fetchData = async () => {
      await getProducts()
    }
    fetchData()
  }, [])

  // product ends

  // Daily Sales
  const getDailyReport = async () => {
    try {
      setReportLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/my-daily-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReport(response.data)

      setShowDailyReportModal(true)
    } catch (error) {
      console.error(error)
    } finally {
      setReportLoading(false)
    }
  }

  const getSettings = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/settings/1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setFormData(response.data.settings)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getSettings()
    }
    fetchData()
  }, [])
  // Daily Sales end

  // Loyaltycard lookup

  const searchLoyaltyCard = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/loyalty-cards/${cardNumber}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setCardResult(response.data.loyaltyCard)
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Card not found')
    }
  }
  // Loyaltycard looup end
  // const services = [
  //   {
  //     id: 1,
  //     name: 'Hair Fixing',
  //     price: 15000,
  //   },
  //   {
  //     id: 2,
  //     name: 'Pedicure',
  //     price: 10000,
  //   },
  // ]

  const productss = [
    {
      id: 1,
      name: 'Shampoo',
      sellingPrice: 3500,
      quantity: 0,
    },
    {
      id: 2,
      name: 'Clipper',
      sellingPrice: 25000,
      quantity: 10,
    },
  ]

  const getService = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/services`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setService(response.data.services)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getService()
    }
    fetchData()
  }, [])

  // customers

  const getCustomer = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/customers`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setCustomerss(response.data.customers)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getCustomer()
    }
    fetchData()
  }, [])

  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)

  const handleHoldSale = async ({ customerId, note }) => {
    try {
      const token = localStorage.getItem('token')

      await axios.post(
        `${API_URL}api/v1/held-sales`,
        {
          customerId,
          items: cart,
          subtotal,
          discount,
          totalAmount: total,
          note,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      alert('Sale Held Successfully')

      clearPOS()

      setShowHoldModal(false)
    } catch (error) {
      console.error(error)

      alert('Failed to hold sale')
    }
  }

  const fetchHeldSales = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/held-sales`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setHeldSales(response.data.heldSales || [])
    } catch (error) {
      console.error(error)
    }
  }
  const openHeldSalesModal = async () => {
    await fetchHeldSales()

    setShowHeldSalesModal(true)
  }
  const restoreHeldSale = async (sale) => {
    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}api/v1/held-sales/restore/${sale.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      console.log('RESTORING SALE:', sale)

      // Force array
      const restoredItems = Array.isArray(sale.items) ? sale.items : JSON.parse(sale.items || '[]')

      console.log('RESTORED ITEMS:', restoredItems)

      setCart([...restoredItems])

      setSelectedCustomer(sale.Customer || null)

      setDiscount(Number(sale.discount || 0))

      setShowHeldSalesModal(false)

      localStorage.setItem(CART_KEY, JSON.stringify(restoredItems))

      alert('Sale Restored Successfully')
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Failed to restore sale')
    }
  }
  // Payment handling
  const handleCompleteSale = async (paymentData) => {
    try {
      if (cart.length === 0) {
        return alert('Cart is empty')
      }

      setProcessingSale(true)

      const token = localStorage.getItem('token')

      const payload = {
        customerId: selectedCustomer?.id || null,

        staffId: paymentData.serviceProviderId,

        items: cart,

        discount,

        paymentMethod: paymentData.paymentMethod,

        note: paymentData.note,

        usePoints: redeemPoints > 0,

        redeemPoints,

        subtotal,

        totalAmount: total,
      }
      const response = await axios.post(
        `${API_URL}api/v1/sales`,

        payload,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const completedSale = response.data.sale

      /*
     Receipt
    */

      setSale(completedSale)

      /*
     Close Payment Modal
    */

      setShowPaymentModal(false)

      /*
     Open Receipt
    */

      setShowReceiptModal(true)

      /*
     Reset POS
    */

      clearPOS()
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Failed to complete sale')
    } finally {
      setProcessingSale(false)
    }
  }
  // Payment Handling end
  // Product search
  const [search, setSearch] = useState('')

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => product?.name?.toLowerCase().includes(search.toLowerCase()))
    : []

  const handleReprint = async (saleId) => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/sales/${saleId}/reprint`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const sale = response.data.sale

      const html = `
          <html>
          <body>
            <h3>PRINCESS SALON</h3>
    
            <p>
              Receipt No:
              ${sale.receiptNumber}
            </p>
    
            <p>
              Customer:
              ${sale.customer}
            </p>
    
            <hr>
    
            ${sale.SaleItems.map(
              (item) => `
              <div>
                ${item.name}
                x ${item.quantity}
                =
                ₦${item.subtotal}
              </div>
            `,
            ).join('')}
    
            <hr>
    
            <h4>
              Total:
              ₦${sale.totalAmount}
            </h4>
    
            <p>
              *** REPRINT ***
            </p>
          </body>
          </html>
        `

      await window.electronAPI.printReceipt(html)
    } catch (error) {
      console.error(error)

      alert('Failed to reprint receipt')
    }
  }
  // hold sales

  const holdSale = async (note) => {
    try {
      await axios.post('/api/sales/hold', {
        customerId: customer?.id,

        note,

        items: cart,
      })

      setCart([])

      setShowHoldModal(false)
    } catch (error) {
      console.log(error)
    }
  }

  const addToCart = (item) => {
    const existing = cart.find((cartItem) => cartItem.id === item.id && cartItem.type === item.type)

    if (existing) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id && cartItem.type === item.type
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem,
        ),
      )

      return
    }

    setCart([
      ...cart,
      {
        ...item,
        quantity: 1,
      },
    ])
  }

  const increaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    )
  }

  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const subtotal = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
    : 0

  const total = subtotal - discount
  const pointsDiscount = usePoints ? Math.min(selectedCustomer?.loyaltyPoints || 0, subtotal) : 0
  const loyaltyPoints = Math.floor(total / 1000)

  const completeSale = () => {
    const payload = {
      customerId: customer?.id,

      paymentMethod,

      discount,

      items: cart.map((item) => ({
        type: item.type,

        quantity: item.quantity,

        serviceId: item.type === 'service' ? item.id : null,

        productId: item.type === 'product' ? item.id : null,
      })),
    }

    console.log(payload)

    // axios.post('/api/pos', payload)

    alert('Sale completed successfully')

    setCart([])
  }
  const [currentPageServices, setCurrentPageServices] = useState(1)
  const [currentPageProducts, setCurrentPageProducts] = useState(1)
  const itemsPerPage = 12 // Number of items per page

  // Paginate Services
  const indexOfLastService = currentPageServices * itemsPerPage
  const indexOfFirstService = indexOfLastService - itemsPerPage
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService)
  const totalServicePages = Math.ceil(filteredServices.length / itemsPerPage)

  // Paginate Products
  const indexOfLastProduct = currentPageProducts * itemsPerPage
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const posButtonStyle = {
    height: '70px',
    borderRadius: '12px',
    fontWeight: '600',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
  }

  useEffect(() => {
    if (window.electronAPI?.updateCustomerDisplay) {
      window.electronAPI.updateCustomerDisplay({
        cart,
        subtotal,
        total,
        customer: selectedCustomer,
      })
    }
  }, [cart, subtotal, total, selectedCustomer])

  return (
    <CContainer fluid className="py-3 p-3">
      <CCard className=" mb-1 shadow-sm border-0 p-3">
        <CRow className="g-2 mb-3">
          <CCol md={2}>
            <CButton
              color="primary"
              className="w-100 shadow-sm"
              style={posButtonStyle}
              onClick={() => setShowNewCustomerModal(true)}
            >
              <CIcon icon={cilUserPlus} size="lg" />
              <small>New Customer</small>
            </CButton>
          </CCol>

          <CCol md={2}>
            <CButton
              color="info"
              className="w-100 shadow-sm"
              style={posButtonStyle}
              onClick={() => setShowCustomerModal(true)}
            >
              <CIcon icon={cilPeople} size="lg" />
              <small>Customers</small>
            </CButton>
          </CCol>

          <CCol md={2}>
            <CButton color="secondary" className="w-100 shadow-sm" style={posButtonStyle}>
              <CIcon icon={cilUser} size="lg" />
              <small>Staff</small>
            </CButton>
          </CCol>

          <CCol md={2}>
            <Link to={`/salesReport`}>
              <CButton size="sm" color="success" className="w-100 shadow-sm">
                <CIcon icon={cilChart} />
                <small>Sales Report</small>
              </CButton>
            </Link>
          </CCol>

          <CCol md={2}>
            <CButton
              color="warning"
              className="w-100 shadow-sm"
              style={posButtonStyle}
              onClick={() => setShowLoyaltyModal(true)}
            >
              <CIcon icon={cilCreditCard} size="lg" />
              <small>Loyalty</small>
            </CButton>
          </CCol>

          <CCol md={2}>
            <CButton
              color="dark"
              className="w-100 shadow-sm"
              style={posButtonStyle}
              onClick={() => setShowBarcodeModal(true)}
            >
              <CIcon icon={cilBarcode} size="lg" />
              <small>Barcode</small>
            </CButton>
          </CCol>

          <CCol md={2}>
            <CButton
              color="secondary"
              className="w-100 shadow-sm"
              style={posButtonStyle}
              onClick={() => handleReprint(sale?.id)}
            >
              <CIcon icon={cilPrint} size="lg" />
              <small>Reprint</small>
            </CButton>
          </CCol>

          <CCol md={2}>
            <CButton
              color="danger"
              className="w-100 shadow-sm"
              style={posButtonStyle}
              onClick={() => setShowClearCartModal(true)}
            >
              <CIcon icon={cilTrash} size="lg" />
              <small>Clear Cart</small>
            </CButton>
          </CCol>
          <CCol md={2}>
            <CButton color="secondary" className="w-100 shadow-sm" style={posButtonStyle}>
              <CIcon icon={cilSpeedometer} size="lg" />
              <small>Dashboard</small>
            </CButton>
          </CCol>
          <CCol md={2}>
            <CNavItem>
              <LogoutButton />
            </CNavItem>
          </CCol>
        </CRow>
      </CCard>
      <CRow style={{ width: '100%', marginLeft: '0px' }}>
        <CCol md={6}>
          <CCard className="vh-100 shadow-sm border-0 ">
            <CCardBody>
              <CFormInput
                className="mb-3"
                placeholder="Search service or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <CNav variant="tabs" activeKey={activeTab}>
                <CNavItem>
                  <CNavLink eventKey="services" onClick={() => setActiveTab('services')}>
                    Services
                  </CNavLink>
                </CNavItem>

                <CNavItem>
                  <CNavLink eventKey="products" onClick={() => setActiveTab('products')}>
                    Products
                  </CNavLink>
                </CNavItem>
              </CNav>
              <div className="mt-3">
                {/* Services Tab */}
                {activeTab === 'services' &&
                  (filteredServices.length > 0 ? (
                    <>
                      <CRow>
                        {currentServices.map((service) => (
                          <CCol xs={6} md={4} lg={3} key={service.id} className="mb-3">
                            <CCard
                              className="border-0 shadow-sm h-100 cursor-pointer"
                              style={{
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                addToCart({
                                  ...service,
                                  price: service.price,
                                  type: 'service',
                                })
                              }
                            >
                              <CCardBody className="d-flex flex-column justify-content-between">
                                <div>
                                  <div
                                    className="mb-2"
                                    style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '10px',
                                      background: '#f3f4f6',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '18px',
                                    }}
                                  >
                                    ✂️
                                  </div>

                                  <h6
                                    className="mb-1 fw-bold"
                                    style={{
                                      fontSize: '14px',
                                    }}
                                  >
                                    {service.name}
                                  </h6>

                                  <small className="text-medium-emphasis">Service</small>
                                </div>

                                <div className="mt-3">
                                  <h5 className="mb-0 text-primary fw-bold">
                                    ₦{Number(service.price).toLocaleString()}
                                  </h5>
                                </div>
                              </CCardBody>
                            </CCard>
                          </CCol>
                        ))}
                      </CRow>
                      {/* Pagination Controls for Services */}
                      <div className="pagination-controls mt-3">
                        <CButton
                          color="secondary"
                          disabled={currentPageServices === 1}
                          onClick={() => setCurrentPageServices((prev) => prev - 1)}
                        >
                          Previous
                        </CButton>
                        <span className="mx-2">
                          Page {currentPageServices} of {totalServicePages}
                        </span>
                        <CButton
                          color="secondary"
                          disabled={currentPageServices === totalServicePages}
                          onClick={() => setCurrentPageServices((prev) => prev + 1)}
                        >
                          Next
                        </CButton>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-medium-emphasis">No services found</div>
                  ))}

                {/* Products Tab */}
                {activeTab === 'products' &&
                  (loadingProducts ? (
                    <div className="text-center py-3">Loading Products...</div>
                  ) : filteredProducts.length > 0 ? (
                    <>
                      <CRow>
                        {currentProducts.map((product) => (
                          <CCol xs={6} md={4} lg={3} key={product.id} className="mb-3">
                            <CCard
                              className="border-0 shadow-sm h-100"
                              style={{
                                cursor: 'pointer',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                transition: 'all .2s ease',
                                background: 'linear-gradient(135deg,#ffffff,#f8fafc)',
                              }}
                              onClick={() =>
                                addToCart({
                                  ...product,
                                  price: product.sellingPrice,
                                  type: 'product',
                                })
                              }
                            >
                              <div
                                style={{
                                  position: 'relative',
                                }}
                              >
                                {/* <img
                                  src={product.image || '/placeholder.png'}
                                  alt={product.name}
                                  style={{
                                    height: '150px',
                                    width: '100%',
                                    objectFit: 'cover',
                                  }}
                                /> */}

                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: product.quantity > 10 ? '#198754' : '#dc3545',
                                    color: '#fff',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {product.quantity}
                                </div>
                              </div>

                              <CCardBody>
                                <div className="d-flex flex-column justify-content-between h-100">
                                  <div>
                                    <h6
                                      className="fw-bold mb-1"
                                      style={{
                                        minHeight: '40px',
                                      }}
                                    >
                                      {product.name}
                                    </h6>

                                    <small className="text-medium-emphasis">Product</small>
                                  </div>

                                  <div className="mt-3">
                                    <h5 className="fw-bold text-success mb-0">
                                      ₦{Number(product.sellingPrice).toLocaleString()}
                                    </h5>
                                  </div>
                                </div>
                              </CCardBody>
                            </CCard>
                          </CCol>
                        ))}
                      </CRow>

                      {/* Pagination Controls for Products */}
                      <div className="pagination-controls mt-3">
                        <CButton
                          color="secondary"
                          disabled={currentPageProducts === 1}
                          onClick={() => setCurrentPageProducts((prev) => prev - 1)}
                        >
                          Previous
                        </CButton>
                        <span className="mx-2">
                          Page {currentPageProducts} of {totalProductPages}
                        </span>
                        <CButton
                          color="secondary"
                          disabled={currentPageProducts === totalProductPages}
                          onClick={() => setCurrentPageProducts((prev) => prev + 1)}
                        >
                          Next
                        </CButton>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-medium-emphasis py-3">No products found</div>
                  ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard
            className="shadow-sm border-0 h-100"
            style={{
              borderRadius: '12px',
            }}
          >
            <CCardBody className="p-0">
              {/* Customer Header */}
              {selectedCustomer && (
                <div
                  className="p-3 border-bottom"
                  style={{
                    background: '#f8fafc',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 fw-bold">{selectedCustomer.fullname}</h6>

                      <small className="text-muted">{selectedCustomer.phone}</small>
                    </div>

                    <div>
                      <span className="badge bg-success">
                        {selectedCustomer.loyaltyPoints || 0} Points
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* POS Grid */}
              <div
                style={{
                  maxHeight: '450px',
                  overflowY: 'auto',
                }}
              >
                <CTable hover responsive borderless className="mb-0">
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      background: '#fff',
                      zIndex: 1,
                    }}
                  >
                    <tr>
                      <th>Item</th>
                      <th width="120">Qty</th>
                      <th width="120">Unit Price</th>
                      <th width="120">Total</th>
                      <th width="50"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {cart.map((item) => (
                      <tr key={`${item.type}-${item.id}`}>
                        <td>
                          <div>
                            <strong>{item.name}</strong>

                            <br />

                            <small className="text-muted">{item.type}</small>
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <CButton size="sm" color="light" onClick={() => decreaseQty(item.id)}>
                              −
                            </CButton>

                            <span className="px-2">{item.quantity}</span>

                            <CButton size="sm" color="light" onClick={() => increaseQty(item.id)}>
                              +
                            </CButton>
                          </div>
                        </td>

                        <td>₦{Number(item.price || item.sellingPrice).toLocaleString()}</td>

                        <td>
                          <strong>
                            ₦
                            {Number(
                              (item.price || item.sellingPrice) * item.quantity,
                            ).toLocaleString()}
                          </strong>
                        </td>

                        <td>
                          <CButton size="sm" color="light" onClick={() => removeItem(item.id)}>
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </CTable>
              </div>

              {/* Summary Footer */}
              <div
                className="border-top p-3"
                style={{
                  background: '#f8fafc',
                }}
              >
                <div className="d-flex justify-content-between">
                  <span>Items</span>

                  <strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                </div>

                <div className="d-flex justify-content-between mt-2">
                  <span>Subtotal</span>

                  <strong>
                    ₦
                    {cart
                      .reduce(
                        (total, item) => total + (item.price || item.sellingPrice) * item.quantity,
                        0,
                      )
                      .toLocaleString()}
                  </strong>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CCard className="border-0 shadow-sm mt-3">
        <CCardBody>
          <CRow>
            {/* Actions */}
            <CCol md={3}>
              <div className="h-100 p-3 border rounded" style={{ background: '#f8fafc' }}>
                <h6 className="fw-bold mb-3">Actions</h6>

                <CButton
                  color="warning"
                  className="w-100 mb-2"
                  onClick={() => setShowHoldModal(true)}
                >
                  Hold Sale
                </CButton>

                <CButton
                  color="info"
                  variant="outline"
                  className="w-100"
                  onClick={openHeldSalesModal}
                >
                  Restore Sale
                </CButton>
              </div>
            </CCol>

            {/* Loyalty */}
            <CCol md={4}>
              <div className="h-100 p-3 border rounded" style={{ background: '#f8fafc' }}>
                <h6 className="fw-bold mb-3">Loyalty & Wallet</h6>

                {selectedCustomer ? (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Points</span>

                      <strong>{selectedCustomer.loyaltyPoints}</strong>
                    </div>

                    <div className="d-flex justify-content-between mb-3">
                      <span>Wallet</span>

                      <strong>
                        ₦{Number(selectedCustomer.walletBalance || 0).toLocaleString()}
                      </strong>
                    </div>

                    <CFormCheck
                      className="mb-2"
                      label="Use Loyalty Points"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                    />

                    <CFormCheck
                      className="mb-3"
                      label="Use Wallet Balance"
                      checked={useWallet}
                      onChange={(e) => setUseWallet(e.target.checked)}
                    />

                    <CFormInput
                      type="number"
                      label="Redeem Points"
                      value={redeemPoints}
                      min={0}
                      max={selectedCustomer?.loyaltyPoints || 0}
                      onChange={(e) => setRedeemPoints(Number(e.target.value))}
                    />
                  </>
                ) : (
                  <small className="text-muted">No customer selected</small>
                )}
              </div>
            </CCol>

            {/* Summary */}
            <CCol md={5}>
              <div className="h-100 p-3 border rounded" style={{ background: '#fff' }}>
                <h6 className="fw-bold mb-3">Order Summary</h6>

                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>

                  <strong>₦{Number(subtotal).toLocaleString()}</strong>
                </div>

                <div className="mb-2">
                  <CFormInput
                    type="number"
                    label="Discount"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>

                {usePoints && (
                  <div className="d-flex justify-content-between text-success mb-2">
                    <span>Points Discount</span>

                    <strong>- ₦{Number(pointsDiscount || 0).toLocaleString()}</strong>
                  </div>
                )}

                {useWallet && (
                  <div className="d-flex justify-content-between text-success mb-2">
                    <span>Wallet Used</span>

                    <strong>- ₦{Number(walletUsed || 0).toLocaleString()}</strong>
                  </div>
                )}

                <hr />

                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Grand Total</h5>

                  <h4 className="mb-0 text-primary fw-bold">₦{Number(total).toLocaleString()}</h4>
                </div>

                <div className="mt-2 text-muted">
                  Earn Points:
                  <strong className="ms-2">{Math.floor(total / 1000)}</strong>
                </div>
              </div>
            </CCol>
          </CRow>

          <hr />

          {/* Payment Footer */}
          <CRow className="align-items-end">
            <CCol md={4}>
              <CFormSelect value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>

                <option value="transfer">Transfer</option>

                <option value="pos">POS</option>

                <option value="mixed">Mixed</option>
              </CFormSelect>
            </CCol>

            <CCol md={8}>
              <CButton
                color="success"
                size="lg"
                className="w-100 fw-bold"
                onClick={() => setShowPaymentModal(true)}
              >
                Complete Payment • ₦{Number(total).toLocaleString()}
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>
      <CustomerSearchModal
        show={showCustomerModal}
        onHide={() => setShowCustomerModal(false)}
        customers={customerss}
        onSelect={(customer) => {
          console.log('Selected Customer:', customer)

          setSelectedCustomer(customer)
        }}
      />

      <PaymentModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        total={total}
        onSubmit={handleCompleteSale}
        processing={processingSale}
        staff={staff}
        currentUser={currentUser}
      />

      <ReceiptModal
        show={showReceiptModal}
        settings={settings}
        onHide={() => setShowReceiptModal(false)}
        sale={sale}
      />

      <HoldSaleModal
        show={showHoldModal}
        onHide={() => setShowHoldModal(false)}
        customers={customerss}
        total={total}
        cartCount={cart.length}
        onSave={handleHoldSale}
      />
      <NewCustomerModal
        show={showNewCustomerModal}
        onHide={() => setShowNewCustomerModal(false)}
        onSuccess={(customer) => {
          setCustomers(customer)

          setCustomers((prev) => [customer, ...prev])
        }}
      />
      <ShowHeldSalesModal
        show={showHeldSalesModal}
        onHide={() => setShowHeldSalesModal(false)}
        heldSales={heldSales}
        onRestore={restoreHeldSale}
      />
      <LoyaltyLookupModal
        visible={showLoyaltyModal}
        onClose={() => setShowLoyaltyModal(false)}
        cardNumber={cardNumber}
        setCardNumber={setCardNumber}
        onSearch={searchLoyaltyCard}
        cardResult={cardResult}
      />
      <BarcodeModal visible={showBarcodeModal} onClose={() => setShowBarcodeModal(false)} />
      <ClearCartModal visible={showClearCartModal} onClose={() => setShowClearCartModal(false)} />
      <DailyReportModal
        visible={showDailyReportModal}
        onClose={() => setShowDailyReportModal(false)}
        report={report}
        loading={reportLoading}
      />
    </CContainer>
  )
}

export default POSPage
