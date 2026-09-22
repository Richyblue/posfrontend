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

      console.log('Business hours response:', response.data)

      const businessHours = response.data.businessHours || []

      setHours(Array.isArray(businessHours) ? businessHours : [])
    } catch (error) {
      console.error('Get business hours error:', error.response?.data || error)

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
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
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

    if (!formData.dayOfWeek) {
      Swal.fire({
        icon: 'warning',
        title: 'Select a day',
        text: 'Please select a day of the week.',
      })

      return
    }

    try {
      setSaving(true)

      let updatedBusinessHours

      if (editingHour) {
        updatedBusinessHours = hours.map((item) =>
          item.id === editingHour.id
            ? {
                ...item,
                ...formData,
              }
            : item,
        )
      } else {
        const alreadyExists = hours.some((item) => item.dayOfWeek === formData.dayOfWeek)

        if (alreadyExists) {
          Swal.fire({
            icon: 'warning',
            title: 'Day already exists',
            text: `${formData.dayOfWeek} already has business hours. Edit the existing record instead.`,
          })

          return
        }

        updatedBusinessHours = [...hours, formData]
      }

      const payload = {
        businessHours: updatedBusinessHours,
      }

      console.log('Business hours payload:', payload)

      const response = await axios.put(`${API_URL}api/v1/business-hours`, payload, authConfig)

      console.log('Save business hours response:', response.data)

      setHours(updatedBusinessHours)
      setVisible(false)
      setEditingHour(null)

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: editingHour
          ? 'Business hours updated successfully.'
          : 'Business hours created successfully.',
        confirmButtonColor: '#321fdb',
      })
    } catch (error) {
      console.error('Save business hours error:', error.response?.data || error)

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Unable to save business hours.',
      })
    } finally {
      setSaving(false)
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
                  <CTableRow key={item.id || item.dayOfWeek}>
                    <CTableDataCell>
                      <strong>{item.dayOfWeek}</strong>
                    </CTableDataCell>

                    <CTableDataCell>{item.openingTime || '--:--'}</CTableDataCell>

                    <CTableDataCell>{item.closingTime || '--:--'}</CTableDataCell>

                    <CTableDataCell>{item.workingHours ?? 0} hours</CTableDataCell>

                    <CTableDataCell>{item.gracePeriod ?? 0} minutes</CTableDataCell>

                    <CTableDataCell>
                      {item.isOpen ? (
                        <CBadge color="success">Open</CBadge>
                      ) : (
                        <CBadge color="secondary">Closed</CBadge>
                      )}
                    </CTableDataCell>

                    <CTableDataCell>
                      <CButton
                        size="sm"
                        color="info"
                        variant="outline"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </CButton>
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
            <CButton
              color="secondary"
              variant="outline"
              type="button"
              onClick={() => setVisible(false)}
            >
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
