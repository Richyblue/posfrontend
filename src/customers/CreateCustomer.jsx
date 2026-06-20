import { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CButton,
  CRow,
  CCol,
} from '@coreui/react'

const CreateCustomer = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [fullname, setFullname] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

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
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire('Success', 'Customer created successfully', 'success')

      setFullname('')
      setPhone('')
      setEmail('')
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
              />
            </CCol>

            <CCol md={4}>
              <CFormInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </CCol>

            <CCol md={4}>
              <CFormInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </CCol>
          </CRow>

          <CButton className="mt-3" type="submit">
            Save Customer
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default CreateCustomer
