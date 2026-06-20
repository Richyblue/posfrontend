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

const CreateService = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [name, setName] = useState('')

  const [price, setPrice] = useState('')

  const [duration, setDuration] = useState('')

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      await axios.post(
        `${API_URL}api/v1/services`,
        {
          name,
          price,
          duration,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Service created successfully',
      })

      setName('')
      setPrice('')
      setDuration('')
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard>
      <CCardHeader>Create Service</CCardHeader>

      <CCardBody>
        <CForm onSubmit={handleSubmit}>
          <CRow>
            <CCol md={6}>
              <CFormInput
                label="Service Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </CCol>

            <CCol md={3}>
              <CFormInput
                type="number"
                label="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </CCol>

            <CCol md={3}>
              <CFormInput
                type="number"
                label="Duration (mins)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </CCol>
          </CRow>

          <CButton className="mt-3" type="submit" disabled={loading}>
            Save Service
          </CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default CreateService
