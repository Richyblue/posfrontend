import {
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableRow,
  CTableHead,
  CTableHeaderCell,
  CTableDataCell,
  CButton,
  CFormInput,
} from '@coreui/react'

import { useState, useEffect } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'

import * as XLSX from 'xlsx'
import { Link } from 'react-router-dom'
const ViewService = () => {
  const [services, setServices] = useState([])

  const [search, setSearch] = useState('')

  const API_URL = import.meta.env.VITE_BACKEND_URL

  const getServices = async () => {
    const token = localStorage.getItem('token')

    const response = await axios.get(`${API_URL}api/v1/servicess`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    setServices(response.data.services)
  }
  useEffect(() => {
    const fetchData = async () => {
      await getServices()
    }
    fetchData()
  }, [])

  //   Delete

  const deleteService = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Service?',
      icon: 'warning',
      showCancelButton: true,
    })

    if (!result.isConfirmed) return

    const token = localStorage.getItem('token')

    await axios.delete(`${API_URL}api/v1/services/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    getServices()
  }

  // Expote

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(services)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Services')

    XLSX.writeFile(workbook, 'Services.xlsx')
  }

  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <CCard>
      <CCardHeader>Services</CCardHeader>

      <CCardBody>
        <div className="d-flex gap-2 mb-3">
          <CFormInput
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <CButton onClick={exportExcel}>Export Excel</CButton>
        </div>

        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Name</CTableHeaderCell>

              <CTableHeaderCell>Price</CTableHeaderCell>

              <CTableHeaderCell>Duration</CTableHeaderCell>

              <CTableHeaderCell>Action</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {filtered.map((service) => (
              <CTableRow key={service.id}>
                <CTableDataCell>{service.name}</CTableDataCell>

                <CTableDataCell>₦{Number(service.price).toLocaleString()}</CTableDataCell>

                <CTableDataCell>
                  {service.duration}
                  mins
                </CTableDataCell>

                <CTableDataCell>
                  <Link to={`/editService/${service.id}`}>
                    <CButton size="sm" color="warning" className="me-2">
                      Edit
                    </CButton>
                  </Link>

                  <CButton size="sm" color="danger" onClick={() => deleteService(service.id)}>
                    Delete
                  </CButton>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}
export default ViewService
