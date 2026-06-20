import { useState, useEffect } from 'react'

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

import { useParams, useNavigate } from 'react-router-dom'

import axios from 'axios'

import Swal from 'sweetalert2'

const EditService = () => {
  const { id } = useParams()

  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)

  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '',
  })

  const getService = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/services/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const service = response.data.service

      setFormData({
        name: service.name || '',
        price: service.price || '',
        duration: service.duration || '',
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load service',
      })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getService()
    }
    fetchData()
  }, [id])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      const token = localStorage.getItem('token')

      await axios.put(`${API_URL}api/v1/services/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      await Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Service updated successfully',
      })

      navigate('/service')
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
        <CSpinner />
      </div>
    )
  }

  return (
    <CCard>
      <CCardHeader>Edit Service</CCardHeader>

      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Service Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </CCol>

            <CCol md={3}>
              <CFormInput
                type="number"
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </CCol>

            <CCol md={3}>
              <CFormInput
                type="number"
                label="Duration (Minutes)"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <div className="mt-4">
            <CButton type="submit" color="primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Service'}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default EditService
