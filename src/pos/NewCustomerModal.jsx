import { useState } from 'react'
import axios from 'axios'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CRow,
  CCol,
  CAlert,
} from '@coreui/react'

export default function NewCustomerModal({ show, onHide, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('token')

      const response = await axios.post(`${API_URL}api/v1/customers`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      onSuccess(response.data.customer)

      setFormData({
        fullname: '',
        phone: '',
        email: '',
      })

      onHide()
    } catch (error) {
      console.log(error)

      setError(error.response?.data?.message || 'Failed to create customer')
    } finally {
      setLoading(false)
    }
  }
  return (
    <CModal visible={show} onClose={onHide} size="lg" alignment="center">
      <CModalHeader>
        <CModalTitle>Add New Customer</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CRow>
          <CCol md={12}>
            <label className="form-label">Full Name</label>

            <CFormInput
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Enter customer name"
            />
          </CCol>

          <CCol md={6} className="mt-3">
            <label className="form-label">Phone Number</label>

            <CFormInput
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="08012345678"
            />
          </CCol>

          <CCol md={6} className="mt-3">
            <label className="form-label">Email</label>

            <CFormInput
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="customer@email.com"
            />
          </CCol>
        </CRow>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onHide}>
          Cancel
        </CButton>

        <CButton color="success" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Create Customer'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
