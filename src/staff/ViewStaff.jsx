import React, { useEffect, useState } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'

import CIcon from '@coreui/icons-react'

import { cilSearch, cilPencil, cilTrash } from '@coreui/icons'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CFormInput,
  CFormSelect,
  CButton,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react'

const ViewStaff = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [staffs, setStaffs] = useState([])

  const [search, setSearch] = useState('')

  const [roleFilter, setRoleFilter] = useState('')

  const [employmentFilter, setEmploymentFilter] = useState('')

  const getStaff = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `${API_URL}api/v1/staffs`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setStaffs(response.data.staffs)
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getStaff()
    }
    fetchData()
  }, [])

  const deleteStaff = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Staff?',

      text: 'This action cannot be undone',

      icon: 'warning',

      showCancelButton: true,
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      await axios.delete(
        `${API_URL}/staff/${id}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      getStaff()

      Swal.fire({
        icon: 'success',

        title: 'Deleted',

        text: 'Staff removed',
      })
    } catch (error) {
      console.error(error)
    }
  }

  const filteredStaffs = staffs.filter((staff) => {
    const matchesSearch = staff.User?.fullname?.toLowerCase().includes(search.toLowerCase())

    const matchesRole = !roleFilter || staff.User?.role === roleFilter

    const matchesEmployment = !employmentFilter || staff.employmentType === employmentFilter

    return matchesSearch && matchesRole && matchesEmployment
  })

  const totalSalary = staffs.reduce(
    (total, staff) => total + Number(staff.salary),

    0,
  )

  const toggleStaffStatus = async (staff) => {
    const action = staff.User.isActive ? 'Deactivate' : 'Activate'

    const result = await Swal.fire({
      title: `${action} Staff?`,
      text: `Are you sure you want to ${action.toLowerCase()} this staff account?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: action,
    })

    if (!result.isConfirmed) return

    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}api/v1/staff/${staff.id}/status`,
        {
          isActive: !staff.User.isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire('Success', `Staff ${action.toLowerCase()}d successfully.`, 'success')

      getStaff()
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Total Staff</h6>

              <h3>{staffs.length}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Payroll</h6>

              <h3>₦{totalSalary.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Commission Staff</h6>

              <h3>{staffs.filter((s) => s.employmentType !== 'salary').length}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-3">
        <CCol md={4}>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>

            <CFormInput
              placeholder="Search Staff"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CInputGroup>
        </CCol>

        <CCol md={4}>
          <CFormSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>

            <option value="admin">Admin</option>

            <option value="manager">Manager</option>

            <option value="cashier">Cashier</option>

            <option value="staff">Staff</option>
          </CFormSelect>
        </CCol>

        <CCol md={4}>
          <CFormSelect
            value={employmentFilter}
            onChange={(e) => setEmploymentFilter(e.target.value)}
          >
            <option value="">Employment Type</option>

            <option value="salary">Salary</option>

            <option value="commission">Commission</option>

            <option value="salary_and_commission">Salary + Commission</option>
          </CFormSelect>
        </CCol>
      </CRow>

      <CTable striped hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Name</CTableHeaderCell>

            <CTableHeaderCell>Position</CTableHeaderCell>

            <CTableHeaderCell>Role</CTableHeaderCell>

            <CTableHeaderCell>Salary</CTableHeaderCell>

            <CTableHeaderCell>Commission</CTableHeaderCell>

            <CTableHeaderCell>Status</CTableHeaderCell>

            <CTableHeaderCell>Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {filteredStaffs.map((staff) => (
            <CTableRow key={staff.id}>
              <CTableDataCell>{staff.User?.fullname}</CTableDataCell>

              <CTableDataCell>{staff.position}</CTableDataCell>

              <CTableDataCell>{staff.User?.role}</CTableDataCell>

              <CTableDataCell>₦{Number(staff.salary).toLocaleString()}</CTableDataCell>

              <CTableDataCell>{staff.commissionRate}%</CTableDataCell>

              <CTableDataCell>
                <CButton
                  color={staff.User?.isActive ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => toggleStaffStatus(staff)}
                >
                  {staff.User?.isActive ? 'Deactivate' : 'Activate'}
                </CButton>
              </CTableDataCell>

              <CTableDataCell>
                <Link to={`/editStaff/${staff.id}`}>
                  <CButton color="warning" size="sm">
                    <CIcon icon={cilPencil} />
                  </CButton>
                </Link>

                <CButton size="sm" color="danger" onClick={() => deleteStaff(staff.id)}>
                  <CIcon icon={cilTrash} />
                </CButton>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </>
  )
}

export default ViewStaff
