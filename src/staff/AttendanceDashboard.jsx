import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import {
  cilPeople,
  cilClock,
  cilWarning,
  cilUserFollow,
  cilUserUnfollow,
  cilHistory,
  cilSpeedometer,
  cilReload,
  cilArrowRight,
} from '@coreui/icons'

const AttendanceDashboard = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL
  const [kpis, setKpis] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [activities, setActivities] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedStaff, setSelectedStaff] = useState(null)

  const [showDetails, setShowDetails] = useState(false)

  // =====================================================
  // FETCH DASHBOARD
  // =====================================================

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const token = localStorage.getItem('token')

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [kpiResponse, attendanceResponse, activityResponse] = await Promise.all([
        axios.get(`${API_URL}api/v1/attendance/dashboard`, { headers }),

        axios.get(`${API_URL}api/v1/attendance/today`, { headers }),

        axios.get(`${API_URL}api/v1/attendance/activities?limit=50`, { headers }),
      ])

      setKpis(kpiResponse.data.data)

      setAttendance(attendanceResponse.data.data || [])

      setActivities(activityResponse.data.data || [])
    } catch (err) {
      console.error('ATTENDANCE DASHBOARD ERROR:', err)

      setError(err.response?.data?.message || 'Unable to load attendance dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])
  useEffect(() => {
    const fetchData = async () => {
      await fetchDashboard()
    }
    fetchData()
  }, [fetchDashboard])

  // =====================================================
  // FILTER ATTENDANCE
  // =====================================================

  const filteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      const fullname = item.Staff?.User?.fullname || ''

      const position = item.Staff?.position || ''

      const searchValue = search.toLowerCase()

      const matchesSearch =
        fullname.toLowerCase().includes(searchValue) || position.toLowerCase().includes(searchValue)

      const status = item.status || ''

      const matchesStatus = statusFilter === 'all' || statusFilter === status

      return matchesSearch && matchesStatus
    })
  }, [attendance, search, statusFilter])

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) return '--'

    return new Date(date).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDateTime = (date) => {
    if (!date) return '--'

    return new Date(date).toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <CBadge color="success">Present</CBadge>

      case 'late':
        return <CBadge color="warning">Late</CBadge>

      case 'absent':
        return <CBadge color="danger">Absent</CBadge>

      default:
        return <CBadge color="secondary">{status || 'Unknown'}</CBadge>
    }
  }

  // =====================================================
  // LIVE STAFF STATUS
  // =====================================================

  const getLiveStatus = (item) => {
    if (item.clockOut) {
      return {
        label: 'Clocked Out',
        color: 'secondary',
      }
    }

    const outside = activities.find(
      (activity) => activity.recordId === item.id && activity.action === 'GO_OUT',
    )

    if (outside) {
      return {
        label: 'Outside',
        color: 'warning',
      }
    }

    if (item.clockIn) {
      return {
        label: 'Working',
        color: 'success',
      }
    }

    return {
      label: 'Not Clocked In',
      color: 'danger',
    }
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          minHeight: '500px',
        }}
      >
        <div className="text-center">
          <CSpinner
            color="primary"
            style={{
              width: 45,
              height: 45,
            }}
          />

          <div className="mt-3 text-muted">Loading attendance dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '10px 5px 40px',
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Attendance Overview</h3>

          <div className="text-medium-emphasis">
            Monitor today's staff attendance and activities
          </div>
        </div>

        <CButton color="light" onClick={() => fetchDashboard(true)} disabled={refreshing}>
          {refreshing ? (
            <CSpinner size="sm" className="me-2" />
          ) : (
            <CIcon icon={cilReload} className="me-2" />
          )}
          Refresh
        </CButton>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <CRow className="g-4 mb-4">
        {/* PRESENT */}

        <CCol sm={6} xl={3}>
          <KpiCard
            title="Present Today"
            value={kpis?.presentToday ?? 0}
            subtitle="Staff clocked in"
            icon={cilUserFollow}
            color="success"
          />
        </CCol>

        {/* LATE */}

        <CCol sm={6} xl={3}>
          <KpiCard
            title="Late Today"
            value={kpis?.lateToday ?? 0}
            subtitle="Needs attention"
            icon={cilWarning}
            color="warning"
          />
        </CCol>

        {/* ABSENT */}

        <CCol sm={6} xl={3}>
          <KpiCard
            title="Absent Today"
            value={kpis?.absentToday ?? 0}
            subtitle="Not clocked in"
            icon={cilUserUnfollow}
            color="danger"
          />
        </CCol>

        {/* OUTSIDE */}

        <CCol sm={6} xl={3}>
          <KpiCard
            title="Currently Outside"
            value={kpis?.currentlyOutside ?? 0}
            subtitle="Away from salon"
            icon={cilPeople}
            color="warning"
          />
        </CCol>

        {/* CLOCKED OUT */}

        <CCol sm={6} xl={3}>
          <KpiCard
            title="Clocked Out"
            value={kpis?.clockedOutToday ?? 0}
            subtitle="Completed today"
            icon={cilUserUnfollow}
            color="info"
          />
        </CCol>

        {/* AVG HOURS */}

        <CCol sm={6} xl={3}>
          <KpiCard
            title="Average Hours"
            value={`${kpis?.averageWorkingHours ?? 0}h`}
            subtitle="Today's average"
            icon={cilClock}
            color="primary"
          />
        </CCol>

        {/* OVERTIME */}

        <CCol sm={6} xl={3}>
          <KpiCard
            title="Overtime"
            value={`${kpis?.overtimeHours ?? 0}h`}
            subtitle="Total overtime"
            icon={cilSpeedometer}
            color="dark"
          />
        </CCol>
      </CRow>

      {/* =================================================
          ATTENDANCE TABLE
      ================================================= */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-white border-0 py-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h5 className="fw-bold mb-1">Today's Attendance</h5>

              <small className="text-muted">{filteredAttendance.length} attendance records</small>
            </div>

            <div
              className="d-flex gap-2"
              style={{
                minWidth: 400,
              }}
            >
              <CFormInput
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <CFormSelect
                style={{
                  maxWidth: 150,
                }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>

                <option value="present">Present</option>

                <option value="late">Late</option>

                <option value="absent">Absent</option>
              </CFormSelect>
            </div>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <CTable hover responsive className="mb-0 align-middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Staff</CTableHeaderCell>

                  <CTableHeaderCell>Position</CTableHeaderCell>

                  <CTableHeaderCell>Clock In</CTableHeaderCell>

                  <CTableHeaderCell>Status</CTableHeaderCell>

                  <CTableHeaderCell>Clock Out</CTableHeaderCell>

                  <CTableHeaderCell>Working Hours</CTableHeaderCell>

                  <CTableHeaderCell>Overtime</CTableHeaderCell>

                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredAttendance.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center py-5">
                      <div className="text-muted">No attendance records found.</div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredAttendance.map((item) => (
                    <CTableRow key={item.id}>
                      <CTableDataCell>
                        <div className="fw-semibold">{item.Staff?.User?.fullname || 'Unknown'}</div>

                        <small className="text-muted">{item.Staff?.User?.email}</small>
                      </CTableDataCell>

                      <CTableDataCell>{item.Staff?.position || '--'}</CTableDataCell>

                      <CTableDataCell>{formatTime(item.clockIn)}</CTableDataCell>

                      <CTableDataCell>{getStatusBadge(item.status)}</CTableDataCell>

                      <CTableDataCell>{formatTime(item.clockOut)}</CTableDataCell>

                      <CTableDataCell>
                        {item.workingHours ? `${item.workingHours}h` : '--'}
                      </CTableDataCell>

                      <CTableDataCell>{item.overtime ? `${item.overtime}h` : '--'}</CTableDataCell>

                      <CTableDataCell>
                        <CButton
                          color="light"
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(item.Staff)

                            setShowDetails(true)
                          }}
                        >
                          View
                          <CIcon icon={cilArrowRight} className="ms-1" />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {/* =================================================
          LIVE STAFF STATUS
      ================================================= */}

      <CRow className="g-4 mb-4">
        <CCol lg={5}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-white border-0 py-3">
              <h5 className="fw-bold mb-1">Live Staff Status</h5>

              <small className="text-muted">Current attendance status</small>
            </CCardHeader>

            <CCardBody>
              {attendance.length === 0 ? (
                <div className="text-muted text-center py-4">No staff activity yet.</div>
              ) : (
                attendance.map((item) => {
                  const liveStatus = getLiveStatus(item)

                  return (
                    <div
                      key={item.id}
                      className="d-flex align-items-center justify-content-between py-3 border-bottom"
                    >
                      <div className="d-flex align-items-center">
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            marginRight: 12,
                          }}
                        >
                          {item.Staff?.User?.fullname?.charAt(0)?.toUpperCase()}
                        </div>

                        <div>
                          <div className="fw-semibold">{item.Staff?.User?.fullname}</div>

                          <small className="text-muted">{item.Staff?.position}</small>
                        </div>
                      </div>

                      <CBadge color={liveStatus.color}>{liveStatus.label}</CBadge>
                    </div>
                  )
                })
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* =================================================
            RECENT ACTIVITIES
        ================================================= */}

        <CCol lg={7}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardHeader className="bg-white border-0 py-3">
              <h5 className="fw-bold mb-1">Recent Staff Activities</h5>

              <small className="text-muted">Latest kiosk activities</small>
            </CCardHeader>

            <CCardBody className="p-0">
              <div
                style={{
                  maxHeight: 420,
                  overflowY: 'auto',
                }}
              >
                {activities.length === 0 ? (
                  <div className="text-center text-muted py-5">No activities recorded.</div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="d-flex align-items-center px-4 py-3 border-bottom"
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <CIcon icon={cilHistory} />
                      </div>

                      <div className="flex-grow-1">
                        <div className="fw-semibold">{activity.action}</div>

                        <small className="text-muted">{activity.description}</small>
                      </div>

                      <small className="text-muted">{formatDateTime(activity.createdAt)}</small>
                    </div>
                  ))
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* =================================================
          STAFF DETAILS MODAL
      ================================================= */}

      {showDetails && selectedStaff && (
        <StaffDetailsModal
          staff={selectedStaff}
          onClose={() => {
            setShowDetails(false)
            setSelectedStaff(null)
          }}
        />
      )}
    </div>
  )
}

// =====================================================
// KPI CARD COMPONENT
// =====================================================

const KpiCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <CCard className="border-0 shadow-sm h-100">
      <CCardBody className="d-flex align-items-center">
        <div
          className={`bg-${color} bg-opacity-10`}
          style={{
            width: 55,
            height: 55,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 15,
          }}
        >
          <CIcon icon={icon} size="xl" className={`text-${color}`} />
        </div>

        <div>
          <div
            className="text-muted"
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 25,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>

          <small className="text-muted">{subtitle}</small>
        </div>
      </CCardBody>
    </CCard>
  )
}

// =====================================================
// STAFF DETAILS MODAL
// =====================================================

const StaffDetailsModal = ({ staff, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <CCard
        style={{
          width: '100%',
          maxWidth: 500,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <strong>Staff Details</strong>
          </div>

          <CButton color="light" size="sm" onClick={onClose}>
            ✕
          </CButton>
        </CCardHeader>

        <CCardBody>
          <div className="text-center mb-4">
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: 25,
                fontWeight: 800,
              }}
            >
              {staff?.User?.fullname?.charAt(0)?.toUpperCase()}
            </div>

            <h4 className="fw-bold mb-1">{staff?.User?.fullname}</h4>

            <div className="text-muted">{staff?.position}</div>
          </div>

          <div className="border-top pt-3">
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">Email</span>

              <strong>{staff?.User?.email || '--'}</strong>
            </div>

            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">Phone</span>

              <strong>{staff?.User?.phone || '--'}</strong>
            </div>

            <div className="d-flex justify-content-between">
              <span className="text-muted">Employment</span>

              <strong>{staff?.employmentType || '--'}</strong>
            </div>
          </div>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default AttendanceDashboard
