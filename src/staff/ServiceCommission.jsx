import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CProgress,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'

import {
  cilCheckCircle,
  cilPencil,
  cilPlus,
  cilReload,
  cilSearch,
  cilSettings,
  cilTrash,
  cilXCircle,
  cilHome,
} from '@coreui/icons'

const ServiceCommission = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // ==========================================
  // STATE
  // ==========================================

  const [services, setServices] = useState([])
  const [commissions, setCommissions] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')

  // ==========================================
  // DEFAULT COMMISSION
  // ==========================================

  const [defaultInSalonStaffPercentage, setDefaultInSalonStaffPercentage] = useState(30)

  const [defaultHomeServiceStaffPercentage, setDefaultHomeServiceStaffPercentage] = useState(50)

  // ==========================================
  // MODAL
  // ==========================================

  const [showModal, setShowModal] = useState(false)

  const [editingCommission, setEditingCommission] = useState(null)

  const [selectedService, setSelectedService] = useState('')

  const [inSalonStaffPercentage, setInSalonStaffPercentage] = useState(30)

  const [homeServiceStaffPercentage, setHomeServiceStaffPercentage] = useState(50)

  const [isActive, setIsActive] = useState(true)

  // ==========================================
  // MESSAGE
  // ==========================================

  const [message, setMessage] = useState({
    type: '',
    text: '',
  })

  // ==========================================
  // TOKEN
  // ==========================================

  const token = localStorage.getItem('token')

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  // ==========================================
  // MESSAGE
  // ==========================================

  const showMessage = (type, text) => {
    setMessage({
      type,
      text,
    })

    setTimeout(() => {
      setMessage({
        type: '',
        text: '',
      })
    }, 4000)
  }

  // ==========================================
  // NORMALIZE API ARRAY
  //
  // Prevents:
  // "t.filter is not a function"
  // ==========================================

  const normalizeArray = (response) => {
    const data = response?.data

    if (Array.isArray(data)) {
      return data
    }

    if (Array.isArray(data?.data)) {
      return data.data
    }

    if (Array.isArray(data?.services)) {
      return data.services
    }

    if (Array.isArray(data?.commissions)) {
      return data.commissions
    }

    return []
  }

  // ==========================================
  // FETCH SERVICES
  // ==========================================

  const getServices = async () => {
    try {
      /*
       * IMPORTANT:
       *
       * Your previous URL was:
       *
       * /api/v1/servicess
       *
       * If your actual backend route is /services,
       * use the URL below.
       */

      const response = await axios.get(`${API_URL}api/v1/servicess`, axiosConfig)

      const serviceData = normalizeArray(response)

      setServices(serviceData)
    } catch (error) {
      console.error('Failed to fetch services:', error)

      setServices([])

      showMessage('danger', error.response?.data?.message || 'Unable to load services.')
    }
  }

  // ==========================================
  // FETCH COMMISSIONS
  // ==========================================

  const getCommissions = async () => {
    try {
      const response = await axios.get(`${API_URL}api/v1/service-commissions`, axiosConfig)

      const commissionData = normalizeArray(response)

      setCommissions(commissionData)
    } catch (error) {
      console.error('Failed to fetch commissions:', error)

      setCommissions([])

      showMessage('danger', error.response?.data?.message || 'Unable to load commission settings.')
    }
  }

  // ==========================================
  // LOAD DATA
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true)

      await Promise.all([getServices(), getCommissions()])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ==========================================
  // OWNER PERCENTAGE
  // ==========================================

  const calculateOwnerPercentage = (staff) => {
    const value = Number(staff)

    if (Number.isNaN(value)) {
      return 100
    }

    return Math.max(0, Math.min(100, 100 - value))
  }

  // ==========================================
  // DEFAULT IN-SALON
  // ==========================================

  const handleDefaultInSalonChange = (value) => {
    const percentage = Number(value)

    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      return
    }

    setDefaultInSalonStaffPercentage(percentage)
  }

  // ==========================================
  // DEFAULT HOME SERVICE
  // ==========================================

  const handleDefaultHomeServiceChange = (value) => {
    const percentage = Number(value)

    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      return
    }

    setDefaultHomeServiceStaffPercentage(percentage)
  }

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    setEditingCommission(null)

    setSelectedService('')

    setInSalonStaffPercentage(defaultInSalonStaffPercentage)

    setHomeServiceStaffPercentage(defaultHomeServiceStaffPercentage)

    setIsActive(true)

    setShowModal(true)
  }

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (commission) => {
    setEditingCommission(commission)

    setSelectedService(commission.service_id)

    setInSalonStaffPercentage(
      Number(commission.in_salon_staff_percentage ?? defaultInSalonStaffPercentage),
    )

    setHomeServiceStaffPercentage(
      Number(commission.home_service_staff_percentage ?? defaultHomeServiceStaffPercentage),
    )

    setIsActive(commission.is_active !== false)

    setShowModal(true)
  }

  // ==========================================
  // SAVE COMMISSION
  // ==========================================

  const saveCommission = async () => {
    if (!selectedService) {
      showMessage('danger', 'Please select a service.')

      return
    }

    const inSalonPercentage = Number(inSalonStaffPercentage)

    const homeServicePercentage = Number(homeServiceStaffPercentage)

    if (Number.isNaN(inSalonPercentage) || inSalonPercentage < 0 || inSalonPercentage > 100) {
      showMessage('danger', 'In-salon staff commission must be between 0% and 100%.')

      return
    }

    if (
      Number.isNaN(homeServicePercentage) ||
      homeServicePercentage < 0 ||
      homeServicePercentage > 100
    ) {
      showMessage('danger', 'Home-service staff commission must be between 0% and 100%.')

      return
    }

    try {
      setSaving(true)

      await axios.post(
        `${API_URL}api/v1/service-commissions`,
        {
          service_id: selectedService,

          in_salon_staff_percentage: inSalonPercentage,

          in_salon_owner_percentage: 100 - inSalonPercentage,

          home_service_staff_percentage: homeServicePercentage,

          home_service_owner_percentage: 100 - homeServicePercentage,

          is_active: isActive,
        },
        axiosConfig,
      )

      showMessage('success', 'Commission settings saved successfully.')

      setShowModal(false)

      await getCommissions()
    } catch (error) {
      console.error('Save commission error:', error)

      showMessage('danger', error.response?.data?.message || 'Failed to save commission settings.')
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // DELETE COMMISSION
  // ==========================================

  const deleteCommission = async (commission) => {
    const serviceName = commission.Service?.name || getServiceName(commission.service_id)

    const confirmed = window.confirm(
      `Remove the custom commission for ${serviceName}? This service will return to the default commission settings.`,
    )

    if (!confirmed) return

    try {
      setSaving(true)

      await axios.delete(
        `${API_URL}api/v1/service-commissions/${commission.service_id}`,
        axiosConfig,
      )

      showMessage('success', `${serviceName} has been reset to the default commission.`)

      await getCommissions()
    } catch (error) {
      console.error('Delete commission error:', error)

      showMessage('danger', error.response?.data?.message || 'Failed to remove commission.')
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // TOGGLE COMMISSION
  // ==========================================

  const toggleCommission = async (commission) => {
    try {
      await axios.patch(
        `${API_URL}api/v1/service-commissions/${commission.service_id}/toggle`,
        {},
        axiosConfig,
      )

      showMessage(
        'success',
        commission.is_active ? 'Custom commission disabled.' : 'Custom commission enabled.',
      )

      await getCommissions()
    } catch (error) {
      console.error('Toggle commission error:', error)

      showMessage('danger', error.response?.data?.message || 'Failed to update commission status.')
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredServices = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    return (Array.isArray(services) ? services : []).filter((service) =>
      service?.name?.toLowerCase().includes(keyword),
    )
  }, [services, search])

  // ==========================================
  // COMMISSION LOOKUP
  // ==========================================

  const commissionMap = useMemo(() => {
    const map = {}

    ;(Array.isArray(commissions) ? commissions : []).forEach((commission) => {
      map[commission.service_id] = commission
    })

    return map
  }, [commissions])

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalServices = Array.isArray(services) ? services.length : 0

  const customServices = Array.isArray(commissions) ? commissions.length : 0

  const activeCustomServices = Array.isArray(commissions)
    ? commissions.filter((item) => item.is_active).length
    : 0

  const inactiveCustomServices = Array.isArray(commissions)
    ? commissions.filter((item) => !item.is_active).length
    : 0

  // ==========================================
  // SERVICE NAME
  // ==========================================

  const getServiceName = (serviceId) => {
    const service = (Array.isArray(services) ? services : []).find(
      (item) => Number(item.id) === Number(serviceId),
    )

    return service?.name || 'Unknown Service'
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="service-commission-settings">
      {/* ======================================
          PAGE HEADER
      ====================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody className="p-4">
          <CRow className="align-items-center">
            <CCol md={8}>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '55px',
                    height: '55px',
                  }}
                >
                  <CIcon icon={cilSettings} size="xl" className="text-primary" />
                </div>

                <div>
                  <h3 className="mb-1 fw-bold">Staff Commission</h3>

                  <p className="text-medium-emphasis mb-0">
                    Configure staff commission percentages separately for in-salon and home-service
                    services.
                  </p>
                </div>
              </div>
            </CCol>

            <CCol md={4} className="text-md-end mt-3 mt-md-0">
              <CButton color="light" className="me-2" onClick={loadData} disabled={loading}>
                <CIcon icon={cilReload} className="me-1" />
                Refresh
              </CButton>

              <CButton color="primary" onClick={openCreateModal}>
                <CIcon icon={cilPlus} className="me-1" />
                Add Custom Rule
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ======================================
          ALERT
      ====================================== */}

      {message.text && (
        <CAlert
          color={message.type}
          dismissible
          onClose={() =>
            setMessage({
              type: '',
              text: '',
            })
          }
        >
          {message.text}
        </CAlert>
      )}

      {/* ======================================
          STATISTICS
      ====================================== */}

      <CRow className="mb-4">
        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-medium-emphasis small">Total Services</div>

                  <h3 className="fw-bold mt-2 mb-0">{totalServices}</h3>
                </div>

                <CIcon icon={cilSettings} size="xl" className="text-primary" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-medium-emphasis small">Custom Rules</div>

                  <h3 className="fw-bold mt-2 mb-0">{customServices}</h3>
                </div>

                <CIcon icon={cilPencil} size="xl" className="text-info" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-medium-emphasis small">Active Rules</div>

                  <h3 className="fw-bold mt-2 mb-0 text-success">{activeCustomServices}</h3>
                </div>

                <CIcon icon={cilCheckCircle} size="xl" className="text-success" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="d-flex justify-content-between">
                <div>
                  <div className="text-medium-emphasis small">In-Salon Default</div>

                  <h3 className="fw-bold mt-2 mb-0">{defaultInSalonStaffPercentage}%</h3>
                </div>

                <CIcon icon={cilSettings} size="xl" className="text-warning" />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ======================================
          DEFAULT COMMISSION
      ====================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-white py-3">
          <div className="d-flex align-items-center">
            <CIcon icon={cilSettings} className="text-primary me-2" />

            <div>
              <h5 className="mb-0 fw-bold">Default Commission</h5>

              <small className="text-medium-emphasis">
                These percentages apply to services that do not have a custom rule.
              </small>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow>
            {/* IN-SALON */}

            <CCol lg={5} md={6}>
              <div className="p-3 border rounded h-100">
                <div className="d-flex align-items-center mb-3">
                  <CIcon icon={cilSettings} className="text-primary me-2" />

                  <div>
                    <h6 className="fw-bold mb-0">In-Salon Service</h6>

                    <small className="text-medium-emphasis">
                      Services rendered inside the salon.
                    </small>
                  </div>
                </div>

                <CFormLabel className="fw-semibold">Staff Commission</CFormLabel>

                <div className="input-group">
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={defaultInSalonStaffPercentage}
                    onChange={(e) => handleDefaultInSalonChange(e.target.value)}
                  />

                  <span className="input-group-text">%</span>
                </div>

                <div className="mt-3 d-flex justify-content-between">
                  <span>
                    Staff
                    <strong className="text-primary ms-1">{defaultInSalonStaffPercentage}%</strong>
                  </span>

                  <span>
                    Business
                    <strong className="text-success ms-1">
                      {calculateOwnerPercentage(defaultInSalonStaffPercentage)}%
                    </strong>
                  </span>
                </div>

                <CProgress height={8} className="mt-2" value={defaultInSalonStaffPercentage} />
              </div>
            </CCol>

            {/* HOME SERVICE */}

            <CCol lg={5} md={6} className="mt-3 mt-md-0">
              <div className="p-3 border rounded h-100">
                <div className="d-flex align-items-center mb-3">
                  <CIcon icon={cilHome} className="text-info me-2" />

                  <div>
                    <h6 className="fw-bold mb-0">Home Service</h6>

                    <small className="text-medium-emphasis">
                      Services rendered at the customer's location.
                    </small>
                  </div>
                </div>

                <CFormLabel className="fw-semibold">Staff Commission</CFormLabel>

                <div className="input-group">
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={defaultHomeServiceStaffPercentage}
                    onChange={(e) => handleDefaultHomeServiceChange(e.target.value)}
                  />

                  <span className="input-group-text">%</span>
                </div>

                <div className="mt-3 d-flex justify-content-between">
                  <span>
                    Staff
                    <strong className="text-info ms-1">{defaultHomeServiceStaffPercentage}%</strong>
                  </span>

                  <span>
                    Business
                    <strong className="text-success ms-1">
                      {calculateOwnerPercentage(defaultHomeServiceStaffPercentage)}%
                    </strong>
                  </span>
                </div>

                <CProgress height={8} className="mt-2" value={defaultHomeServiceStaffPercentage} />
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ======================================
          CUSTOM COMMISSION RULES
      ====================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-white py-3">
          <CRow className="align-items-center">
            <CCol md={6}>
              <h5 className="mb-1 fw-bold">Service-Specific Commission</h5>

              <small className="text-medium-emphasis">
                Set different percentages for individual services and service types.
              </small>
            </CCol>

            <CCol md={6} className="mt-3 mt-md-0">
              <div className="position-relative">
                <CIcon
                  icon={cilSearch}
                  className="position-absolute"
                  style={{
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 5,
                  }}
                />

                <CFormInput
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    paddingLeft: '38px',
                  }}
                />
              </div>
            </CCol>
          </CRow>
        </CCardHeader>

        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />

              <div className="mt-3 text-medium-emphasis">Loading commission settings...</div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-5">
              <CIcon icon={cilSearch} size="xxl" className="text-medium-emphasis mb-3" />

              <h5>No services found</h5>

              <p className="text-medium-emphasis">Try changing your search.</p>
            </div>
          ) : (
            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell className="ps-4">SERVICE</CTableHeaderCell>

                  <CTableHeaderCell>IN-SALON</CTableHeaderCell>

                  <CTableHeaderCell>HOME SERVICE</CTableHeaderCell>

                  <CTableHeaderCell>STATUS</CTableHeaderCell>

                  <CTableHeaderCell className="text-end pe-4">ACTIONS</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredServices.map((service) => {
                  const commission = commissionMap[service.id]

                  const isCustom = !!commission

                  const active = commission ? commission.is_active : true

                  const inSalonStaff =
                    commission && active
                      ? Number(
                          commission.in_salon_staff_percentage ?? defaultInSalonStaffPercentage,
                        )
                      : defaultInSalonStaffPercentage

                  const inSalonOwner = calculateOwnerPercentage(inSalonStaff)

                  const homeStaff =
                    commission && active
                      ? Number(
                          commission.home_service_staff_percentage ??
                            defaultHomeServiceStaffPercentage,
                        )
                      : defaultHomeServiceStaffPercentage

                  const homeOwner = calculateOwnerPercentage(homeStaff)

                  return (
                    <CTableRow key={service.id}>
                      {/* SERVICE */}

                      <CTableDataCell className="ps-4">
                        <div className="fw-semibold">{service.name}</div>

                        {service.description && (
                          <small className="text-medium-emphasis">{service.description}</small>
                        )}
                      </CTableDataCell>

                      {/* IN-SALON */}

                      <CTableDataCell>
                        <div className="mb-1">
                          <CBadge color="primary" className="me-2">
                            Staff
                          </CBadge>

                          <strong>{inSalonStaff}%</strong>
                        </div>

                        <small className="text-success">Business {inSalonOwner}%</small>
                      </CTableDataCell>

                      {/* HOME SERVICE */}

                      <CTableDataCell>
                        <div className="mb-1">
                          <CBadge color="info" className="me-2">
                            Staff
                          </CBadge>

                          <strong>{homeStaff}%</strong>
                        </div>

                        <small className="text-success">Business {homeOwner}%</small>
                      </CTableDataCell>

                      {/* STATUS */}

                      <CTableDataCell>
                        {isCustom ? (
                          active ? (
                            <CBadge color="success" className="px-3 py-2">
                              <CIcon icon={cilCheckCircle} className="me-1" />
                              Custom Active
                            </CBadge>
                          ) : (
                            <CBadge color="secondary" className="px-3 py-2">
                              <CIcon icon={cilXCircle} className="me-1" />
                              Disabled
                            </CBadge>
                          )
                        ) : (
                          <CBadge color="success" variant="outline" className="px-3 py-2">
                            Using Default
                          </CBadge>
                        )}
                      </CTableDataCell>

                      {/* ACTIONS */}

                      <CTableDataCell className="text-end pe-4">
                        {isCustom ? (
                          <>
                            <CButton
                              color="light"
                              size="sm"
                              className="me-1"
                              title="Edit"
                              onClick={() => openEditModal(commission)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>

                            <CButton
                              color={active ? 'warning' : 'success'}
                              size="sm"
                              className="me-1"
                              title={active ? 'Disable' : 'Enable'}
                              onClick={() => toggleCommission(commission)}
                            >
                              <CIcon icon={active ? cilXCircle : cilCheckCircle} />
                            </CButton>

                            <CButton
                              color="danger"
                              size="sm"
                              title="Reset to default"
                              onClick={() => deleteCommission(commission)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </>
                        ) : (
                          <CButton
                            color="primary"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedService(service.id)

                              setInSalonStaffPercentage(defaultInSalonStaffPercentage)

                              setHomeServiceStaffPercentage(defaultHomeServiceStaffPercentage)

                              setIsActive(true)

                              setEditingCommission(null)

                              setShowModal(true)
                            }}
                          >
                            <CIcon icon={cilPlus} className="me-1" />
                            Customize
                          </CButton>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* ======================================
          COMMISSION MODAL
      ====================================== */}

      <CModal
        visible={showModal}
        onClose={() => !saving && setShowModal(false)}
        size="lg"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle className="fw-bold">
            {editingCommission ? 'Edit Commission Rule' : 'Create Commission Rule'}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {/* SERVICE */}

          <div className="mb-4">
            <CFormLabel className="fw-semibold">Service</CFormLabel>

            <CFormSelect
              value={selectedService}
              disabled={!!editingCommission}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="">Select a service...</option>

              {Array.isArray(services) &&
                services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
            </CFormSelect>
          </div>

          {/* ==================================
              IN-SALON
          ================================== */}

          <div className="p-3 border rounded mb-4">
            <div className="d-flex align-items-center mb-3">
              <CIcon icon={cilSettings} className="text-primary me-2" />

              <div>
                <h6 className="fw-bold mb-0">In-Salon Service</h6>

                <small className="text-medium-emphasis">
                  Commission when the service is rendered inside the salon.
                </small>
              </div>
            </div>

            <CRow>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">Staff Commission</CFormLabel>

                <div className="input-group input-group-lg">
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={inSalonStaffPercentage}
                    onChange={(e) => setInSalonStaffPercentage(e.target.value)}
                  />

                  <span className="input-group-text">%</span>
                </div>
              </CCol>

              <CCol md={6}>
                <CFormLabel className="fw-semibold">Business Share</CFormLabel>

                <div className="input-group input-group-lg">
                  <CFormInput value={calculateOwnerPercentage(inSalonStaffPercentage)} readOnly />

                  <span className="input-group-text">%</span>
                </div>
              </CCol>
            </CRow>

            <CProgress height={10} className="mt-3" value={Number(inSalonStaffPercentage || 0)} />
          </div>

          {/* ==================================
              HOME SERVICE
          ================================== */}

          <div className="p-3 border rounded mb-4">
            <div className="d-flex align-items-center mb-3">
              <CIcon icon={cilHome} className="text-info me-2" />

              <div>
                <h6 className="fw-bold mb-0">Home Service</h6>

                <small className="text-medium-emphasis">
                  Commission when the service is rendered at the customer's location.
                </small>
              </div>
            </div>

            <CRow>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">Staff Commission</CFormLabel>

                <div className="input-group input-group-lg">
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={homeServiceStaffPercentage}
                    onChange={(e) => setHomeServiceStaffPercentage(e.target.value)}
                  />

                  <span className="input-group-text">%</span>
                </div>
              </CCol>

              <CCol md={6}>
                <CFormLabel className="fw-semibold">Business Share</CFormLabel>

                <div className="input-group input-group-lg">
                  <CFormInput
                    value={calculateOwnerPercentage(homeServiceStaffPercentage)}
                    readOnly
                  />

                  <span className="input-group-text">%</span>
                </div>
              </CCol>
            </CRow>

            <CProgress
              height={10}
              className="mt-3"
              value={Number(homeServiceStaffPercentage || 0)}
            />
          </div>

          {/* ==================================
              COMPARISON
          ================================== */}

          <div className="p-3 rounded bg-light">
            <h6 className="fw-bold mb-3">Commission Summary</h6>

            <CRow>
              <CCol md={6}>
                <div className="border rounded p-3 bg-white">
                  <div className="small text-medium-emphasis">In-Salon</div>

                  <div className="d-flex justify-content-between mt-2">
                    <strong className="text-primary">Staff</strong>

                    <strong>{Number(inSalonStaffPercentage || 0)}%</strong>
                  </div>

                  <div className="d-flex justify-content-between">
                    <strong className="text-success">Business</strong>

                    <strong>{calculateOwnerPercentage(inSalonStaffPercentage)}%</strong>
                  </div>
                </div>
              </CCol>

              <CCol md={6} className="mt-3 mt-md-0">
                <div className="border rounded p-3 bg-white">
                  <div className="small text-medium-emphasis">Home Service</div>

                  <div className="d-flex justify-content-between mt-2">
                    <strong className="text-info">Staff</strong>

                    <strong>{Number(homeServiceStaffPercentage || 0)}%</strong>
                  </div>

                  <div className="d-flex justify-content-between">
                    <strong className="text-success">Business</strong>

                    <strong>{calculateOwnerPercentage(homeServiceStaffPercentage)}%</strong>
                  </div>
                </div>
              </CCol>
            </CRow>
          </div>

          {/* STATUS */}

          <div className="mt-4">
            <CFormCheck
              id="commissionActive"
              label="Enable this custom commission rule"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />

            <small className="text-medium-emphasis d-block ms-4 mt-1">
              When disabled, the service will use the default commission percentages.
            </small>
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="light" onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </CButton>

          <CButton color="primary" onClick={saveCommission} disabled={saving}>
            {saving ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <CIcon icon={cilCheckCircle} className="me-1" />
                Save Commission
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default ServiceCommission
