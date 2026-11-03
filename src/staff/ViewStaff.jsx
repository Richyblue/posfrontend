
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

import CIcon from '@coreui/icons-react'
import { cilSearch, cilPencil, cilTrash } from '@coreui/icons'

import StaffIDCardModal from '../components/StaffIdCardModal'

import {
  CCard,
  CCardBody,
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

import { Link } from 'react-router-dom'

const ViewStaff = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [staffs, setStaffs] = useState([])
  const [staffMedia, setStaffMedia] = useState({})
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [employmentFilter, setEmploymentFilter] = useState('')
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [showIDCard, setShowIDCard] = useState(false)
  const [loading, setLoading] = useState(false)

  const getStaff = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      const response = await axios.get(
        `${API_URL}api/v1/staffs`,
        config
      )

      const staffList = response.data.staffs || []
      setStaffs(staffList)

      // Retrieve each staff member's photograph and signature.
      // The regular staff-list endpoint deliberately excludes BLOB data.
      const mediaResults = await Promise.all(
        staffList.map(async (staff) => {
          try {
            const { data } = await axios.get(
              `${API_URL}api/v1/staff/${staff.id}/media`,
              config
            )

            return [
              staff.id,
              {
                photo: data.photo || null,
                signature: data.signature || null,
              },
            ]
          } catch (error) {
            // Keep the staff list working if an image is unavailable
            // or the current user is not permitted to retrieve media.
            console.error(
              `Unable to load media for staff ${staff.id}:`,
              error.response?.data?.message || error.message
            )

            return [
              staff.id,
              {
                photo: null,
                signature: null,
              },
            ]
          }
        })
      )

      setStaffMedia(Object.fromEntries(mediaResults))

    } catch (error) {
      console.error(error)

      Swal.fire(
        'Error',
        error.response?.data?.message || 'Unable to load staff records',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getStaff()
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
        }
      )

      getStaff()

      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Staff removed',
      })
    } catch (error) {
      console.error(error)

      Swal.fire(
        'Error',
        error.response?.data?.message || 'Unable to delete staff',
        'error'
      )
    }
  }

  const filteredStaffs = staffs.filter((staff) => {
    const matchesSearch = staff.User?.fullname
      ?.toLowerCase()
      .includes(search.toLowerCase())

    const matchesRole = !roleFilter || staff.User?.role === roleFilter

    const matchesEmployment =
      !employmentFilter || staff.employmentType === employmentFilter

    return matchesSearch && matchesRole && matchesEmployment
  })

  const totalSalary = staffs.reduce(
    (total, staff) => total + Number(staff.salary || 0),
    0
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
        }
      )

      Swal.fire(
        'Success',
        `Staff ${action.toLowerCase()}d successfully.`,
        'success'
      )

      getStaff()

    } catch (error) {
      Swal.fire(
        'Error',
        error.response?.data?.message || 'Operation failed',
        'error'
      )
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
              <h3>
                {staffs.filter(
                  (staff) => staff.employmentType !== 'salary'
                ).length}
              </h3>
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
          <CFormSelect
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
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
            <option value="salary_and_commission">
              Salary + Commission
            </option>
          </CFormSelect>
        </CCol>
      </CRow>

      <CTable striped hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Photo</CTableHeaderCell>
            <CTableHeaderCell>Name</CTableHeaderCell>
            <CTableHeaderCell>Position</CTableHeaderCell>
            <CTableHeaderCell>Role</CTableHeaderCell>
            <CTableHeaderCell>Salary</CTableHeaderCell>
            <CTableHeaderCell>Commission</CTableHeaderCell>
            <CTableHeaderCell>Signature</CTableHeaderCell>
            <CTableHeaderCell>Status</CTableHeaderCell>
            <CTableHeaderCell>Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {loading && (
            <CTableRow>
              <CTableDataCell colSpan={9} className="text-center">
                Loading staff records...
              </CTableDataCell>
            </CTableRow>
          )}

          {!loading && filteredStaffs.length === 0 && (
            <CTableRow>
              <CTableDataCell colSpan={9} className="text-center">
                No staff records found.
              </CTableDataCell>
            </CTableRow>
          )}

          {!loading && filteredStaffs.map((staff) => {
            const media = staffMedia[staff.id]

            return (
              <CTableRow key={staff.id}>
                <CTableDataCell>
                  {media?.photo ? (
                    <img
                      src={media.photo}
                      alt={staff.User?.fullname || 'Staff'}
                      style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #ddd',
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle bg-body-secondary"
                      style={{
                        width: '45px',
                        height: '45px',
                      }}
                    >
                      <span className="small">N/A</span>
                    </div>
                  )}
                </CTableDataCell>

                <CTableDataCell>
                  {staff.User?.fullname}
                </CTableDataCell>

                <CTableDataCell>
                  {staff.position || '-'}
                </CTableDataCell>

                <CTableDataCell>
                  {staff.User?.role}
                </CTableDataCell>

                <CTableDataCell>
                  ₦{Number(staff.salary || 0).toLocaleString()}
                </CTableDataCell>

                <CTableDataCell>
                  {staff.commissionRate || 0}%
                </CTableDataCell>

                <CTableDataCell>
                  {media?.signature ? (
                    <CBadge color="success">Uploaded</CBadge>
                  ) : (
                    <CBadge color="secondary">Not uploaded</CBadge>
                  )}
                </CTableDataCell>

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
                  <div className="d-flex gap-1 flex-wrap">
                    <CButton
                      color="dark"
                      size="sm"
                      onClick={() => {
                        setSelectedStaff(staff)
                        setShowIDCard(true)
                      }}
                    >
                      ID Card
                    </CButton>

                    <Link to={`/editStaff/${staff.id}`}>
                      <CButton color="warning" size="sm">
                        <CIcon icon={cilPencil} />
                      </CButton>
                    </Link>

                    <CButton
                      size="sm"
                      color="danger"
                      onClick={() => deleteStaff(staff.id)}
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </div>
                </CTableDataCell>
              </CTableRow>
            )
          })}
        </CTableBody>
      </CTable>

      <StaffIDCardModal
        visible={showIDCard}
        onClose={() => {
          setShowIDCard(false)
          setSelectedStaff(null)
        }}
        staff={selectedStaff}
      />
    </>
  )
}

export default ViewStaff
