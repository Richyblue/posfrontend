import { useEffect, useState } from 'react'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CButton,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react'

import axios from 'axios'
import Swal from 'sweetalert2'

import { useParams, useNavigate } from 'react-router-dom'

const EditCustomer = () => {
  const { id } = useParams()

  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)

  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    loyaltyPoints: 0,
  })

  const getCustomer = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/customers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setFormData({
        fullname: response.data.customer?.fullname || '',

        phone: response.data.customer?.phone || '',

        email: response.data.customer?.email || '',

        loyaltyPoints: response.data.customer?.loyaltyPoints || 0,
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load customer',
      })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getCustomer()
    }
    fetchData()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const updateCustomer = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      const token = localStorage.getItem('token')

      await axios.put(`${API_URL}api/v1/customers/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Customer updated successfully',
      })

      navigate('/viewCustomer')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Update failed',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div
        className="
        d-flex
        justify-content-center
        align-items-center"
        style={{
          height: '70vh',
        }}
      >
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <CCard>
      <CCardHeader>Edit Customer</CCardHeader>

      <CCardBody>
        <CForm onSubmit={updateCustomer}>
          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Full Name"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                required
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormInput
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                type="number"
                label="Loyalty Points"
                name="loyaltyPoints"
                value={formData.loyaltyPoints}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <div className="mt-4">
            <CButton type="submit" color="primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Customer'}
            </CButton>

            <CButton color="secondary" className="ms-2" onClick={() => navigate('/customers')}>
              Cancel
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default EditCustomer
