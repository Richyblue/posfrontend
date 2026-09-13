import {
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormCheck,
  CFormSelect,
  CButton,
  CRow,
  CCol,
  CSpinner,
  CAlert,
} from '@coreui/react'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

const Settings = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    companyPhone: '',
    companyEmail: '',
    companyAddress: '',

    // Financial Settings
    currency: 'NGN',
    currencySymbol: '₦',
    defaultCommissionRate: 10,
    loyaltyPointRate: 1,
    taxRate: 0,

    // Inventory and Sales
    lowStockThreshold: 5,
    allowNegativeStock: false,
    autoApproveSales: true,

    // Receipt
    receiptFooter: '',

    // Business Hours
    openingTime: '08:00',
    closingTime: '17:00',
    workingHours: 8,
    gracePeriod: 15,
    earlyClockInMinutes: 0,
    timezone: 'Africa/Lagos',

    // Attendance and Kiosk
    movementTrackingEnabled: true,
    requireReasonForMovement: true,
    qrAttendanceEnabled: true,
    kioskModeEnabled: true,
    allowClockOutWithoutReturn: false,

    // Penalty Settings
    allowPenalty: false,
    penaltyRate: 0,
    penaltyBasis: 'fixed_amount',
    defaultPenaltyAmount: 0,

    latePenaltyEnabled: false,
    absentPenaltyEnabled: false,
    movementOverstayPenaltyEnabled: false,
    overtimePenaltyEnabled: false,

    latePenaltyPercent: 0,
    overStayPenaltyPercent: 0,
  })

  const getSettings = async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setFormData((previous) => ({
        ...previous,
        ...(response.data.settings || {}),
      }))
    } catch (error) {
      console.error('Failed to load settings:', error)

      setError(
        error.response?.data?.message || 'Unable to load company settings. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getSettings()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const saveSettings = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)
      setError('')

      const token = localStorage.getItem('token')

      await axios.put(`${API_URL}api/v1/settings`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      Swal.fire({
        icon: 'success',
        title: 'Settings Updated',
        text: 'Your company settings have been saved successfully.',
        confirmButtonColor: '#321fdb',
      })
    } catch (error) {
      console.error('Failed to update settings:', error)

      const message =
        error.response?.data?.message || 'Settings could not be updated. Please try again.'

      setError(message)

      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <CCard className="shadow-sm">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-1">System Settings</h5>
          <small className="text-medium-emphasis">
            Manage your company, sales, inventory, attendance and penalty rules.
          </small>
        </div>
      </CCardHeader>

      <CCardBody>
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError('')}>
            {error}
          </CAlert>
        )}

        <CForm onSubmit={saveSettings}>
          {/* =====================================================
              COMPANY INFORMATION
          ====================================================== */}
          <CCard className="mb-4 border">
            <CCardHeader>
              <strong>1. Company Information</strong>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormInput
                    label="Company Name"
                    name="companyName"
                    value={formData.companyName || ''}
                    onChange={handleChange}
                    required
                  />
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    label="Company Phone"
                    name="companyPhone"
                    value={formData.companyPhone || ''}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    type="email"
                    label="Company Email"
                    name="companyEmail"
                    value={formData.companyEmail || ''}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormSelect
                    label="Timezone"
                    name="timezone"
                    value={formData.timezone || 'Africa/Lagos'}
                    onChange={handleChange}
                    options={[
                      {
                        label: 'Africa/Lagos — Nigeria',
                        value: 'Africa/Lagos',
                      },
                      {
                        label: 'UTC',
                        value: 'UTC',
                      },
                    ]}
                  />
                </CCol>

                <CCol md={12}>
                  <CFormTextarea
                    rows={3}
                    label="Company Address"
                    name="companyAddress"
                    value={formData.companyAddress || ''}
                    onChange={handleChange}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* =====================================================
              FINANCIAL AND SALES SETTINGS
          ====================================================== */}
          <CCard className="mb-4 border">
            <CCardHeader>
              <strong>2. Financial & Sales Settings</strong>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                <CCol md={4}>
                  <CFormSelect
                    label="Currency"
                    name="currency"
                    value={formData.currency || 'NGN'}
                    onChange={handleChange}
                    options={[
                      { label: 'Nigerian Naira — NGN', value: 'NGN' },
                      { label: 'US Dollar — USD', value: 'USD' },
                      { label: 'British Pound — GBP', value: 'GBP' },
                      { label: 'Euro — EUR', value: 'EUR' },
                    ]}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput
                    label="Currency Symbol"
                    name="currencySymbol"
                    value={formData.currencySymbol || ''}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    label="Default Commission Rate (%)"
                    name="defaultCommissionRate"
                    value={formData.defaultCommissionRate ?? 0}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min="0"
                    step="0.01"
                    label="Loyalty Point Rate"
                    name="loyaltyPointRate"
                    value={formData.loyaltyPointRate ?? 0}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    label="Tax Rate (%)"
                    name="taxRate"
                    value={formData.taxRate ?? 0}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormCheck
                    className="mt-4"
                    label="Automatically Approve Sales"
                    name="autoApproveSales"
                    checked={Boolean(formData.autoApproveSales)}
                    onChange={handleChange}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* =====================================================
              INVENTORY SETTINGS
          ====================================================== */}
          <CCard className="mb-4 border">
            <CCardHeader>
              <strong>3. Inventory Settings</strong>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormInput
                    type="number"
                    min="0"
                    label="Low Stock Threshold"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold ?? 0}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Products will be flagged when stock reaches this level.
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormCheck
                    className="mt-4"
                    label="Allow Negative Stock"
                    name="allowNegativeStock"
                    checked={Boolean(formData.allowNegativeStock)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Allow sales even when available stock is zero.
                  </small>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* =====================================================
              RECEIPT SETTINGS
          ====================================================== */}
          <CCard className="mb-4 border">
            <CCardHeader>
              <strong>4. Receipt Settings</strong>
            </CCardHeader>

            <CCardBody>
              <CFormTextarea
                rows={4}
                label="Receipt Footer"
                name="receiptFooter"
                value={formData.receiptFooter || ''}
                onChange={handleChange}
                placeholder="Thank you for patronizing Princess Salon..."
              />

              <small className="text-medium-emphasis">
                This message will appear at the bottom of printed receipts.
              </small>
            </CCardBody>
          </CCard>

          {/* =====================================================
              BUSINESS HOURS
          ====================================================== */}
          <CCard className="mb-4 border">
            <CCardHeader>
              <strong>5. Business Hours</strong>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormInput
                    type="time"
                    label="Opening Time"
                    name="openingTime"
                    value={formData.openingTime || ''}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">Normal opening time.</small>
                </CCol>

                <CCol md={3}>
                  <CFormInput
                    type="time"
                    label="Closing Time"
                    name="closingTime"
                    value={formData.closingTime || ''}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">Normal closing time.</small>
                </CCol>

                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min="0"
                    step="0.5"
                    label="Working Hours"
                    name="workingHours"
                    value={formData.workingHours ?? 0}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">Standard working hours per day.</small>
                </CCol>

                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min="0"
                    label="Grace Period (Minutes)"
                    name="gracePeriod"
                    value={formData.gracePeriod ?? 0}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Time allowed before marking staff late.
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormInput
                    type="number"
                    min="0"
                    label="Early Clock-In Allowance (Minutes)"
                    name="earlyClockInMinutes"
                    value={formData.earlyClockInMinutes ?? 0}
                    onChange={handleChange}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* =====================================================
              ATTENDANCE AND KIOSK SETTINGS
          ====================================================== */}
          <CCard className="mb-4 border">
            <CCardHeader>
              <strong>6. Attendance & Kiosk Settings</strong>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormCheck
                    label="Enable QR Attendance"
                    name="qrAttendanceEnabled"
                    checked={Boolean(formData.qrAttendanceEnabled)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Allow staff to clock in and out using QR ID cards.
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormCheck
                    label="Enable Kiosk Mode"
                    name="kioskModeEnabled"
                    checked={Boolean(formData.kioskModeEnabled)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Enable the dedicated attendance kiosk.
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormCheck
                    label="Enable Movement Tracking"
                    name="movementTrackingEnabled"
                    checked={Boolean(formData.movementTrackingEnabled)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Track staff going out and returning.
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormCheck
                    label="Require Reason for Movement"
                    name="requireReasonForMovement"
                    checked={Boolean(formData.requireReasonForMovement)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Staff must provide a reason before going out.
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormCheck
                    label="Allow Clock-Out Without Returning"
                    name="allowClockOutWithoutReturn"
                    checked={Boolean(formData.allowClockOutWithoutReturn)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Allow staff to clock out while still marked outside.
                  </small>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* =====================================================
              PENALTY SETTINGS
          ====================================================== */}
          <CCard className="mb-4 border">
            <CCardHeader>
              <strong>7. Staff Penalty Settings</strong>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormCheck
                    label="Enable Staff Penalties"
                    name="allowPenalty"
                    checked={Boolean(formData.allowPenalty)}
                    onChange={handleChange}
                  />

                  <small className="text-medium-emphasis">
                    Allow the system to calculate staff penalties.
                  </small>
                </CCol>

                <CCol md={6}>
                  <CFormSelect
                    label="Penalty Basis"
                    name="penaltyBasis"
                    value={formData.penaltyBasis || 'fixed_amount'}
                    onChange={handleChange}
                    options={[
                      {
                        label: 'Fixed Amount',
                        value: 'fixed_amount',
                      },
                      {
                        label: 'Commission',
                        value: 'commission',
                      },
                      {
                        label: 'Salary',
                        value: 'salary',
                      },
                    ]}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min="0"
                    label="Default Penalty Amount"
                    name="defaultPenaltyAmount"
                    value={formData.defaultPenaltyAmount ?? 0}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    label="General Penalty Rate (%)"
                    name="penaltyRate"
                    value={formData.penaltyRate ?? 0}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    label="Late Penalty (%)"
                    name="latePenaltyPercent"
                    value={formData.latePenaltyPercent ?? 0}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    label="Overstay Penalty (%)"
                    name="overStayPenaltyPercent"
                    value={formData.overStayPenaltyPercent ?? 0}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormCheck
                    className="mt-4"
                    label="Enable Late Penalty"
                    name="latePenaltyEnabled"
                    checked={Boolean(formData.latePenaltyEnabled)}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormCheck
                    className="mt-4"
                    label="Enable Absence Penalty"
                    name="absentPenaltyEnabled"
                    checked={Boolean(formData.absentPenaltyEnabled)}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormCheck
                    label="Enable Movement Overstay Penalty"
                    name="movementOverstayPenaltyEnabled"
                    checked={Boolean(formData.movementOverstayPenaltyEnabled)}
                    onChange={handleChange}
                  />
                </CCol>

                <CCol md={6}>
                  <CFormCheck
                    label="Enable Overtime Penalty"
                    name="overtimePenaltyEnabled"
                    checked={Boolean(formData.overtimePenaltyEnabled)}
                    onChange={handleChange}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* =====================================================
              SAVE BUTTON
          ====================================================== */}
          <div className="d-flex justify-content-end gap-2">
            <CButton type="submit" color="primary" size="lg" disabled={saving}>
              {saving ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Saving Settings...
                </>
              ) : (
                'Save Settings'
              )}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default Settings
