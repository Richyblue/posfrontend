import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const API_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/?$/, '/')

const TIMEZONE = 'Africa/Lagos'
const REFRESH_INTERVAL = 30000

const getResponseData = (response) => {
  return response?.data?.data ?? response?.data ?? null
}

const getStaffName = (staff) => {
  return (
    staff?.User?.fullname ||
    staff?.User?.fullName ||
    staff?.fullname ||
    staff?.fullName ||
    staff?.name ||
    'Unknown Staff'
  )
}

const getActivityAction = (activity) => {
  return String(activity?.action || '').toUpperCase()
}

const AttendanceDashboard = () => {
  const [kpis, setKpis] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [activities, setActivities] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedAttendance, setSelectedAttendance] = useState(null)

  const requestInProgress = useRef(false)

  // =====================================================
  // FETCH DASHBOARD
  // =====================================================

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    if (requestInProgress.current) return

    requestInProgress.current = true

    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Your session has expired. Please log in again.')
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [kpiResponse, attendanceResponse, activityResponse] = await Promise.all([
        axios.get(`${API_URL}api/v1/attendance/dashboard`, { headers }),

        axios.get(`${API_URL}api/v1/attendance/today`, { headers }),

        axios.get(`${API_URL}api/v1/attendance/activities?limit=50`, { headers }),
      ])

      const kpiData = getResponseData(kpiResponse)
      const attendanceData = getResponseData(attendanceResponse)
      const activityData = getResponseData(activityResponse)

      setKpis(kpiData || {})

      setAttendance(
        Array.isArray(attendanceData) ? attendanceData : attendanceData?.attendance || [],
      )

      setActivities(Array.isArray(activityData) ? activityData : activityData?.activities || [])
    } catch (err) {
      console.error('ATTENDANCE DASHBOARD ERROR:', err)

      setError(err.response?.data?.message || err.message || 'Unable to load attendance dashboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
      requestInProgress.current = false
    }
  }, [])

  // =====================================================
  // INITIAL LOAD + AUTOMATIC REFRESH
  // =====================================================

  useEffect(() => {
    fetchDashboard()

    const interval = setInterval(() => {
      fetchDashboard(true)
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchDashboard])

  // =====================================================
  // FILTER ATTENDANCE
  // =====================================================

  const filteredAttendance = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return attendance.filter((item) => {
      const fullname = getStaffName(item.Staff).toLowerCase()

      const position = (item.Staff?.position || '').toLowerCase()

      const email = (item.Staff?.User?.email || '').toLowerCase()

      const matchesSearch =
        !searchValue ||
        fullname.includes(searchValue) ||
        position.includes(searchValue) ||
        email.includes(searchValue)

      const status = String(item.status || '').toLowerCase()

      const matchesStatus = statusFilter === 'all' || statusFilter === status

      return matchesSearch && matchesStatus
    })
  }, [attendance, search, statusFilter])

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) return '--'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return '--'

    return parsedDate.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: TIMEZONE,
    })
  }

  // =====================================================
  // FORMAT DATE AND TIME
  // =====================================================

  const formatDateTime = (date) => {
    if (!date) return '--'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return '--'

    return parsedDate.toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: TIMEZONE,
    })
  }

  // =====================================================
  // FORMAT FULL DATE
  // =====================================================

  const formatFullDate = (date) => {
    if (!date) return '--'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return '--'

    return parsedDate.toLocaleDateString('en-NG', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: TIMEZONE,
    })
  }

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const getStatusBadge = (status) => {
    switch (String(status || '').toLowerCase()) {
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

    if (!item.clockIn) {
      return {
        label: 'Not Clocked In',
        color: 'danger',
      }
    }

    // Find the latest GO_OUT or RETURN activity for this
    // attendance record. Older GO_OUT activities should
    // not override a more recent return activity.

    const relevantActivities = activities
      .filter((activity) => {
        const sameRecord = String(activity.recordId) === String(item.id)

        const action = getActivityAction(activity)

        return sameRecord && ['GO_OUT', 'RETURN', 'RETURN_BACK'].includes(action)
      })
      .sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      })

    const latestActivity = relevantActivities[0]
    const latestAction = getActivityAction(latestActivity)

    if (latestAction === 'GO_OUT') {
      return {
        label: 'Outside',
        color: 'warning',
      }
    }

    if (latestAction === 'RETURN' || latestAction === 'RETURN_BACK') {
      return {
        label: 'Working',
        color: 'success',
      }
    }

    return {
      label: 'Working',
      color: 'success',
    }
  }

  // =====================================================
  // CURRENT DATE
  // =====================================================

  const today = useMemo(() => {
    return new Date().toLocaleDateString('en-NG', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: TIMEZONE,
    })
  }, [])

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 450 }}>
        <div className="text-center">
          <CSpinner color="primary" style={{ width: 45, height: 45 }} />

          <div className="mt-3 text-muted">Loading attendance dashboard...</div>
        </div>
      </div>
    )
  }

  // =====================================================
  // MAIN DASHBOARD
  // =====================================================

  return (
    <div className="attendance-dashboard">
      <style>{`
        .attendance-dashboard {
          padding: 12px 5px 40px;
          color: #1f2937;
        }

        .attendance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 25px;
        }

        .attendance-title {
          font-size: 25px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 5px;
        }

        .attendance-subtitle {
          font-size: 14px;
          color: #64748b;
        }

        .attendance-kpi {
          border: 1px solid #eef0f4 !important;
          border-radius: 14px !important;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .attendance-kpi:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(15,23,42,.08) !important;
        }

        .attendance-section {
          border: 1px solid #eef0f4 !important;
          border-radius: 14px !important;
          overflow: hidden;
        }

        .attendance-section-header {
          background: #fff !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }

        .attendance-filter {
          display: flex;
          gap: 10px;
          min-width: 320px;
        }

        .attendance-table {
          min-width: 1050px;
        }

        .attendance-table th {
          white-space: nowrap;
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .4px;
        }

        .attendance-table td {
          vertical-align: middle;
          font-size: 13px;
        }

        .attendance-avatar {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #eef2ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .attendance-activity-list {
          max-height: 420px;
          overflow-y: auto;
        }

        .attendance-activity-list::-webkit-scrollbar {
          width: 5px;
        }

        .attendance-activity-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .attendance-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15,23,42,.65);
          backdrop-filter: blur(3px);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
        }

        .attendance-modal-card {
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          border: 0;
          border-radius: 18px;
          box-shadow: 0 25px 70px rgba(0,0,0,.25);
        }

        @media (max-width: 767px) {
          .attendance-dashboard {
            padding: 8px 0 30px;
          }

          .attendance-title {
            font-size: 21px;
          }

          .attendance-filter {
            min-width: 100%;
            width: 100%;
          }

          .attendance-filter > * {
            min-width: 0;
            flex: 1;
          }

          .attendance-header {
            align-items: flex-start;
          }
        }

        @media (max-width: 420px) {
          .attendance-filter {
            flex-direction: column;
          }

          .attendance-filter > * {
            width: 100%;
          }
        }
      `}</style>

      {/* HEADER */}

      <div className="attendance-header">
        <div>
          <h3 className="attendance-title">Attendance Overview</h3>

          <div className="attendance-subtitle">
            Monitor staff attendance, working hours and activities.
          </div>

          <small className="text-muted">
            <CIcon icon={cilClock} className="me-1" />
            {today}
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <CBadge color="success" className="px-3 py-2">
            Live Monitoring
          </CBadge>

          <CButton color="light" onClick={() => fetchDashboard(true)} disabled={refreshing}>
            {refreshing ? (
              <CSpinner size="sm" className="me-2" />
            ) : (
              <CIcon icon={cilReload} className="me-2" />
            )}
            Refresh
          </CButton>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <CAlert color="danger" dismissible onClose={() => setError('')}>
          {error}
        </CAlert>
      )}

      {/* KPI CARDS */}

      <CRow className="g-3 mb-4">
        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Present Today"
            value={kpis?.presentToday ?? 0}
            subtitle="Staff clocked in"
            icon={cilUserFollow}
            color="success"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Late Today"
            value={kpis?.lateToday ?? 0}
            subtitle="Needs attention"
            icon={cilWarning}
            color="warning"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Absent Today"
            value={kpis?.absentToday ?? 0}
            subtitle="Not clocked in"
            icon={cilUserUnfollow}
            color="danger"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Currently Outside"
            value={kpis?.currentlyOutside ?? 0}
            subtitle="Away from salon"
            icon={cilPeople}
            color="warning"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Clocked Out"
            value={kpis?.clockedOutToday ?? 0}
            subtitle="Completed today"
            icon={cilUserUnfollow}
            color="info"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Average Hours"
            value={`${kpis?.averageWorkingHours ?? 0}h`}
            subtitle="Today's average"
            icon={cilClock}
            color="primary"
          />
        </CCol>

        <CCol xs={12} sm={6} xl={3}>
          <KpiCard
            title="Overtime"
            value={`${kpis?.overtimeHours ?? 0}h`}
            subtitle="Total overtime"
            icon={cilSpeedometer}
            color="dark"
          />
        </CCol>
      </CRow>

      {/* ATTENDANCE TABLE */}

      <CCard className="attendance-section shadow-sm mb-4">
        <CCardHeader className="attendance-section-header py-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h5 className="fw-bold mb-1">Today's Attendance</h5>

              <small className="text-muted">
                Showing {filteredAttendance.length} of {attendance.length} records
              </small>
            </div>

            <div className="attendance-filter">
              <CFormInput
                placeholder="Search name, email or position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </CFormSelect>
            </div>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <div style={{ overflowX: 'auto' }}>
            <CTable hover responsive className="mb-0 align-middle attendance-table">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Staff</CTableHeaderCell>
                  <CTableHeaderCell>Position</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Clock In</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Live Status</CTableHeaderCell>
                  <CTableHeaderCell>Clock Out</CTableHeaderCell>
                  <CTableHeaderCell>Working Hours</CTableHeaderCell>
                  <CTableHeaderCell>Overtime</CTableHeaderCell>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredAttendance.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-5">
                      <CIcon icon={cilPeople} size="3xl" className="text-body-secondary mb-2" />

                      <div className="fw-semibold">No attendance records found.</div>

                      <small className="text-muted">
                        Try changing your search or status filter.
                      </small>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredAttendance.map((item) => {
                    const staff = item.Staff
                    const fullname = getStaffName(staff)
                    const liveStatus = getLiveStatus(item)

                    return (
                      <CTableRow key={item.id}>
                        <CTableDataCell>
                          <div className="d-flex align-items-center gap-2">
                            <div className="attendance-avatar">
                              {fullname.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <div className="fw-semibold">{fullname}</div>

                              <small className="text-muted">{staff?.User?.email || '--'}</small>
                            </div>
                          </div>
                        </CTableDataCell>

                        <CTableDataCell>{staff?.position || '--'}</CTableDataCell>

                        <CTableDataCell>
                          {item.attendanceDate ? formatFullDate(item.attendanceDate) : '--'}
                        </CTableDataCell>

                        <CTableDataCell>
                          <span className="fw-semibold">{formatTime(item.clockIn)}</span>
                        </CTableDataCell>

                        <CTableDataCell>{getStatusBadge(item.status)}</CTableDataCell>

                        <CTableDataCell>
                          <CBadge color={liveStatus.color}>{liveStatus.label}</CBadge>
                        </CTableDataCell>

                        <CTableDataCell>{formatTime(item.clockOut)}</CTableDataCell>

                        <CTableDataCell>
                          <span className="fw-semibold">
                            {item.workingHours != null ? `${item.workingHours}h` : '--'}
                          </span>
                        </CTableDataCell>

                        <CTableDataCell>
                          {item.overtime != null ? `${item.overtime}h` : '--'}
                        </CTableDataCell>

                        <CTableDataCell>
                          <CButton
                            color="light"
                            size="sm"
                            disabled={!staff}
                            onClick={() => setSelectedAttendance(item)}
                          >
                            View
                            <CIcon icon={cilArrowRight} className="ms-1" />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {/* LIVE STAFF STATUS + RECENT ACTIVITIES */}

      <CRow className="g-4 mb-4">
        <CCol lg={5}>
          <CCard className="attendance-section shadow-sm h-100">
            <CCardHeader className="attendance-section-header py-3">
              <h5 className="fw-bold mb-1">Live Staff Status</h5>

              <small className="text-muted">Current attendance status</small>
            </CCardHeader>

            <CCardBody>
              {attendance.length === 0 ? (
                <div className="text-muted text-center py-4">No staff activity yet.</div>
              ) : (
                attendance.map((item) => {
                  const fullname = getStaffName(item.Staff)
                  const liveStatus = getLiveStatus(item)

                  return (
                    <div
                      key={item.id}
                      className="d-flex align-items-center justify-content-between gap-2 py-3 border-bottom"
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div className="attendance-avatar">{fullname.charAt(0).toUpperCase()}</div>

                        <div>
                          <div className="fw-semibold">{fullname}</div>

                          <small className="text-muted">{item.Staff?.position || '--'}</small>
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

        <CCol lg={7}>
          <CCard className="attendance-section shadow-sm h-100">
            <CCardHeader className="attendance-section-header py-3">
              <h5 className="fw-bold mb-1">Recent Staff Activities</h5>

              <small className="text-muted">Latest kiosk activities</small>
            </CCardHeader>

            <CCardBody className="p-0">
              <div className="attendance-activity-list">
                {activities.length === 0 ? (
                  <div className="text-center text-muted py-5">No activities recorded.</div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="d-flex align-items-center gap-3 px-3 px-md-4 py-3 border-bottom"
                    >
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 11,
                          background: '#eef2ff',
                          color: '#4f46e5',
                        }}
                      >
                        <CIcon icon={cilHistory} />
                      </div>

                      <div className="flex-grow-1 min-width-0">
                        <div className="fw-semibold">{activity.action || 'Activity'}</div>

                        <small className="text-muted">
                          {activity.description || 'Attendance activity recorded'}
                        </small>
                      </div>

                      <small className="text-muted text-end flex-shrink-0" style={{ fontSize: 11 }}>
                        {formatDateTime(activity.createdAt)}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* STAFF DETAILS MODAL */}

      {selectedAttendance && (
        <StaffDetailsModal
          attendance={selectedAttendance}
          onClose={() => setSelectedAttendance(null)}
          formatTime={formatTime}
          formatDateTime={formatDateTime}
          getStatusBadge={getStatusBadge}
          getLiveStatus={getLiveStatus}
        />
      )}

      {refreshing && (
        <div className="text-end text-muted mt-2" style={{ fontSize: 11 }}>
          <CSpinner size="sm" className="me-2" />
          Updating dashboard...
        </div>
      )}
    </div>
  )
}

// =====================================================
// KPI CARD
// =====================================================

const KpiCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <CCard className="attendance-kpi shadow-sm h-100">
      <CCardBody className="d-flex align-items-center p-3">
        <div
          className={`bg-${color} bg-opacity-10`}
          style={{
            width: 55,
            height: 55,
            minWidth: 55,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 15,
          }}
        >
          <CIcon icon={icon} size="xl" className={`text-${color}`} />
        </div>

        <div className="min-width-0">
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
              lineHeight: 1.3,
              color: '#111827',
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

const StaffDetailsModal = ({
  attendance,
  onClose,
  formatTime,
  formatDateTime,
  getStatusBadge,
  getLiveStatus,
}) => {
  const staff = attendance?.Staff
  const user = staff?.User

  const fullname = getStaffName(staff)
  const liveStatus = getLiveStatus(attendance)

  const details = [
    {
      label: 'Email',
      value: user?.email || '--',
    },
    {
      label: 'Phone',
      value: user?.phone || '--',
    },
    {
      label: 'Position',
      value: staff?.position || '--',
    },
    {
      label: 'Employment Type',
      value: staff?.employmentType || '--',
    },
    {
      label: 'Attendance Date',
      value: attendance?.attendanceDate ? formatDateTime(attendance.attendanceDate) : '--',
    },
    {
      label: 'Clock In',
      value: formatTime(attendance?.clockIn),
    },
    {
      label: 'Clock Out',
      value: formatTime(attendance?.clockOut),
    },
    {
      label: 'Working Hours',
      value: attendance?.workingHours != null ? `${attendance.workingHours} hours` : '--',
    },
    {
      label: 'Overtime',
      value: attendance?.overtime != null ? `${attendance.overtime} hours` : '--',
    },
  ]

  return (
    <div className="attendance-modal-overlay" role="presentation" onClick={onClose}>
      <CCard
        className="attendance-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <CCardHeader className="d-flex justify-content-between align-items-center py-3">
          <div>
            <h5 id="staff-details-title" className="fw-bold mb-0">
              Staff Attendance Details
            </h5>

            <small className="text-muted">Staff profile and today's attendance</small>
          </div>

          <CButton color="light" size="sm" onClick={onClose} aria-label="Close staff details">
            ✕
          </CButton>
        </CCardHeader>

        <CCardBody className="p-4">
          <div className="text-center mb-4">
            <div
              className="attendance-avatar mx-auto mb-3"
              style={{
                width: 75,
                height: 75,
                fontSize: 27,
              }}
            >
              {fullname.charAt(0).toUpperCase()}
            </div>

            <h4 className="fw-bold mb-1">{fullname}</h4>

            <div className="text-muted mb-2">{staff?.position || 'Staff'}</div>

            <div className="d-flex justify-content-center gap-2 flex-wrap">
              {getStatusBadge(attendance?.status)}

              <CBadge color={liveStatus.color}>{liveStatus.label}</CBadge>
            </div>
          </div>

          <div className="border-top pt-3">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="d-flex justify-content-between align-items-start gap-3 py-2 border-bottom"
              >
                <span className="text-muted">{detail.label}</span>

                <strong
                  className="text-end"
                  style={{
                    color: '#1f2937',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {detail.value}
                </strong>
              </div>
            ))}
          </div>

          <CButton color="dark" className="w-100 mt-4" onClick={onClose}>
            Close
          </CButton>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default AttendanceDashboard
