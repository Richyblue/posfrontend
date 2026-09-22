import { useState, useEffect } from 'react'

import { CSpinner } from '@coreui/react'

import LiveClock from '../components/LiveClock'
import QRScanner from '../components/QRScanner'

import { scanQR, getAttendanceDashboardKPIs, getTodayBusinessHours } from '../services/kioskApi'

const ScanScreen = ({
  setScreen,
  setStaff,
  setNextAction,
  kioskStats = {},
  recentActivities = [],
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [kpiLoading, setKpiLoading] = useState(true)

  const [kioskStats2, setKioskStats] = useState({
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    currentlyOutside: 0,
    clockedOutToday: 0,
    averageWorkingHours: 0,
    overtimeHours: 0,
  })

  const [businessHours, setBusinessHours] = useState(null)
  const [businessHoursLoading, setBusinessHoursLoading] = useState(true)

  // =========================================================
  // SCAN STAFF QR
  // =========================================================

  const handleScan = async (qrCode) => {
    if (loading) return

    try {
      setLoading(true)
      setError('')

      const response = await scanQR({
        qrCode,
      })

      setStaff(response.data.staff)
      setNextAction(response.data.nextAction)

      await loadKioskKPIs()

      setScreen('action')
    } catch (err) {
      console.error('QR scan failed:', err)

      setError(err.response?.data?.message || 'Invalid Staff Card')

      setTimeout(() => {
        setError('')
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // LOAD ATTENDANCE KPIs
  // =========================================================

  const loadKioskKPIs = async () => {
    try {
      setKpiLoading(true)

      const response = await getAttendanceDashboardKPIs()

      const data = response.data?.data || response.data || {}

      setKioskStats({
        presentToday: Number(data.presentToday || 0),
        lateToday: Number(data.lateToday || 0),
        absentToday: Number(data.absentToday || 0),
        currentlyOutside: Number(data.currentlyOutside || 0),
        clockedOutToday: Number(data.clockedOutToday || 0),
        averageWorkingHours: Number(data.averageWorkingHours || 0),
        overtimeHours: Number(data.overtimeHours || 0),
      })
    } catch (err) {
      console.error('Failed to load attendance KPIs:', err)
    } finally {
      setKpiLoading(false)
    }
  }

  // =========================================================
  // TIME HELPERS
  // =========================================================

  /**
   * Convert HH:mm into minutes.
   *
   * Example:
   * 08:00 -> 480
   * 17:30 -> 1050
   */
  const timeToMinutes = (time) => {
    if (!time) return null

    const value = String(time).substring(0, 5)

    const [hours, minutes] = value.split(':').map(Number)

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null
    }

    return hours * 60 + minutes
  }

  /**
   * Get current time specifically in Africa/Lagos.
   *
   * This prevents the kiosk from using the computer/server
   * timezone accidentally.
   */
  const getLagosTimeInMinutes = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date())

    const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0)

    const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0)

    return hour * 60 + minute
  }

  /**
   * Format business time for display.
   *
   * Example:
   * 08:00 -> 08:00 AM
   * 17:30 -> 05:30 PM
   */
  const formatTime12Hour = (time) => {
    if (!time) return '--'

    const value = String(time).substring(0, 5)

    const [hours, minutes] = value.split(':').map(Number)

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return '--'
    }

    const date = new Date()

    date.setHours(hours, minutes, 0, 0)

    return date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Lagos',
    })
  }

  /**
   * Check whether the business is currently open.
   *
   * Handles:
   *
   * 08:00 - 20:00
   *
   * and overnight schedules:
   *
   * 20:00 - 02:00
   */
  const isCurrentlyWithinBusinessHours = () => {
    if (!businessHours) return false

    const openTime = timeToMinutes(businessHours.openTime)
    const closeTime = timeToMinutes(businessHours.closeTime)

    if (openTime === null || closeTime === null) {
      return false
    }

    const currentTime = getLagosTimeInMinutes()

    // Normal same-day schedule
    if (closeTime > openTime) {
      return currentTime >= openTime && currentTime <= closeTime
    }

    // Overnight schedule
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime
    }

    // Same opening and closing time
    return false
  }

  // =========================================================
  // LOAD TODAY'S BUSINESS HOURS
  // =========================================================

  const loadTodayBusinessHours = async () => {
    try {
      setBusinessHoursLoading(true)

      const response = await getTodayBusinessHours()

      console.log('Today business hours response:', response.data)

      const responseData = response?.data

      /**
       * Support several possible API response formats.
       *
       * Format 1:
       * { data: {...} }
       *
       * Format 2:
       * { data: { data: {...} } }
       *
       * Format 3:
       * { data: { businessHours: {...} } }
       *
       * Format 4:
       * { businessHours: {...} }
       */
      let data =
        responseData?.data?.businessHours ||
        responseData?.data?.hours ||
        responseData?.data ||
        responseData?.businessHours ||
        responseData?.hours ||
        responseData

      /**
       * Some APIs return today's schedule as an array.
       * If so, use the first record.
       */
      if (Array.isArray(data)) {
        data = data[0]
      }

      if (!data || typeof data !== 'object') {
        console.warn('No valid business hours returned from API:', responseData)

        setBusinessHours(null)

        return
      }

      console.log('Normalized business hours:', data)

      setBusinessHours(data)
    } catch (err) {
      console.error('Failed to load today business hours:', err)

      setBusinessHours(null)
    } finally {
      setBusinessHoursLoading(false)
    }
  }

  // =========================================================
  // INITIAL LOAD + REFRESH
  // =========================================================

  useEffect(() => {
    loadKioskKPIs()
    loadTodayBusinessHours()

    const interval = setInterval(() => {
      loadKioskKPIs()
      loadTodayBusinessHours()
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  // =========================================================
  // BUSINESS HOURS DISPLAY
  // =========================================================

  const getShiftTitle = () => {
    if (businessHoursLoading) {
      return 'Loading business hours...'
    }

    if (!businessHours) {
      return 'Business hours unavailable'
    }

    const openTime = businessHours.openTime
    const closeTime = businessHours.closeTime

    if (!openTime || !closeTime) {
      return 'Business hours unavailable'
    }

    const shiftName =
      businessHours.shiftName ||
      businessHours.name ||
      businessHours.shift ||
      'Today’s Grooming Shift'

    const openingTime = formatTime12Hour(openTime)
    const closingTime = formatTime12Hour(closeTime)

    return `${shiftName}: ${openingTime} – ${closingTime}`
  }

  // =========================================================
  // BUSINESS STATUS
  // =========================================================

  const getBusinessStatus = () => {
    if (businessHoursLoading) {
      return 'Checking today’s business schedule...'
    }

    if (!businessHours) {
      return 'Unable to retrieve today’s schedule'
    }

    if (!businessHours.openTime || !businessHours.closeTime) {
      return 'Business hours are not configured'
    }

    return isCurrentlyWithinBusinessHours()
      ? 'Business is currently open'
      : 'Business is currently closed'
  }

  // =========================================================
  // GRACE PERIOD DISPLAY
  // =========================================================

  const getGracePeriodText = () => {
    if (businessHoursLoading) {
      return 'Checking today’s business schedule...'
    }

    if (!businessHours) {
      return 'Unable to retrieve today’s schedule'
    }

    const gracePeriod =
      businessHours.gracePeriodMinutes ??
      businessHours.graceMinutes ??
      businessHours.lateGraceMinutes ??
      businessHours.gracePeriod

    if (gracePeriod !== undefined && gracePeriod !== null && gracePeriod !== '') {
      return `Grace period: ${gracePeriod} minutes`
    }

    return getBusinessStatus()
  }

  // =========================================================
  // ACTIVITY HELPERS
  // =========================================================

  const formatActivityTime = (date) => {
    if (!date) return '--'

    try {
      return new Date(date).toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Lagos',
      })
    } catch {
      return '--'
    }
  }

  const getActivityInitials = (name = '') => {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('') || 'ST'
    )
  }

  const getActivityName = (activity) => {
    return (
      activity?.staff?.fullname ||
      activity?.staff?.fullName ||
      activity?.fullname ||
      activity?.fullName ||
      activity?.name ||
      'Staff Member'
    )
  }

  const getActivityPosition = (activity) => {
    return activity?.staff?.position || activity?.position || activity?.role || 'Staff'
  }

  const getActivityStatus = (activity) => {
    return activity?.status || activity?.attendanceStatus || activity?.action || 'Present'
  }

  const getStatusColor = (status = '') => {
    const normalizedStatus = String(status).toLowerCase()

    if (normalizedStatus.includes('late') || normalizedStatus.includes('warning')) {
      return {
        background: 'rgba(245, 158, 11, 0.14)',
        color: '#fbbf24',
      }
    }

    if (normalizedStatus.includes('out') || normalizedStatus.includes('clocked out')) {
      return {
        background: 'rgba(129, 140, 248, 0.14)',
        color: '#c4b5fd',
      }
    }

    return {
      background: 'rgba(34, 197, 94, 0.14)',
      color: '#86efac',
    }
  }

  return (
    <div
      className="princess-kiosk-page"
      style={{
        minHeight: '100vh',
        width: '100%',
        padding: '22px',
        background:
          'radial-gradient(circle at top left, rgba(79,70,229,0.22), transparent 35%), linear-gradient(135deg, #050816 0%, #0b1020 45%, #111827 100%)',
        color: '#ffffff',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflowX: 'hidden',
      }}
    >
      <style>
        {`
          .princess-kiosk-shell {
            width: 100%;
            max-width: 1500px;
            min-height: calc(100vh - 44px);
            margin: 0 auto;
            border: 1px solid rgba(148, 163, 184, 0.28);
            border-radius: 28px;
            overflow: hidden;
            background: rgba(8, 15, 32, 0.94);
            box-shadow:
              0 35px 100px rgba(0, 0, 0, 0.45),
              inset 0 1px 0 rgba(255, 255, 255, 0.06);
            display: flex;
            flex-direction: column;
          }

          .princess-kiosk-header {
            min-height: 92px;
            padding: 20px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.15);
            background: rgba(15, 23, 42, 0.82);
          }

          .princess-brand {
            display: flex;
            align-items: center;
            gap: 13px;
          }

          .princess-brand-logo {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4f46e5, #9333ea);
            color: white;
            font-size: 22px;
            font-weight: 900;
            box-shadow: 0 8px 25px rgba(124, 58, 237, 0.35);
          }

          .princess-brand-name {
            color: #ffffff;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 1.4px;
          }

          .princess-brand-subtitle {
            margin-top: 4px;
            color: #94a3b8;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.1px;
            text-transform: uppercase;
          }

          .princess-system-info {
            display: flex;
            align-items: center;
            gap: 22px;
          }

          .princess-system-item {
            text-align: right;
          }

          .princess-system-label {
            color: #64748b;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .princess-system-value {
            margin-top: 5px;
            color: #e2e8f0;
            font-size: 12px;
            font-weight: 700;
          }

          .princess-online-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            margin-right: 6px;
            border-radius: 50%;
            background: #22c55e;
            box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.1);
          }

          .princess-kiosk-content {
            flex: 1;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(420px, 0.9fr);
            gap: 24px;
            padding: 30px;
          }

          .princess-left-panel {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .princess-right-panel {
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .princess-pill {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            width: fit-content;
            padding: 7px 12px;
            border: 1px solid rgba(129, 140, 248, 0.3);
            border-radius: 30px;
            background: rgba(79, 70, 229, 0.12);
            color: #c4b5fd;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }

          .princess-heading {
            margin: 15px 0 0;
            color: #f8fafc;
            font-size: clamp(30px, 3.2vw, 48px);
            line-height: 1.08;
            font-weight: 900;
            letter-spacing: -1.5px;
          }

          .princess-description {
            max-width: 650px;
            margin-top: 14px;
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.7;
          }

          .princess-hours-card {
            margin-top: 22px;
            padding: 15px 17px;
            display: flex;
            align-items: center;
            gap: 12px;
            border: 1px solid rgba(148, 163, 184, 0.13);
            border-radius: 13px;
            background: rgba(30, 41, 59, 0.58);
          }

          .princess-hours-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(99, 102, 241, 0.18);
            color: #a5b4fc;
            font-size: 16px;
          }

          .princess-hours-title {
            color: #e2e8f0;
            font-size: 11px;
            font-weight: 800;
          }

          .princess-hours-subtitle {
            margin-top: 4px;
            color: #94a3b8;
            font-size: 10px;
          }

          .princess-section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 12px;
            color: #94a3b8;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.2px;
            text-transform: uppercase;
          }

          .princess-section-heading span:last-child {
            color: #64748b;
            font-size: 9px;
            letter-spacing: 0;
            text-transform: none;
          }

          .princess-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .princess-kpi-card {
            min-width: 0;
            padding: 15px 12px;
            border: 1px solid rgba(148, 163, 184, 0.14);
            border-radius: 13px;
            background: linear-gradient(
              145deg,
              rgba(30, 41, 59, 0.9),
              rgba(15, 23, 42, 0.9)
            );
          }

          .princess-kpi-label {
            color: #94a3b8;
            font-size: 9px;
            font-weight: 800;
            line-height: 1.4;
          }

          .princess-kpi-value {
            margin-top: 8px;
            color: #f8fafc;
            font-size: 27px;
            font-weight: 900;
            line-height: 1;
          }

          .princess-kpi-caption {
            margin-top: 7px;
            color: #64748b;
            font-size: 9px;
          }

          .princess-activity-card {
            border: 1px solid rgba(148, 163, 184, 0.14);
            border-radius: 15px;
            overflow: hidden;
            background: rgba(15, 23, 42, 0.7);
          }

          .princess-activity-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 15px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          }

          .princess-activity-row:last-child {
            border-bottom: none;
          }

          .princess-activity-avatar {
            width: 35px;
            height: 35px;
            flex: 0 0 35px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4338ca, #7c3aed);
            color: #ffffff;
            font-size: 11px;
            font-weight: 900;
          }

          .princess-activity-main {
            flex: 1;
            min-width: 0;
          }

          .princess-activity-name {
            overflow: hidden;
            color: #e2e8f0;
            font-size: 12px;
            font-weight: 800;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .princess-activity-position {
            margin-top: 3px;
            overflow: hidden;
            color: #64748b;
            font-size: 10px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .princess-activity-right {
            text-align: right;
          }

          .princess-activity-time {
            color: #94a3b8;
            font-size: 10px;
          }

          .princess-status-badge {
            display: inline-block;
            margin-top: 5px;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 800;
          }

          .princess-scanner-shell {
            padding: 16px;
            border: 1px solid rgba(129, 140, 248, 0.2);
            border-radius: 24px;
            background: linear-gradient(
              145deg,
              rgba(30, 27, 75, 0.95),
              rgba(15, 23, 42, 0.95)
            );
            box-shadow:
              0 25px 65px rgba(0, 0, 0, 0.28),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .princess-scanner-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 13px;
          }

          .princess-scanner-title {
            color: #c4b5fd;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.8px;
            text-transform: uppercase;
          }

          .princess-camera-status {
            padding: 6px 9px;
            border-radius: 20px;
            background: rgba(34, 197, 94, 0.12);
            color: #86efac;
            font-size: 9px;
            font-weight: 800;
          }

          .princess-camera-frame {
            position: relative;
            min-height: 390px;
            overflow: hidden;
            border: 1px solid rgba(129, 140, 248, 0.18);
            border-radius: 18px;
            background:
              linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px),
              #080d20;
            background-size: 30px 30px;
          }

          .princess-camera-frame:before,
          .princess-camera-frame:after {
            content: "";
            position: absolute;
            inset: 18px;
            pointer-events: none;
            border: 2px solid transparent;
            border-radius: 8px;
            background:
              linear-gradient(#080d20, #080d20) padding-box,
              linear-gradient(135deg, #c4b5fd, transparent 28%) border-box;
            opacity: 0.8;
            z-index: 2;
          }

          .princess-scanner-content {
            position: relative;
            z-index: 3;
            min-height: 390px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .princess-scanner-overlay {
            position: absolute;
            z-index: 5;
            left: 50%;
            bottom: 18px;
            transform: translateX(-50%);
            width: max-content;
            max-width: calc(100% - 35px);
            padding: 10px 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 30px;
            background: rgba(2, 6, 23, 0.82);
            color: #e2e8f0;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            backdrop-filter: blur(12px);
          }

          .princess-scanner-loading {
            min-height: 390px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #ffffff;
          }

          .princess-scanner-loading-title {
            margin-top: 20px;
            font-size: 16px;
            font-weight: 900;
          }

          .princess-scanner-loading-text {
            margin-top: 7px;
            color: #94a3b8;
            font-size: 11px;
          }

          .princess-action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 14px;
          }

          .princess-action-button {
            min-height: 58px;
            border: 1px solid rgba(129, 140, 248, 0.25);
            border-radius: 13px;
            background: linear-gradient(135deg, #6d28d9, #4f46e5);
            color: #ffffff;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: transform 0.2s ease, filter 0.2s ease;
          }

          .princess-action-button.secondary {
            background: rgba(51, 65, 85, 0.65);
            border-color: rgba(148, 163, 184, 0.2);
          }

          .princess-action-button:disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }

          .princess-action-button:not(:disabled):hover {
            transform: translateY(-2px);
            filter: brightness(1.12);
          }

          .princess-error {
            margin-top: 13px;
            padding: 13px 15px;
            border: 1px solid rgba(248, 113, 113, 0.3);
            border-radius: 13px;
            background: rgba(127, 29, 29, 0.2);
            color: #fca5a5;
            font-size: 12px;
            font-weight: 700;
            text-align: center;
          }

          .princess-scanner-help {
            margin-top: 15px;
            color: #64748b;
            font-size: 10px;
            line-height: 1.6;
            text-align: center;
          }

          .princess-kiosk-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 15px 28px;
            border-top: 1px solid rgba(148, 163, 184, 0.13);
            background: rgba(2, 6, 23, 0.65);
            color: #64748b;
            font-size: 10px;
          }

          @media (max-width: 1100px) {
            .princess-kiosk-content {
              grid-template-columns: 1fr;
            }

            .princess-right-panel {
              max-width: 720px;
              width: 100%;
              margin: 0 auto;
            }

            .princess-camera-frame,
            .princess-scanner-content,
            .princess-scanner-loading {
              min-height: 350px;
            }
          }

          @media (max-width: 700px) {
            .princess-kiosk-page {
              padding: 0;
            }

            .princess-kiosk-shell {
              min-height: 100vh;
              border-radius: 0;
            }

            .princess-kiosk-header {
              padding: 18px;
              align-items: flex-start;
            }

            .princess-system-info {
              display: none;
            }

            .princess-kiosk-content {
              padding: 20px 16px;
              gap: 20px;
            }

            .princess-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .princess-heading {
              font-size: 34px;
            }

            .princess-action-buttons {
              grid-template-columns: 1fr;
            }

            .princess-kiosk-footer {
              padding: 15px 18px;
              flex-direction: column;
              text-align: center;
            }
          }
        `}
      </style>

      <div className="princess-kiosk-shell">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="princess-kiosk-header">
          <div className="princess-brand">
            <div className="princess-brand-logo">P</div>

            <div>
              <div className="princess-brand-name">PRINCESS CUTZ</div>

              <div className="princess-brand-subtitle">Premium Grooming Experience</div>
            </div>
          </div>

          <div className="princess-system-info">
            <div className="princess-system-item">
              <div className="princess-system-label">Current Time</div>

              <div className="princess-system-value">
                <LiveClock />
              </div>
            </div>

            <div className="princess-system-item">
              <div className="princess-system-label">System Status</div>

              <div className="princess-system-value">
                <span className="princess-online-dot" />
                Kiosk Online
              </div>
            </div>

            <div className="princess-system-item">
              <div className="princess-system-label">Time Zone</div>

              <div className="princess-system-value">Africa/Lagos</div>
            </div>
          </div>
        </header>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <main className="princess-kiosk-content">
          {/* ===================================================
              LEFT SIDE
          ==================================================== */}

          <section className="princess-left-panel">
            {/* WELCOME */}
            <div>
              <div className="princess-pill">
                <span>●</span>
                Good Morning, Team
              </div>

              <h1 className="princess-heading">
                Welcome to
                <br />
                Princess Cutz
              </h1>

              <p className="princess-description">
                Position your staff card inside the scanner to automatically record your attendance.
                Fast, secure, and effortless.
              </p>

              {/* BUSINESS HOURS */}
              <div className="princess-hours-card">
                <div className="princess-hours-icon">◷</div>

                <div>
                  <div className="princess-hours-title">{getShiftTitle()}</div>

                  <div className="princess-hours-subtitle">{getGracePeriodText()}</div>
                </div>
              </div>
            </div>

            {/* =================================================
                KPI SECTION
            ================================================== */}

            <div>
              <div className="princess-section-heading">
                <span>Daily Station Telemetry</span>

                <span>Real-time shift registry</span>
              </div>

              <div className="princess-kpi-grid">
                {/* PRESENT */}
                <div className="princess-kpi-card">
                  <div className="princess-kpi-label">Present Today</div>

                  <div className="princess-kpi-value">
                    {kpiLoading ? '—' : kioskStats2.presentToday}
                  </div>

                  <div className="princess-kpi-caption">On the floor</div>
                </div>

                {/* CLOCKED IN */}
                <div className="princess-kpi-card">
                  <div className="princess-kpi-label">Clocked In</div>

                  <div className="princess-kpi-value">
                    {kpiLoading ? '—' : kioskStats2.presentToday}
                  </div>

                  <div className="princess-kpi-caption">Active staff</div>
                </div>

                {/* LATE */}
                <div className="princess-kpi-card">
                  <div className="princess-kpi-label">Late Arrivals</div>

                  <div className="princess-kpi-value">
                    {kpiLoading ? '—' : kioskStats2.lateToday}
                  </div>

                  <div className="princess-kpi-caption">Logged today</div>
                </div>

                {/* OUTSIDE */}
                <div className="princess-kpi-card">
                  <div className="princess-kpi-label">Outside</div>

                  <div className="princess-kpi-value">
                    {kpiLoading ? '—' : kioskStats2.currentlyOutside}
                  </div>

                  <div className="princess-kpi-caption">Registered</div>
                </div>
              </div>
            </div>

            {/* =================================================
                SECOND KPI ROW
            ================================================== */}

            <div>
              <div className="princess-kpi-grid">
                {/* CLOCKED OUT */}
                <div className="princess-kpi-card">
                  <div className="princess-kpi-label">Clocked Out Today</div>

                  <div className="princess-kpi-value">
                    {kpiLoading ? '—' : kioskStats2.clockedOutToday}
                  </div>

                  <div className="princess-kpi-caption">Completed shifts</div>
                </div>

                {/* AVERAGE HOURS */}
                <div className="princess-kpi-card">
                  <div className="princess-kpi-label">Average Working Hours</div>

                  <div className="princess-kpi-value">
                    {kpiLoading ? '—' : `${kioskStats2.averageWorkingHours}h`}
                  </div>

                  <div className="princess-kpi-caption">Staff average</div>
                </div>

                {/* OVERTIME */}
                <div className="princess-kpi-card">
                  <div className="princess-kpi-label">Overtime Hours</div>

                  <div className="princess-kpi-value">
                    {kpiLoading ? '—' : `${kioskStats2.overtimeHours}h`}
                  </div>

                  <div className="princess-kpi-caption">Logged today</div>
                </div>

                {/* TOTAL OUTSIDE */}
                <div className="princess-kpi-card">
                  <div className="princess-kpi-label">Total Outside</div>

                  <div className="princess-kpi-value">
                    {kpiLoading ? '—' : kioskStats2.currentlyOutside}
                  </div>

                  <div className="princess-kpi-caption">Currently outside</div>
                </div>
              </div>
            </div>

            {/* =================================================
                RECENT ACTIVITY
            ================================================== */}

            <div>
              <div className="princess-section-heading">
                <span>Live Entrance Stream</span>

                <span>Last 15 minutes</span>
              </div>

              <div className="princess-activity-card">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((activity, index) => {
                    const name = getActivityName(activity)
                    const position = getActivityPosition(activity)
                    const status = getActivityStatus(activity)

                    const statusStyle = getStatusColor(status)

                    return (
                      <div className="princess-activity-row" key={activity.id || index}>
                        <div className="princess-activity-avatar">{getActivityInitials(name)}</div>

                        <div className="princess-activity-main">
                          <div className="princess-activity-name">{name}</div>

                          <div className="princess-activity-position">{position}</div>
                        </div>

                        <div className="princess-activity-right">
                          <div className="princess-activity-time">
                            {formatActivityTime(
                              activity.clockIn || activity.clockOut || activity.createdAt,
                            )}
                          </div>

                          <span
                            className="princess-status-badge"
                            style={{
                              background: statusStyle.background,
                              color: statusStyle.color,
                            }}
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div
                    style={{
                      padding: '35px 20px',
                      color: '#64748b',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  >
                    No recent attendance activity
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ===================================================
              RIGHT SIDE
          ==================================================== */}

          <section className="princess-right-panel">
            <div className="princess-scanner-shell">
              <div className="princess-scanner-header">
                <div className="princess-scanner-title">QR Attendance Scanner</div>

                <div className="princess-camera-status">● Camera Active</div>
              </div>

              <div className="princess-camera-frame">
                <div className="princess-scanner-content">
                  {loading ? (
                    <div className="princess-scanner-loading">
                      <CSpinner
                        color="light"
                        style={{
                          width: 48,
                          height: 48,
                        }}
                      />

                      <div className="princess-scanner-loading-title">Verifying Staff ID</div>

                      <div className="princess-scanner-loading-text">
                        Please wait while we record your attendance...
                      </div>
                    </div>
                  ) : (
                    <QRScanner onSuccess={handleScan} />
                  )}
                </div>

                {!loading && !error && (
                  <div className="princess-scanner-overlay">
                    Position your QR card inside the frame
                  </div>
                )}
              </div>

              {/* ERROR */}
              {error && <div className="princess-error">{error}</div>}

              {/* ACTION BUTTONS */}
              <div className="princess-action-buttons">
                <button
                  type="button"
                  className="princess-action-button"
                  disabled={loading}
                  onClick={() => {
                    setError('')
                  }}
                >
                  ↪ CLOCK IN
                </button>

                <button
                  type="button"
                  className="princess-action-button secondary"
                  disabled={loading}
                  onClick={() => {
                    setError('')
                  }}
                >
                  ⇥ CLOCK OUT
                </button>
              </div>

              <div className="princess-scanner-help">
                Scan your staff QR card to continue.
                <br />
                Your attendance will be recorded automatically.
              </div>
            </div>
          </section>
        </main>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="princess-kiosk-footer">
          <div>Princess Cutz Terminal OS v1.0</div>

          <div>Biometric & Optical QR Recognition</div>

          <div>Secure Staff Attendance</div>
        </footer>
      </div>
    </div>
  )
}

export default ScanScreen
