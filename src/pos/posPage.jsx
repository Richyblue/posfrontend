import React, { useState, useEffect, useRef } from 'react'
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
  CModal,
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
  const [showPriceModal, setShowPriceModal] = useState(false)

  const [editingItem, setEditingItem] = useState(null)

  const [editedPrice, setEditedPrice] = useState('')
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
  const [lastSale, setLastSale] = useState(null)

  const [useWallet, setUseWallet] = useState(false)
  const addSoundRef = useRef(new Audio('/sounds/beep.wav'))

  // const pointsDiscount = usePoints ? Math.min(selectedCustomer?.loyaltyPoints || 0, subtotal) : 0
  const [showHeldSalesModal, setShowHeldSalesModal] = useState(false)
  const [heldSales, setHeldSales] = useState([])

  const openPriceModal = (item) => {
    setEditingItem(item)

    setEditedPrice(item.price)

    setShowPriceModal(true)
  }

  const saveEditedPrice = () => {
    if (!editingItem) return

    setCart(
      cart.map((cartItem) =>
        cartItem.id === editingItem.id && cartItem.type === 'service'
          ? {
              ...cartItem,
              price: Number(editedPrice),
            }
          : cartItem,
      ),
    )

    setShowPriceModal(false)

    setEditingItem(null)

    setEditedPrice('')
  }
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
  const soundPlayingRef = useRef(false)

  const playAddSound = () => {
    if (soundPlayingRef.current) return

    soundPlayingRef.current = true

    addSoundRef.current.currentTime = 0

    addSoundRef.current.play().catch(() => {})

    setTimeout(() => {
      soundPlayingRef.current = false
    }, 100)
  }

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
      setLastSale(response.data.sale)

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

  const handleReprint = async (id) => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/sales/${id}/reprints`, {
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
              ${sale.customer?.fullname || 'Walk-in Customer'}
            </p>
    
            <hr>
    
            ${sale.SaleItems.map(
              (item) => `
              <div>
                ${item.Product?.name || item.Service?.name || 'Unknown Item'}
                x ${item.quantity}
                =
                 ₦${Number(sale.subtotal).toLocaleString()}
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
    playAddSound()

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

  const serviceColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
    'linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%)',
    'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
    'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
  ]

  const getServiceColor = (id) => {
    return serviceColors[id % serviceColors.length]
  }

  const productColors = [
    'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  ]

  const getProductColor = (id) => {
    return productColors[id % productColors.length]
  }

  const actionCardStyle = {
    height: '90px',
    borderRadius: '18px',
    border: 'none',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    transition: 'all .3s ease',
    fontWeight: '600',
  }
  return (
    <CContainer fluid className="py-3 p-3">
      <CCard
        className="border-0 shadow-sm mb-2"
        style={{
          borderRadius: '20px',
          background: '#fff',
        }}
      >
        <CCardBody>
          <CRow className="g-3">
            <CCol md={2}>
              <CButton
                className="w-100 shadow"
                style={{
                  ...actionCardStyle,
                  background: 'linear-gradient(135deg,#667eea,#764ba2)',
                }}
                onClick={() => setShowNewCustomerModal(true)}
              >
                <CIcon icon={cilUserPlus} size="xl" />
                <small>New Customer</small>
              </CButton>
            </CCol>

            <CCol md={2}>
              <CButton
                className="w-100 shadow"
                style={{
                  ...actionCardStyle,
                  background: 'linear-gradient(135deg,#11998e,#38ef7d)',
                }}
                onClick={() => setShowCustomerModal(true)}
              >
                <CIcon icon={cilPeople} size="xl" />
                <small>Customers</small>
              </CButton>
            </CCol>

            <CCol md={2}>
              <CButton
                className="w-100 shadow"
                style={{
                  ...actionCardStyle,
                  background: 'linear-gradient(135deg,#36d1dc,#5b86e5)',
                }}
              >
                <CIcon icon={cilUser} size="xl" />
                <small>Staff</small>
              </CButton>
            </CCol>

            <CCol md={2}>
              <CButton
                className="w-100 shadow"
                style={{
                  ...actionCardStyle,
                  background: 'linear-gradient(135deg,#f7971e,#ffd200)',
                }}
                onClick={() => setShowLoyaltyModal(true)}
              >
                <CIcon icon={cilCreditCard} size="xl" />
                <small>Loyalty</small>
              </CButton>
            </CCol>

            <CCol md={2}>
              <CButton
                className="w-100 shadow"
                style={{
                  ...actionCardStyle,
                  background: 'linear-gradient(135deg,#232526,#414345)',
                }}
                onClick={() => setShowBarcodeModal(true)}
              >
                <CIcon icon={cilBarcode} size="xl" />
                <small>Barcode</small>
              </CButton>
            </CCol>

            <CCol md={2}>
              <CButton
                className="w-100 shadow"
                style={{
                  ...actionCardStyle,
                  background: 'linear-gradient(135deg,#fc466b,#3f5efb)',
                }}
                onClick={() => handleReprint(lastSale?.id)}
              >
                <CIcon icon={cilPrint} size="xl" />
                <small>Reprint</small>
              </CButton>
            </CCol>

            <CCol md={2}>
              <CButton
                className="w-100 shadow"
                style={{
                  ...actionCardStyle,
                  background: 'linear-gradient(135deg,#ff416c,#ff4b2b)',
                }}
                onClick={() => setShowClearCartModal(true)}
              >
                <CIcon icon={cilTrash} size="xl" />
                <small>Clear Cart</small>
              </CButton>
            </CCol>

            <CCol md={2}>
              <CButton
                className="w-100 shadow"
                style={{
                  ...actionCardStyle,
                  background: 'linear-gradient(135deg,#4e54c8,#8f94fb)',
                }}
              >
                <CIcon icon={cilSpeedometer} size="xl" />
                <small>Dashboard</small>
              </CButton>
            </CCol>

            <CCol md={2}>
              <Link
                to="/salesReport"
                style={{
                  textDecoration: 'none',
                }}
              >
                <CButton
                  className="w-100 shadow"
                  style={{
                    ...actionCardStyle,
                    background: 'linear-gradient(135deg,#00c6ff,#0072ff)',
                  }}
                >
                  <CIcon icon={cilChart} size="xl" />
                  <small>Sales Report</small>
                </CButton>
              </Link>
            </CCol>

            <CCol md={2}>
              <div
                style={{
                  height: '90px',
                }}
              >
                <LogoutButton />
              </div>
            </CCol>
          </CRow>
        </CCardBody>
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
                              className="border-0 shadow h-100"
                              style={{
                                borderRadius: '18px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                background: getServiceColor(service.id),
                                transition: 'all 0.3s ease',
                                minHeight: '150px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)'
                                e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.15)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0px)'
                                e.currentTarget.style.boxShadow = ''
                              }}
                              onClick={() =>
                                addToCart({
                                  ...service,
                                  price: service.price,
                                  type: 'service',
                                })
                              }
                            >
                              <CCardBody className="d-flex flex-column justify-content-between text-white p-3">
                                <div>
                                  <div
                                    className="mb-3"
                                    style={{
                                      width: '50px',
                                      height: '50px',
                                      borderRadius: '14px',
                                      background: 'rgba(255,255,255,0.20)',
                                      backdropFilter: 'blur(10px)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '24px',
                                      border: '1px solid rgba(255,255,255,0.30)',
                                    }}
                                  >
                                    ✂️
                                  </div>

                                  <h6
                                    className="fw-bold mb-1"
                                    style={{
                                      fontSize: '15px',
                                      lineHeight: '1.3',
                                    }}
                                  >
                                    {service.name}
                                  </h6>
                                </div>

                                <div className="mt-1">
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '1px',
                                      background: 'rgba(255,255,255,0.2)',
                                      marginBottom: '10px',
                                    }}
                                  />

                                  <h5
                                    className="fw-bold mb-0"
                                    style={{
                                      letterSpacing: '0.5px',
                                    }}
                                  >
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
                              className="border-0 shadow h-100"
                              style={{
                                cursor: 'pointer',
                                borderRadius: '18px',
                                overflow: 'hidden',
                                transition: 'all .3s ease',
                                background: '#fff',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)'
                                e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.15)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0px)'
                                e.currentTarget.style.boxShadow = ''
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
                                  height: '90px',
                                  background: getProductColor(product.id),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                }}
                              >
                                <div
                                  style={{
                                    width: '55px',
                                    height: '55px',
                                    borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    color: '#fff',
                                  }}
                                >
                                  🧴
                                </div>

                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background:
                                      product.quantity > 10
                                        ? '#198754'
                                        : product.quantity > 0
                                          ? '#fd7e14'
                                          : '#dc3545',
                                    color: '#fff',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                  }}
                                >
                                  {product.quantity} In Stock
                                </div>
                              </div>

                              <CCardBody className="d-flex flex-column justify-content-between">
                                <div>
                                  <h6
                                    className="fw-bold mb-1"
                                    style={{
                                      minHeight: '42px',
                                      lineHeight: '1.3',
                                    }}
                                  >
                                    {product.name}
                                  </h6>
                                </div>

                                <div className="mt-3">
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '1px',
                                      background: '#f1f3f5',
                                      marginBottom: '10px',
                                    }}
                                  />

                                  <div className="d-flex justify-content-between align-items-center">
                                    <h5
                                      className="fw-bold text-success mb-0"
                                      style={{
                                        letterSpacing: '.5px',
                                      }}
                                    >
                                      ₦{Number(product.sellingPrice).toLocaleString()}
                                    </h5>

                                    <div
                                      style={{
                                        width: '35px',
                                        height: '35px',
                                        borderRadius: '10px',
                                        background: '#f8f9fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                      }}
                                    >
                                      🛒
                                    </div>
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
                className="border rounded shadow-sm"
                style={{
                  maxHeight: '450px',
                  overflowY: 'auto',
                  background: '#fff',
                }}
              >
                <CTable
                  hover
                  responsive
                  className="mb-0 align-middle"
                  style={{
                    fontSize: '14px',
                  }}
                >
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      background: '#f8f9fa',
                      zIndex: 2,
                      borderBottom: '2px solid #dee2e6',
                    }}
                  >
                    <tr>
                      <th>#</th>
                      <th>Item Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Amount</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cart.map((item, index) => (
                      <tr
                        key={`${item.type}-${item.id}`}
                        style={{
                          borderBottom: '1px solid #f1f3f5',
                        }}
                      >
                        <td className="fw-bold text-muted">{index + 1}</td>

                        <td>
                          <div>
                            <div className="fw-semibold">{item.name}</div>

                            <small
                              className={`badge ${
                                item.type === 'service' ? 'bg-primary' : 'bg-success'
                              }`}
                            >
                              {item.type}
                            </small>
                          </div>
                        </td>

                        <td className="text-center">
                          <div
                            className="d-inline-flex align-items-center"
                            style={{
                              border: '1px solid #dee2e6',
                              borderRadius: '8px',
                              overflow: 'hidden',
                            }}
                          >
                            <CButton size="sm" color="light" onClick={() => decreaseQty(item.id)}>
                              −
                            </CButton>

                            <span
                              style={{
                                minWidth: '40px',
                                textAlign: 'center',
                                fontWeight: '600',
                              }}
                            >
                              {item.quantity}
                            </span>

                            <CButton size="sm" color="light" onClick={() => increaseQty(item.id)}>
                              +
                            </CButton>
                          </div>
                        </td>

                        {/* <td className="text-end fw-semibold">
                          ₦{Number(item.price || item.sellingPrice).toLocaleString()}
                        </td> */}

                        <td className="text-end">
                          <div className="d-flex justify-content-end align-items-center gap-2">
                            <span className="fw-semibold">
                              ₦{Number(item.price).toLocaleString()}
                            </span>

                            {item.type === 'service' && (
                              <CButton
                                color="light"
                                size="sm"
                                variant="ghost"
                                onClick={() => openPriceModal(item)}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                            )}
                          </div>
                        </td>

                        {/* <td className="text-end">
                          <span
                            className="fw-bold"
                            style={{
                              color: '#198754',
                            }}
                          >
                            ₦
                            {Number(
                              (item.price || item.sellingPrice) * item.quantity,
                            ).toLocaleString()}
                          </span>
                        </td> */}

                        <td className="text-end">
                          {item.originalPrice && item.originalPrice !== item.price && (
                            <small
                              className="text-danger d-block"
                              style={{
                                textDecoration: 'line-through',
                              }}
                            >
                              ₦{Number(item.originalPrice).toLocaleString()}
                            </small>
                          )}

                          <span
                            className="fw-bold"
                            style={{
                              color: '#198754',
                            }}
                          >
                            ₦{Number(item.price * item.quantity).toLocaleString()}
                          </span>
                        </td>

                        <td className="text-center">
                          <CButton
                            size="sm"
                            color="danger"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                          >
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </td>
                      </tr>
                    ))}

                    {cart.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          No items added to cart
                        </td>
                      </tr>
                    )}
                  </tbody>
                </CTable>
              </div>

              {/* Summary Footer */}
              <CCard className="border-0 shadow-sm mt-3">
                <CCardBody>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Items</span>
                    <strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                  </div>

                  <div className="d-flex justify-content-between">
                    <span>Cart Value</span>
                    <strong className="text-success">
                      ₦
                      {cart
                        .reduce(
                          (sum, item) => sum + (item.price || item.sellingPrice) * item.quantity,
                          0,
                        )
                        .toLocaleString()}
                    </strong>
                  </div>
                </CCardBody>
              </CCard>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CCard className="border-0 shadow-sm mt-4">
        <CCardBody>
          <CRow>
            {/* Actions */}
            <CCol md={3}>
              <CCard
                className="border-0 shadow h-100"
                style={{
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg,#667eea,#764ba2)',
                  color: '#fff',
                }}
              >
                <CCardBody>
                  <h5 className="fw-bold mb-4">Quick Actions</h5>

                  <CButton
                    color="light"
                    className="w-100 mb-3 fw-semibold"
                    onClick={() => setShowHoldModal(true)}
                  >
                    Hold Sale
                  </CButton>

                  <CButton
                    color="light"
                    variant="outline"
                    className="w-100 fw-semibold"
                    onClick={openHeldSalesModal}
                  >
                    Restore Sale
                  </CButton>
                </CCardBody>
              </CCard>
            </CCol>

            {/* Loyalty */}
            <CCol md={4}>
              <CCard
                className="border-0 shadow h-100"
                style={{
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg,#11998e,#38ef7d)',
                  color: '#fff',
                }}
              >
                <CCardBody>
                  <h5 className="fw-bold mb-4">Loyalty & Wallet</h5>

                  {selectedCustomer ? (
                    <>
                      <div className="d-flex justify-content-between mb-3">
                        <span>Loyalty Points</span>
                        <h5>{selectedCustomer.loyaltyPoints}</h5>
                      </div>

                      <div className="d-flex justify-content-between mb-4">
                        <span>Wallet Balance</span>
                        <h5>₦{Number(selectedCustomer.walletBalance || 0).toLocaleString()}</h5>
                      </div>

                      <CFormCheck
                        className="mb-3"
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
                    <div
                      className="text-center py-4"
                      style={{
                        opacity: 0.9,
                      }}
                    >
                      No customer selected
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCol>

            {/* Summary */}
            <CCol md={5}>
              <CCard
                className="border-0 shadow h-100"
                style={{
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
                  color: '#fff',
                }}
              >
                <CCardBody>
                  <h5 className="fw-bold mb-4">Order Summary</h5>

                  <div className="d-flex justify-content-between mb-3">
                    <span>Subtotal</span>

                    <strong>₦{Number(subtotal).toLocaleString()}</strong>
                  </div>

                  <div className="mb-3">
                    <CFormInput
                      type="number"
                      label="Discount"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>

                  {usePoints && (
                    <div className="d-flex justify-content-between mb-2 text-warning">
                      <span>Points Discount</span>

                      <strong>- ₦{Number(pointsDiscount || 0).toLocaleString()}</strong>
                    </div>
                  )}

                  {useWallet && (
                    <div className="d-flex justify-content-between mb-2 text-warning">
                      <span>Wallet Used</span>

                      <strong>- ₦{Number(walletUsed || 0).toLocaleString()}</strong>
                    </div>
                  )}

                  <hr
                    style={{
                      borderColor: 'rgba(255,255,255,.2)',
                    }}
                  />

                  <div className="d-flex justify-content-between align-items-center">
                    <span
                      style={{
                        fontSize: '18px',
                      }}
                    >
                      Grand Total
                    </span>

                    <h2 className="fw-bold text-success mb-0">₦{Number(total).toLocaleString()}</h2>
                  </div>

                  <div className="mt-3">
                    <small>Loyalty Points Earned</small>

                    <h5 className="fw-bold">{Math.floor(total / 1000)}</h5>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <hr />

          {/* Payment Footer */}
          <CRow className="align-items-end mt-4">
            <CCol md={4}>
              <CFormSelect
                size="lg"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
                <option value="mixed">Mixed</option>
              </CFormSelect>
            </CCol>

            <CCol md={8}>
              <CButton
                size="lg"
                className="w-100 fw-bold shadow"
                style={{
                  height: '55px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg,#11998e,#38ef7d)',
                }}
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

      {/* Edit price modal */}

      <CModal visible={showPriceModal} onClose={() => setShowPriceModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Change Service Price</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {editingItem && (
            <>
              <h5 className="fw-bold mb-3">{editingItem.name}</h5>

              <div className="mb-3">
                <small className="text-muted">Original Price</small>

                <h4 className="text-primary">
                  ₦{Number(editingItem.originalPrice || editingItem.price).toLocaleString()}
                </h4>
              </div>

              <CFormInput
                label="New Price"
                type="number"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
              />
            </>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowPriceModal(false)}>
            Cancel
          </CButton>

          <CButton color="primary" onClick={saveEditedPrice}>
            Update Price
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  )
}

export default POSPage
