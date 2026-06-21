import React, { useState } from 'react'
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
  CFormSelect,
  CButton,
  CInputGroup,
  CInputGroupText,
  CAlert,
  CSpinner,
} from '@coreui/react'

const AddProduct = () => {
  const [loading, setLoading] = useState(false)
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    reorderLevel: 5,
    status: 'active',
    image: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }))
  }

  const profit = Number(formData.sellingPrice || 0) - Number(formData.costPrice || 0)

  const profitMargin =
    Number(formData.costPrice) > 0 ? ((profit / Number(formData.costPrice)) * 100).toFixed(2) : 0

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const payload = new FormData()

      Object.keys(formData).forEach((key) => {
        payload.append(key, formData[key])
      })

      const response = await axios.post(`${API_URL}api/v1/products`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      successAlert(response.data.message)

      setFormData({
        name: '',
        sku: '',
        barcode: '',
        costPrice: '',
        sellingPrice: '',
        quantity: '',
        reorderLevel: 5,
        status: 'active',
        image: null,
      })
    } catch (error) {
      console.error(error)

      errorAlert(error.response?.data?.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CRow>
        <CCol md={12}>
          <CCard className="mb-4 shadow-sm border-0">
            <CCardBody>
              <h3>Add New Product</h3>

              <p className="text-medium-emphasis">Create and manage inventory products.</p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CForm onSubmit={handleSubmit}>
        <CRow>
          {/* PRODUCT INFORMATION */}

          <CCol md={12}>
            <CCard className="mb-4 shadow-sm">
              <CCardHeader>Product Information</CCardHeader>

              <CCardBody>
                <CRow>
                  <CCol md={6}>
                    <CFormLabel>Product Name</CFormLabel>

                    <CFormInput
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>SKU</CFormLabel>

                    <CFormInput name="sku" value={formData.sku} onChange={handleChange} />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Barcode</CFormLabel>

                    <CFormInput name="barcode" value={formData.barcode} onChange={handleChange} />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>

          {/* PRICING */}

          <CCol md={12}>
            <CCard className="mb-4 shadow-sm">
              <CCardHeader>Pricing</CCardHeader>

              <CCardBody>
                <CRow>
                  <CCol md={6}>
                    <CFormLabel>Cost Price</CFormLabel>

                    <CInputGroup>
                      <CInputGroupText>₦</CInputGroupText>

                      <CFormInput
                        type="number"
                        name="costPrice"
                        value={formData.costPrice}
                        onChange={handleChange}
                      />
                    </CInputGroup>
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel>Selling Price</CFormLabel>

                    <CInputGroup>
                      <CInputGroupText>₦</CInputGroupText>

                      <CFormInput
                        type="number"
                        name="sellingPrice"
                        value={formData.sellingPrice}
                        onChange={handleChange}
                      />
                    </CInputGroup>
                  </CCol>
                </CRow>

                <CAlert color="success" className="mt-3">
                  Profit: ₦{profit.toLocaleString()}
                  <br />
                  Margin:
                  {profitMargin}%
                </CAlert>
              </CCardBody>
            </CCard>
          </CCol>

          {/* INVENTORY */}

          <CCol md={12}>
            <CCard className="mb-4 shadow-sm">
              <CCardHeader>Inventory</CCardHeader>

              <CCardBody>
                <CRow>
                  <CCol md={6}>
                    <CFormLabel>Quantity</CFormLabel>

                    <CFormInput
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel>Reorder Level</CFormLabel>

                    <CFormInput
                      type="number"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                    />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </CCol>

          {/* IMAGE */}

          <CCol md={12}>
            <CCard className="mb-4 shadow-sm">
              <CCardHeader>Product Image</CCardHeader>

              <CCardBody>
                <CFormInput type="file" accept="image/*" onChange={handleImageChange} />
              </CCardBody>
            </CCard>
          </CCol>

          {/* STATUS */}

          <CCol md={12}>
            <CCard className="mb-4 shadow-sm">
              <CCardHeader>Status</CCardHeader>

              <CCardBody>
                <CFormSelect name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Active</option>

                  <option value="inactive">Inactive</option>
                </CFormSelect>
              </CCardBody>
            </CCard>
          </CCol>

          {/* ACTIONS */}

          <CCol md={12}>
            <div className="d-flex justify-content-end gap-2">
              <CButton color="secondary" type="button">
                Cancel
              </CButton>

              <CButton color="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Product'
                )}
              </CButton>
            </div>
          </CCol>
        </CRow>
      </CForm>
    </>
  )
}

export default AddProduct
