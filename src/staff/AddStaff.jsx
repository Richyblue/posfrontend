
import React, { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'

const AddStaff = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const currentUser = JSON.parse(localStorage.getItem('user'))

  const initialFormData = {
    fullname: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    position: '',
    salary: '',
    employmentType: 'salary',
    hmoProvider: '',
    hmoNumber: '',
    commissionRate: 0,
    commissionCycle: 'monthly',
  }

  const [formData, setFormData] = useState(initialFormData)
  const [photoFile, setPhotoFile] = useState(null)
  const [signatureFile, setSignatureFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [signaturePreview, setSignaturePreview] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      Swal.fire('Invalid file', 'Please select a JPG, PNG or WEBP image.', 'error')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('File too large', 'Each image must not exceed 5MB.', 'error')
      e.target.value = ''
      return
    }

    const preview = URL.createObjectURL(file)

    if (type === 'photo') {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      setPhotoFile(file)
      setPhotoPreview(preview)
    } else {
      if (signaturePreview) URL.revokeObjectURL(signaturePreview)
      setSignatureFile(file)
      setSignaturePreview(preview)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email || !formData.password || !formData.fullname || !formData.role) {
      Swal.fire('Required fields', 'Full name, email, password and role are required.', 'warning')
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      const payload = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value ?? '')
      })

      if (photoFile) payload.append('photo', photoFile)
      if (signatureFile) payload.append('signature', signatureFile)

      await axios.post(`${API_URL}api/v1/staff`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Staff created successfully',
      })

      setFormData({ ...initialFormData })
      setPhotoFile(null)
      setSignatureFile(null)
      setPhotoPreview('')
      setSignaturePreview('')

      // Clear file input controls
      document.querySelectorAll('input[type="file"]').forEach((input) => {
        input.value = ''
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to create staff',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard className="shadow-sm">
      <CCardHeader>
        <h4 className="mb-0">Add Staff</h4>
      </CCardHeader>

      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <h5 className="mb-3">Personal Information</h5>

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
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormInput
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                type="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormSelect
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                {currentUser?.role === 'admin' && (
                  <option value="admin">Admin</option>
                )}
                <option value="manager">Manager</option>
                <option value="cashier">Cashier</option>
                <option value="staff">Staff</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <hr />

          <h5 className="mb-3">Staff Photograph & Signature</h5>

          <CRow>
            <CCol md={6}>
              <CFormInput
                type="file"
                label="Staff Photograph"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, 'photo')}
              />

              <small className="text-body-secondary">
                JPG, PNG or WEBP. Maximum 5MB.
              </small>

              {photoPreview && (
                <div className="mt-3">
                  <img
                    src={photoPreview}
                    alt="Staff preview"
                    style={{
                      width: '130px',
                      height: '130px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                  />
                </div>
              )}
            </CCol>

            <CCol md={6}>
              <CFormInput
                type="file"
                label="Staff Signature"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, 'signature')}
              />

              <small className="text-body-secondary">
                Upload a scanned signature. Maximum 5MB.
              </small>

              {signaturePreview && (
                <div className="mt-3">
                  <img
                    src={signaturePreview}
                    alt="Signature preview"
                    style={{
                      width: '180px',
                      height: '100px',
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      background: '#fff',
                    }}
                  />
                </div>
              )}
            </CCol>
          </CRow>

          <hr />

          <h5>Employment Details</h5>

          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Position"
                name="position"
                value={formData.position}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="Salary"
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormSelect
                label="Employment Type"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
              >
                <option value="salary">Salary</option>
                <option value="commission">Commission</option>
                <option value="salary_and_commission">Salary + Commission</option>
              </CFormSelect>
            </CCol>
          </CRow>

          {(formData.employmentType === 'commission' ||
            formData.employmentType === 'salary_and_commission') && (
            <CRow className="mt-3">
              <CCol md={6}>
                <CInputGroup>
                  <CFormInput
                    type="number"
                    placeholder="Commission Rate"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                  />
                  <CInputGroupText>%</CInputGroupText>
                </CInputGroup>
              </CCol>

              <CCol md={6}>
                <CFormSelect
                  name="commissionCycle"
                  value={formData.commissionCycle}
                  onChange={handleChange}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </CFormSelect>
              </CCol>
            </CRow>
          )}

          <hr />

          <h5>HMO Information</h5>

          <CRow>
            <CCol md={6}>
              <CFormInput
                label="HMO Provider"
                name="hmoProvider"
                value={formData.hmoProvider}
                onChange={handleChange}
              />
            </CCol>

            <CCol md={6}>
              <CFormInput
                label="HMO Number"
                name="hmoNumber"
                value={formData.hmoNumber}
                onChange={handleChange}
              />
            </CCol>
          </CRow>

          <div className="mt-4">
            <CButton type="submit" color="primary" disabled={loading}>
              {loading ? 'Saving Staff...' : 'Save Staff'}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default AddStaff
