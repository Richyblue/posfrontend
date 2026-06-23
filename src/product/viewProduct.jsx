import React, { useEffect, useState } from 'react'

import axios from 'axios'

import * as XLSX from 'xlsx'

import { saveAs } from 'file-saver'
import Swal from 'sweetalert2'

import CIcon from '@coreui/icons-react'
import { successAlert } from 'src/utils/alerts'
import { errorAlert } from 'src/utils/alerts'

import { cilPencil, cilTrash, cilCloudDownload, cilSearch } from '@coreui/icons'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CPagination,
  CPaginationItem,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
import { Link } from 'react-router-dom'

const ProductList = () => {
  const [products, setProducts] = useState([])

  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')

  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const getProducts = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setProducts(response.data.products || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getProducts()
    }
    fetchData()
  }, [])

  const deleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: 'The product will be moved to Recycle Bin.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Delete',
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}api/v1/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Product moved to Recycle Bin',
        timer: 2000,
        showConfirmButton: false,
      })

      getProducts()
    } catch (error) {
      console.error(error)

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Failed to delete product',
      })
    }
  }
  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(search.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,

    currentPage * itemsPerPage,
  )

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredProducts.map((product) => ({
        Name: product.name,

        SKU: product.sku,

        Barcode: product.barcode,

        CostPrice: product.costPrice,

        SellingPrice: product.sellingPrice,

        Quantity: product.quantity,

        Status: product.status,
      })),
    )

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const file = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    })

    saveAs(file, `Products.xlsx`)
  }

  return (
    <>
      <CCard className="shadow-sm border-0">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Product Inventory</h4>

            <small className="text-medium-emphasis">Manage all products</small>
          </div>
          <CCardBody>
            <CRow className="mb-4">
              <CCol md={3}>
                <CCard className="shadow-sm">
                  <CCardBody>
                    <h6>Total Products</h6>
                    <h3>{products.length}</h3>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol md={3}>
                <CCard className="shadow-sm">
                  <CCardBody>
                    <h6>Active Products</h6>
                    <h3>{products.filter((p) => p.status === 'active').length}</h3>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol md={3}>
                <CCard className="shadow-sm">
                  <CCardBody>
                    <h6>Low Stock</h6>
                    <h3>{products.filter((p) => p.quantity <= p.reorderLevel).length}</h3>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol md={3}>
                <CCard className="shadow-sm">
                  <CCardBody>
                    <h6>Inventory Value</h6>
                    <h5>
                      ₦
                      {products
                        .reduce((sum, p) => sum + Number(p.costPrice) * Number(p.quantity), 0)
                        .toLocaleString()}
                    </h5>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </CCardBody>
        </CCardHeader>
        <CCardBody>
          <CButton color="success ml-3 mr-3" onClick={exportToExcel}>
            <CIcon icon={cilCloudDownload} className="me-2" />
            Export Excel
          </CButton>
          <CButton
            color="warning"
            className="me-2"
            onClick={() => {
              setProducts(products.filter((p) => p.quantity <= p.reorderLevel))
            }}
          >
            Low Stock
          </CButton>
        </CCardBody>
        <CCardBody>
          <CRow className="mb-3">
            <CCol md={4}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>

                <CFormInput
                  placeholder="Search product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>

            <CCol md={8} className="text-end">
              <CBadge color="primary">Total Products: {filteredProducts.length}</CBadge>
            </CCol>
          </CRow>

          {loading ? (
            <div className="text-center py-5">
              <CSpinner />
            </div>
          ) : (
            <CTable hover responsive striped align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Image</CTableHeaderCell>

                  <CTableHeaderCell>Product</CTableHeaderCell>

                  <CTableHeaderCell>SKU</CTableHeaderCell>

                  <CTableHeaderCell>Price</CTableHeaderCell>

                  <CTableHeaderCell>Stock</CTableHeaderCell>

                  <CTableHeaderCell>Status</CTableHeaderCell>

                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {currentProducts.map((product) => (
                  <CTableRow key={product.id}>
                    <CTableDataCell>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          width="50"
                          height="50"
                          style={{
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                      ) : (
                        'No Image'
                      )}
                    </CTableDataCell>

                    <CTableDataCell>{product.name}</CTableDataCell>

                    <CTableDataCell>{product.sku}</CTableDataCell>

                    <CTableDataCell>
                      ₦{Number(product.sellingPrice).toLocaleString()}
                    </CTableDataCell>

                    <CTableDataCell>
                      <CBadge
                        color={product.quantity <= product.reorderLevel ? 'warning' : 'success'}
                      >
                        {product.quantity}
                      </CBadge>
                    </CTableDataCell>

                    <CTableDataCell>
                      <CBadge color={product.status === 'active' ? 'success' : 'danger'}>
                        {product.status}
                      </CBadge>
                    </CTableDataCell>

                    <CTableDataCell>
                      <Link to={`/editProduct/${product.id}`}>
                        <CButton size="sm" color="warning" className="me-2">
                          <CIcon icon={cilPencil} />
                        </CButton>
                      </Link>

                      <CButton
                        size="sm"
                        color="danger"
                        onClick={() => {
                          deleteProduct(product.id)
                        }}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}

          <div className="d-flex justify-content-end mt-3">
            <CPagination>
              {[...Array(totalPages)].map((_, index) => (
                <CPaginationItem
                  key={index}
                  active={currentPage === index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </CPaginationItem>
              ))}
            </CPagination>
          </div>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ProductList
