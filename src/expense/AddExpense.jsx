import { useState } from 'react'
import axios from 'axios'
import { successAlert } from 'src/utils/alerts'
import { errorAlert } from 'src/utils/alerts'

import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CSpinner,
  CAlert,
  CFormSelect,
} from '@coreui/react'

const AddExpense = () => {
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.post('http://localhost:9000/api/v1/expenses', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      successAlert(response.data.message)

      setFormData({
        title: '',
        amount: '',
        category: '',
      })
    } catch (error) {
      console.error(error)

      errorAlert(error.response?.data?.message || 'Failed to create expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CRow>
        <CCol md={12}>
          <CCard className="shadow-sm border-0 mb-4">
            <CCardBody>
              <h3>Add Expense</h3>

              <p className="text-medium-emphasis">Record business expenses and operating costs.</p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CForm onSubmit={handleSubmit}>
        <CCard className="shadow-sm">
          <CCardHeader>Expense Details</CCardHeader>

          <CCardBody>
            <CRow>
              <CCol md={6}>
                <CFormLabel>Expense Title</CFormLabel>

                <CFormInput
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g Electricity Bill"
                  required
                />
              </CCol>

              <CCol md={6}>
                <CFormLabel>Amount</CFormLabel>

                <CFormInput
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </CCol>

              <CCol md={12} className="mt-3">
                <CFormLabel>Category</CFormLabel>

                <CFormSelect name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Select Category</option>

                  <option value="Rent">Rent</option>

                  <option value="Utilities">Utilities</option>

                  <option value="Salary">Salary</option>

                  <option value="Fuel">Fuel</option>

                  <option value="Maintenance">Maintenance</option>

                  <option value="Marketing">Marketing</option>

                  <option value="Supplies">Supplies</option>

                  <option value="Others">Others</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <div className="d-flex justify-content-end mt-4">
              <CButton color="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Expense'
                )}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      </CForm>
    </>
  )
}

export default AddExpense
