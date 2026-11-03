
import React, { useState, useEffect } from 'react'
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

import { useNavigate, useParams } from 'react-router-dom'

const EditStaff = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = JSON.parse(localStorage.getItem('user'))

  const [formData, setFormData] = useState({
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
  })

  const [photoFile, setPhotoFile] = useState(null)
  const [signatureFile, setSignatureFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [signaturePreview, setSignaturePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const token = localStorage.getItem('token')

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

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
      setPhotoFile(file)
      setPhotoPreview(preview)
    } else {
      setSignatureFile(file)
      setSignaturePreview(preview)
    }
  }

  const fetchStaff = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}api/v1/staff/${id}`,
        authConfig
      )

      const staff = data.staff

      setFormData({
        fullname: staff.User?.fullname || '',
        email: staff.User?.email || '',
        phone: staff.User?.phone || '',
        password: '',
        role: staff.User?.role || 'staff',
        position: staff.position || '',
        salary: staff.salary ?? '',
        employmentType: staff.employmentType || 'salary',
        hmoProvider: staff.hmoProvider || '',
        hmoNumber: staff.hmoNumber || '',
        commissionRate: staff.commissionRate ?? 0,
        commissionCycle: staff.commissionCycle || 'monthly',
      })

      // Load existing photograph and signature
      const mediaResponse = await axios.get(
        `${API_URL}api/v1/staff/${id}/media`,
        authConfig
      )

      setPhotoPreview(mediaResponse.data.photo || '')
      setSignaturePreview(mediaResponse.data.signature || '')

    } catch (error) {
      console.error(error)

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Unable to load staff details',
      })
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [id])

  const removeMedia = async (type) => {
    const isPhoto = type === 'photo'

    const result = await Swal.fire({
      title: `Remove staff ${isPhoto ? 'photograph' : 'signature'}?`,
      text: 'This will permanently remove the saved image.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
    })

    if (!result.isConfirmed) return

    try {
      await axios.delete(
        `${API_URL}api/v1/staff/${id}/${type}`,
        authConfig
      )

      if (isPhoto) {
        setPhotoPreview('')
        setPhotoFile(null)
      } else {
        setSignaturePreview('')
        setSignatureFile(null)
      }

      Swal.fire('Removed', 'Image removed successfully.', 'success')
    } catch (error) {
      Swal.fire(
        'Error',
        error.response?.data?.message || 'Unable to remove image',
        'error'
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const payload = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value ?? '')
      })

      if (photoFile) payload.append('photo', photoFile)
      if (signatureFile) payload.append('signature', signatureFile)

      await axios.put(
        `${API_URL}api/v1/staff/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Staff updated successfully',
      }).then(() => {
        navigate('/viewStaff')
      })

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update staff',
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <CCard><CCardBody>Loading staff details...</CCardBody></CCard>
  }

  return (
    <CCard className="shadow-sm">
      <CCardHeader>
        <h4 className="mb-0">Edit Staff</h4>
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
                label="New Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
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
                label="Change Staff Photograph"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, 'photo')}
              />

              <small className="text-body-secondary">
                JPG, PNG or WEBP. Maximum 5MB.
              </small>

              {photoPreview ? (
                <div className="mt-3">
                  <img
                    src={photoPreview}
                    alt="Staff photograph"
                    style={{
                      width: '130px',
                      height: '130px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                    }}
                  />

                  <div>
                    <CButton
                      color="danger"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => removeMedia('photo')}
                    >
                      Remove Photograph
                    </CButton>
                  </div>
                </div>
              ) : (
                <p className="text-body-secondary mt-2">No photograph uploaded.</p>
              )}
            </CCol>

            <CCol md={6}>
              <CFormInput
                type="file"
                label="Change Staff Signature"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, 'signature')}
              />

              <small className="text-body-secondary">
                JPG, PNG or WEBP. Maximum 5MB.
              </small>

              {signaturePreview ? (
                <div className="mt-3">
                  <img
                    src={signaturePreview}
                    alt="Staff signature"
                    style={{
                      width: '180px',
                      height: '100px',
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      background: '#fff',
                    }}
                  />

                  <div>
                    <CButton
                      color="danger"
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => removeMedia('signature')}
                    >
                      Remove Signature
                    </CButton>
                  </div>
                </div>
              ) : (
                <p className="text-body-secondary mt-2">No signature uploaded.</p>
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
              {loading ? 'Updating Staff...' : 'Update Staff'}
            </CButton>

            <CButton
              color="secondary"
              variant="outline"
              className="ms-2"
              onClick={() => navigate('/viewStaff')}
            >
              Cancel
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default EditStaff
