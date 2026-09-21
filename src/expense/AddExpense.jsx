import { useState } from 'react'
import axios from 'axios'

import { successAlert, errorAlert } from 'src/utils/alerts'

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
  CFormSelect,
} from '@coreui/react'

const AddExpense = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
  })

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // ==========================================
  // SUBMIT EXPENSE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.title.trim()) {
      errorAlert('Please enter the expense title')
      return
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      errorAlert('Please enter a valid expense amount')
      return
    }

    if (!formData.category) {
      errorAlert('Please select an expense category')
      return
    }

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}api/v1/expenses`,
        {
          title: formData.title.trim(),
          amount: Number(formData.amount),
          category: formData.category,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      successAlert(response.data?.message || 'Expense recorded successfully')

      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: '',
      })
    } catch (error) {
      console.error('CREATE EXPENSE ERROR:', error)

      errorAlert(error.response?.data?.message || 'Failed to create expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <CRow>
        <CCol xs={12}>
          <CCard className="shadow-sm border-0 mb-4">
            <CCardBody>
              <h3 className="fw-bold mb-1">Add Expense</h3>

              <p className="text-medium-emphasis mb-0">
                Record business expenses and operating costs.
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ==========================================
          EXPENSE FORM
      ========================================== */}

      <CRow>
        <CCol xs={12} lg={8} xl={7}>
          <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-transparent fw-bold">Expense Details</CCardHeader>

            <CCardBody>
              <CForm onSubmit={handleSubmit}>
                <CRow className="g-3">
                  {/* EXPENSE TITLE */}

                  <CCol xs={12}>
                    <CFormLabel className="fw-semibold">Expense Title</CFormLabel>

                    <CFormInput
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Electricity Bill"
                      autoComplete="off"
                      required
                    />
                  </CCol>

                  {/* AMOUNT */}

                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold">Amount</CFormLabel>

                    <CFormInput
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </CCol>

                  {/* CATEGORY */}

                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold">Category</CFormLabel>

                    <CFormSelect
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
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

                {/* SUBMIT */}

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
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default AddExpense
