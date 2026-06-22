import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormSelect,
  CButton,
  CRow,
  CCol,
} from '@coreui/react'

const CreateCustomer = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [fullname, setFullname] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [customerType, setCustomerType] = useState('regular')

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('token')

      await axios.post(
        `${API_URL}api/v1/customers`,
        {
          fullname,
          phone,
          email,
          address,
          gender,
          dateOfBirth,
          customerType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire('Success', 'Customer and Loyalty Card created successfully', 'success')

      setFullname('')
      setPhone('')
      setEmail('')
      setAddress('')
      setGender('')
      setDateOfBirth('')
      setCustomerType('regular')
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed', 'error')
    }
  }

  return (
    <CCard>
      <CCardHeader>Create Customer</CCardHeader>

      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={4}>
              <CFormInput
                label="Full Name"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </CCol>

            <CCol md={4}>
              <CFormInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </CCol>

            <CCol md={4}>
              <CFormInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={6}>
              <CFormInput
                label="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </CCol>

            <CCol md={3}>
              <CFormSelect
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormInput
                type="date"
                label="Date Of Birth"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </CCol>
          </CRow>

          <CRow className="mt-3">
            <CCol md={4}>
              <CFormSelect
                label="Customer Type"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="corporate">Corporate</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CButton className="mt-4" type="submit" color="primary">
            Save Customer
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default CreateCustomer
