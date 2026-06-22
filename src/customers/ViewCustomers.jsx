import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CFormInput,
  CRow,
  CCol,
} from '@coreui/react'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import axios from 'axios'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
const ViewCustomer = () => {
  const [customers, setCustomers] = useState([])

  const [search, setSearch] = useState('')

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const getCustomers = async () => {
    const token = localStorage.getItem('token')

    const response = await axios.get(`${API_URL}api/v1/customers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setCustomers(response.data.customers)
  }
  useEffect(() => {
    const fetchData = async () => {
      await getCustomers()
    }
    fetchData()
  }, [])

  const totalCustomers = customers.length

  const loyaltyCustomers = customers.filter((c) => c.loyaltyPoints > 0).length

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone?.includes(search) ||
      customer.email?.toLowerCase().includes(search.toLowerCase()) ||
      customer.LoyaltyCard?.cardNumber?.toLowerCase().includes(search.toLowerCase()),
  )

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(customers)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')

    XLSX.writeFile(workbook, 'Customers.xlsx')
  }

  const deleteCustomer = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Customer?',
      icon: 'warning',
      showCancelButton: true,
    })

    if (!result.isConfirmed) return

    const token = localStorage.getItem('token')

    await axios.delete(`${API_URL}api/v1/customers/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    getCustomers()
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol md={6}>
          <CCard>
            <CCardBody>
              <h6>Total Customers</h6>

              <h3>{totalCustomers}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={6}>
          <CCard>
            <CCardBody>
              <h6>Loyalty Customers</h6>

              <h3>{loyaltyCustomers}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CCard>
        <CCardHeader>Customers</CCardHeader>

        <CCardBody>
          <div className="d-flex gap-2 mb-3">
            <CFormInput
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <CButton onClick={exportExcel}>Export Excel</CButton>
          </div>

          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Phone</CTableHeaderCell>
                <CTableHeaderCell>Email</CTableHeaderCell>
                <CTableHeaderCell>Type</CTableHeaderCell>
                <CTableHeaderCell>Points</CTableHeaderCell>
                <CTableHeaderCell>Card Number</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Action</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {filteredCustomers.map((customer) => (
                <CTableRow key={customer.id}>
                  <CTableDataCell>{customer.fullname}</CTableDataCell>

                  <CTableDataCell>{customer.phone}</CTableDataCell>

                  <CTableDataCell>{customer.email}</CTableDataCell>

                  <CTableDataCell>
                    <span
                      className={`badge ${
                        customer.customerType === 'vip'
                          ? 'bg-warning'
                          : customer.customerType === 'corporate'
                            ? 'bg-info'
                            : 'bg-secondary'
                      }`}
                    >
                      {customer.customerType}
                    </span>
                  </CTableDataCell>

                  <CTableDataCell>{customer.loyaltyPoints || 0}</CTableDataCell>

                  <CTableDataCell>{customer.LoyaltyCard?.cardNumber || '-'}</CTableDataCell>

                  <CTableDataCell>
                    <span
                      className={`badge ${
                        customer.LoyaltyCard?.status === 'active' ? 'bg-success' : 'bg-danger'
                      }`}
                    >
                      {customer.LoyaltyCard?.status || '-'}
                    </span>
                  </CTableDataCell>

                  <CTableDataCell>
                    <Link to={`/editCustomer/${customer.id}`}>
                      <CButton size="sm" color="warning" className="me-2">
                        Edit
                      </CButton>
                    </Link>

                    <CButton size="sm" color="danger" onClick={() => deleteCustomer(customer.id)}>
                      Delete
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ViewCustomer
