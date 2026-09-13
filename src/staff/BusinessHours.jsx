import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormCheck,
  CSpinner,
  CAlert,
  CBadge,
} from '@coreui/react'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

const BusinessHours = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [hours, setHours] = useState([])
  const [visible, setVisible] = useState(false)
  const [editingHour, setEditingHour] = useState(null)

  const [formData, setFormData] = useState({
    dayOfWeek: '',
    openingTime: '08:00',
    closingTime: '17:00',
    gracePeriod: 15,
    workingHours: 8,
    isOpen: true,
  })

  const token = localStorage.getItem('token')

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const getBusinessHours = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await axios.get(`${API_URL}api/v1/business-hours`, authConfig)

      setHours(response.data.businessHours || response.data.hours || [])
    } catch (error) {
      console.error(error)
      setError(error.response?.data?.message || 'Unable to load business hours.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getBusinessHours()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const openCreateModal = () => {
    setEditingHour(null)

    setFormData({
      dayOfWeek: '',
      openingTime: '08:00',
      closingTime: '17:00',
      gracePeriod: 15,
      workingHours: 8,
      isOpen: true,
    })

    setVisible(true)
  }

  const openEditModal = (businessHour) => {
    setEditingHour(businessHour)

    setFormData({
      dayOfWeek: businessHour.dayOfWeek || '',
      openingTime: businessHour.openingTime || '08:00',
      closingTime: businessHour.closingTime || '17:00',
      gracePeriod: businessHour.gracePeriod ?? 15,
      workingHours: businessHour.workingHours ?? 8,
      isOpen: businessHour.isOpen ?? true,
    })

    setVisible(true)
  }

  const saveBusinessHour = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      if (editingHour) {
        await axios.put(`${API_URL}api/v1/business-hours/${editingHour.id}`, formData, authConfig)
      } else {
        await axios.post(`${API_URL}api/v1/business-hours`, formData, authConfig)
      }

      setVisible(false)
      await getBusinessHours()

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: editingHour
          ? 'Business hours updated successfully.'
          : 'Business hours created successfully.',
        confirmButtonColor: '#321fdb',
      })
    } catch (error) {
      console.error(error)

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Unable to save business hours.',
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteBusinessHour = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete business hours?',
      text: 'This action cannot be reversed.',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
    })

    if (!result.isConfirmed) return

    try {
      await axios.delete(`${API_URL}api/v1/business-hours/${id}`, authConfig)

      await getBusinessHours()

      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'Business hours deleted successfully.',
      })
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Unable to delete business hours.',
      })
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <CCard className="shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">Business Hours</h5>
            <small className="text-medium-emphasis">
              Manage opening times, closing times and staff grace periods.
            </small>
          </div>

          <CButton color="primary" onClick={openCreateModal}>
            + Add Business Hour
          </CButton>
        </CCardHeader>

        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}

          <CTable responsive hover align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Day</CTableHeaderCell>
                <CTableHeaderCell>Opening Time</CTableHeaderCell>
                <CTableHeaderCell>Closing Time</CTableHeaderCell>
                <CTableHeaderCell>Working Hours</CTableHeaderCell>
                <CTableHeaderCell>Grace Period</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {hours.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={7} className="text-center py-4">
                    No business hours found.
                  </CTableDataCell>
                </CTableRow>
              ) : (
                hours.map((item) => (
                  <CTableRow key={item.id}>
                    <CTableDataCell>
                      <strong>{item.dayOfWeek}</strong>
                    </CTableDataCell>

                    <CTableDataCell>{item.openingTime || '--:--'}</CTableDataCell>

                    <CTableDataCell>{item.closingTime || '--:--'}</CTableDataCell>

                    <CTableDataCell>{item.workingHours || 0} hours</CTableDataCell>

                    <CTableDataCell>{item.gracePeriod || 0} minutes</CTableDataCell>

                    <CTableDataCell>
                      {item.isOpen ? (
                        <CBadge color="success">Open</CBadge>
                      ) : (
                        <CBadge color="secondary">Closed</CBadge>
                      )}
                    </CTableDataCell>

                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <CButton
                          size="sm"
                          color="info"
                          variant="outline"
                          onClick={() => openEditModal(item)}
                        >
                          Edit
                        </CButton>

                        <CButton
                          size="sm"
                          color="danger"
                          variant="outline"
                          onClick={() => deleteBusinessHour(item.id)}
                        >
                          Delete
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>

      <CModal visible={visible} onClose={() => setVisible(false)} backdrop="static">
        <CModalHeader>
          <CModalTitle>{editingHour ? 'Edit Business Hour' : 'Add Business Hour'}</CModalTitle>
        </CModalHeader>

        <CForm onSubmit={saveBusinessHour}>
          <CModalBody>
            <div className="mb-3">
              <label className="form-label">Day of Week</label>

              <select
                className="form-select"
                name="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={handleChange}
                required
              >
                <option value="">Select day</option>

                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <CFormInput
              className="mb-3"
              type="time"
              label="Opening Time"
              name="openingTime"
              value={formData.openingTime}
              onChange={handleChange}
              required
            />

            <CFormInput
              className="mb-3"
              type="time"
              label="Closing Time"
              name="closingTime"
              value={formData.closingTime}
              onChange={handleChange}
              required
            />

            <CFormInput
              className="mb-3"
              type="number"
              min="0"
              step="0.5"
              label="Working Hours"
              name="workingHours"
              value={formData.workingHours}
              onChange={handleChange}
              required
            />

            <CFormInput
              className="mb-3"
              type="number"
              min="0"
              label="Grace Period in Minutes"
              name="gracePeriod"
              value={formData.gracePeriod}
              onChange={handleChange}
              required
            />

            <CFormCheck
              label="Business is open on this day"
              name="isOpen"
              checked={formData.isOpen}
              onChange={handleChange}
            />
          </CModalBody>

          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => setVisible(false)}>
              Cancel
            </CButton>

            <CButton color="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Business Hour'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default BusinessHours
