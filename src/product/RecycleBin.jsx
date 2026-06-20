import React, { useEffect, useState } from 'react'

import axios from 'axios'

import CIcon from '@coreui/icons-react'

import { cilRecycle, cilTrash, cilSearch } from '@coreui/icons'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CBadge,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CSpinner,
} from '@coreui/react'

const RecycleBin = () => {
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const getDeletedProducts = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      console.log(token)
      const response = await axios.get(
        `${API_URL}api/v1/products/recycle-bin`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setProducts(response.data.products)
    } catch (error) {
      console.log('STATUS:', error.response?.status)

      console.log('DATA:', error.response?.data)

      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getDeletedProducts()
    }
    fetchData()
  }, [])

  const restoreProduct = async (id) => {
    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `http://localhost:9000/api/v1/products/restore/${id}`,

        {},

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      getDeletedProducts()
    } catch (error) {
      console.error(error)
    }
  }

  const deleteForever = async (id) => {
    if (!window.confirm('Permanently delete product?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')

      await axios.delete(
        `http://localhost:9000/api/v1/products/permanent/${id}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      getDeletedProducts()
    } catch (error) {
      console.error(error)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      {/* HEADER */}

      <CCard className="shadow-sm border-0 mb-4">
        <CCardBody>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3>Recycle Bin</h3>

              <p className="text-medium-emphasis mb-0">
                Restore or permanently remove deleted products
              </p>
            </div>

            <CBadge color="warning" className="p-2">
              {products.length}
              Deleted Products
            </CBadge>
          </div>
        </CCardBody>
      </CCard>

      {/* STATS */}

      <CRow className="mb-4">
        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Deleted Products</h6>

              <h3>{products.length}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Recoverable</h6>

              <h3>{products.length}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Inventory Value</h6>

              <h5>
                ₦
                {products
                  .reduce(
                    (total, product) =>
                      total + Number(product.costPrice) * Number(product.quantity),

                    0,
                  )
                  .toLocaleString()}
              </h5>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* SEARCH */}

      <CCard className="shadow-sm">
        <CCardHeader>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>

            <CFormInput
              placeholder="Search deleted products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CInputGroup>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner />
            </div>
          ) : (
            <CTable hover striped responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Product</CTableHeaderCell>

                  <CTableHeaderCell>SKU</CTableHeaderCell>

                  <CTableHeaderCell>Quantity</CTableHeaderCell>

                  <CTableHeaderCell>Deleted Date</CTableHeaderCell>

                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredProducts.map((product) => (
                  <CTableRow key={product.id}>
                    <CTableDataCell>{product.name}</CTableDataCell>

                    <CTableDataCell>{product.sku}</CTableDataCell>

                    <CTableDataCell>{product.quantity}</CTableDataCell>

                    <CTableDataCell>{product.deletedAt?.split('T')[0]}</CTableDataCell>

                    <CTableDataCell>
                      <CButton
                        color="success"
                        size="sm"
                        className="me-2"
                        onClick={() => restoreProduct(product.id)}
                      >
                        <CIcon icon={cilRecycle} />
                      </CButton>

                      <CButton color="danger" size="sm" onClick={() => deleteForever(product.id)}>
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>
    </>
  )
}

export default RecycleBin
