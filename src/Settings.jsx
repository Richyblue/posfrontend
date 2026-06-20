import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormCheck,
  CButton,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react'

import { useEffect, useState } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'

const Settings = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)

  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyAddress: '',

    currency: 'NGN',
    currencySymbol: '₦',

    defaultCommissionRate: 10,

    loyaltyPointRate: 1,

    lowStockThreshold: 5,

    taxRate: 0,

    autoApproveSales: true,

    allowNegativeStock: false,

    receiptFooter: '',
  })

  const getSettings = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/settings`, {
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const saveSettings = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      const token = localStorage.getItem('token')

      await axios.put(`${API_URL}api/v1/settings`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Settings Updated',
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Update Failed',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <CSpinner />
  }

  return (
    <CCard>
      <CCardHeader>System Settings</CCardHeader>

      <CCardBody>
        <CForm onSubmit={saveSettings}>
          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Company Phone"
                name="companyPhone"
                value={formData.companyPhone}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormInput
                label="Company Email"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Currency Symbol"
                name="currencySymbol"
                value={formData.currencySymbol}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={4}>
              <CFormInput
                type="number"
                label="Commission Rate %"
                name="defaultCommissionRate"
                value={formData.defaultCommissionRate}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={4}>
              <CFormInput
                type="number"
                label="Tax Rate %"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={4}>
              <CFormInput
                type="number"
                label="Low Stock Threshold"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormInput
                type="number"
                label="Loyalty Point Rate"
                name="loyaltyPointRate"
                value={formData.loyaltyPointRate}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormCheck
                label="Auto Approve Sales"
                name="autoApproveSales"
                checked={formData.autoApproveSales}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormCheck
                label="Allow Negative Stock"
                name="allowNegativeStock"
                checked={formData.allowNegativeStock}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={12}>
              <CFormTextarea
                rows={3}
                label="Company Address"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={12}>
              <CFormTextarea
                rows={4}
                label="Receipt Footer"
                name="receiptFooter"
                value={formData.receiptFooter}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <div className="mt-4">
            <CButton type="submit" color="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default Settings
