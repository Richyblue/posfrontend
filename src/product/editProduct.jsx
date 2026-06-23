import React, { useEffect, useState } from 'react'

import { useNavigate, useParams } from 'react-router-dom'

import axios from 'axios'

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

import { successAlert, errorAlert } from 'src/utils/alerts'

const EditProduct = () => {
  const { id } = useParams()

  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)

  const [fetching, setFetching] = useState(true)

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

  //   useEffect(() => {
  //     getProduct()
  //   }, [])

  const getProduct = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const product = response.data.product

      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        costPrice: product.costPrice || '',
        sellingPrice: product.sellingPrice || '',
        quantity: product.quantity || '',
        reorderLevel: product.reorderLevel || 5,
        status: product.status || 'active',
        image: null,
      })
    } catch (error) {
      errorAlert('Failed to load product')
    } finally {
      setFetching(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getProduct()
    }
    fetchData()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
        if (formData[key] !== null) {
          payload.append(key, formData[key])
        }
      })

      const response = await axios.put(`${API_URL}api/v1/products/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      successAlert(response.data.message)

      navigate('/view-products')
    } catch (error) {
      console.error(error)

      errorAlert(error.response?.data?.message || 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="text-center">
        <CSpinner />
      </div>
    )
  }

  return (
    <CForm onSubmit={handleSubmit}>
      <CCard className="shadow-sm border-0">
        <CCardHeader>Edit Product</CCardHeader>

        <CCardBody>
          <CRow>
            <CCol md={6}>
              <CFormLabel>Product Name</CFormLabel>

              <CFormInput name="name" value={formData.name} onChange={handleChange} />
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

          <hr />

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

          <hr />

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

          <hr />

          <CFormInput type="file" accept="image/*" onChange={handleImageChange} />

          <hr />

          <CFormSelect name="status" value={formData.status} onChange={handleChange}>
            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </CFormSelect>

          <div className="mt-4 text-end">
            <CButton color="primary" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Product'}
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </CForm>
  )
}

export default EditProduct
