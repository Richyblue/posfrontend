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
const AddStaff = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const { id } = useParams()
  const navigate = useNavigate()
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
  const handleChange = (e) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    })
  }

  //   useEffect(() => {
  //     fetchStaff()
  //   }, [])

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token')

      const { data } = await axios.get(`${API_URL}api/v1/staff/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const staff = data.staff

      setFormData({
        fullname: staff.User.fullname,
        email: staff.User.email,
        phone: staff.User.phone,
        password: '',
        role: staff.User.role,
        position: staff.position,
        salary: staff.salary,
        employmentType: staff.employmentType,
        hmoProvider: staff.hmoProvider,
        hmoNumber: staff.hmoNumber,
        commissionRate: staff.commissionRate,
        commissionCycle: staff.commissionCycle,
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Unable to load staff details',
      })
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await fetchStaff()
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')

      await axios.put(`${API_URL}api/v1/staff/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

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
    }
  }

  return (
    <CCard className="shadow-sm">
      <CCardHeader>
        <h4>Add Staff</h4>
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
              <CFormSelect label="Role" name="role" value={formData.role} onChange={handleChange}>
                <option value="admin">Admin</option>

                <option value="manager">Manager</option>

                <option value="cashier">Cashier</option>

                <option value="staff">Staff</option>
              </CFormSelect>
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
            <CButton type="submit" color="primary">
              Save Staff
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default AddStaff
