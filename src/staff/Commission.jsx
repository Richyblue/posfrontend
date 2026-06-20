import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CSpinner,
} from '@coreui/react'

import { useState, useEffect } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'

import * as XLSX from 'xlsx'
const Commission = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [commissions, setCommissions] = useState([])

  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState('')

  const [monthFilter, setMonthFilter] = useState('')

  const [yearFilter, setYearFilter] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('')
  const [staffs, setStaffs] = useState([])

  const getCommissions = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/commissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setCommissions(response.data.commissions)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await getCommissions()
    }
    fetchData()
  }, [])

  const getStaffs = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/staffs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setStaffs(response.data.staffs)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    getCommissions()

    getStaffs()
  }, [])

  const filteredCommissions = selectedStaff
    ? commissions.filter((item) => item.StaffId == selectedStaff)
    : commissions

  const totalCommission = filteredCommissions.reduce(
    (sum, item) => sum + Number(item.commissionAmount || 0),
    0,
  )

  const pendingCommission = filteredCommissions.reduce(
    (sum, item) => (item.status === 'pending' ? sum + Number(item.commissionAmount || 0) : sum),
    0,
  )

  const paidCommission = filteredCommissions.reduce(
    (sum, item) => (item.status === 'paid' ? sum + Number(item.commissionAmount || 0) : sum),
    0,
  )
  const filtered = commissions.filter((commission) => {
    const staffName = commission.Staff?.User?.fullname || ''

    const searchMatch = staffName.toLowerCase().includes(search.toLowerCase())

    const statusMatch = statusFilter === '' ? true : commission.status === statusFilter

    const date = new Date(commission.commissionDate)

    const monthMatch = monthFilter === '' ? true : date.getMonth() + 1 === Number(monthFilter)

    const yearMatch = yearFilter === '' ? true : date.getFullYear() === Number(yearFilter)

    return searchMatch && statusMatch && monthMatch && yearMatch
  })

  const markPaid = async (id) => {
    const result = await Swal.fire({
      title: 'Mark as Paid?',
      icon: 'question',
      showCancelButton: true,
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}api/v1/commissions/${id}/pay`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire('Success', 'Commission paid', 'success')

      getCommissions()
    } catch (error) {
      Swal.fire('Error', 'Failed', 'error')
    }
  }

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filtered.map((item) => ({
        Staff: item.Staff?.User?.fullname,

        Amount: item.commissionAmount,

        Rate: item.commissionRate,

        Date: item.commissionDate,

        Status: item.status,
      })),
    )

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commissions')

    XLSX.writeFile(workbook, 'CommissionReport.xlsx')
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Total Commission</h6>
              <h3>₦{totalCommission.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Pending</h6>
              <h3>₦{pendingCommission.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Paid</h6>
              <h3>₦{paidCommission.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CCard>
        <CCardHeader>Staff Commissions</CCardHeader>

        <CCardBody>
          <div className="d-flex gap-2 mb-3">
            <CFormSelect value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
              <option value="">All Staff</option>

              {staffs.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.User?.fullname}
                </option>
              ))}
            </CFormSelect>

            <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>

              <option value="pending">Pending</option>

              <option value="paid">Paid</option>
            </CFormSelect>

            <CButton onClick={exportExcel}>Export Excel</CButton>
          </div>

          <CTable hover responsive bordered>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Staff</CTableHeaderCell>

                <CTableHeaderCell>Rate %</CTableHeaderCell>

                <CTableHeaderCell>Amount</CTableHeaderCell>

                <CTableHeaderCell>Date</CTableHeaderCell>

                <CTableHeaderCell>Status</CTableHeaderCell>

                <CTableHeaderCell>Action</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {filteredCommissions.map((item) => (
                <CTableRow key={item.id}>
                  <CTableDataCell>{item.Staff?.User?.fullname}</CTableDataCell>

                  <CTableDataCell>{item.commissionRate}%</CTableDataCell>

                  <CTableDataCell>₦{Number(item.commissionAmount).toLocaleString()}</CTableDataCell>

                  <CTableDataCell>{item.commissionDate}</CTableDataCell>

                  <CTableDataCell>
                    <CBadge color={item.status === 'paid' ? 'success' : 'warning'}>
                      {item.status}
                    </CBadge>
                  </CTableDataCell>

                  <CTableDataCell>
                    {item.status === 'pending' && (
                      <CButton size="sm" color="success" onClick={() => markPaid(item.id)}>
                        Mark Paid
                      </CButton>
                    )}
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

export default Commission
