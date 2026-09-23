import { useCallback, useEffect, useRef, useState } from 'react'

import ScanScreen from './ScanScreen'
import ActionScreen from './ActionScreen'
import SuccessScreen from './SuccessScreen'

const KIOSK_TIMEOUT = 30 * 1000 // 30 seconds

const Kiosk = () => {
  const [screen, setScreen] = useState('scan')
  const [staff, setStaff] = useState(null)
  const [nextAction, setNextAction] = useState('')
  const [successData, setSuccessData] = useState(null)

  const resetTimerRef = useRef(null)

  /**
   * Completely reset the kiosk
   */
  const resetKiosk = useCallback(() => {
    setScreen('scan')
    setStaff(null)
    setNextAction('')
    setSuccessData(null)
  }, [])

  /**
   * Automatically return to scan screen
   * after inactivity.
   */
  useEffect(() => {
    // Only use inactivity timeout when
    // the kiosk is not already on the scan screen.
    if (screen === 'scan') {
      return undefined
    }

    resetTimerRef.current = setTimeout(() => {
      resetKiosk()
    }, KIOSK_TIMEOUT)

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [screen, resetKiosk])

  /**
   * Global activity detection.
   *
   * If the customer is interacting with the tablet,
   * restart the inactivity timer.
   */
  useEffect(() => {
    const handleActivity = () => {
      if (screen === 'scan') {
        return
      }

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }

      resetTimerRef.current = setTimeout(() => {
        resetKiosk()
      }, KIOSK_TIMEOUT)
    }

    window.addEventListener('touchstart', handleActivity, {
      passive: true,
    })

    window.addEventListener('click', handleActivity)

    window.addEventListener('keydown', handleActivity)

    return () => {
      window.removeEventListener('touchstart', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
    }
  }, [screen, resetKiosk])

  /**
   * Render current kiosk screen
   */
  switch (screen) {
    case 'scan':
      return <ScanScreen setScreen={setScreen} setStaff={setStaff} setNextAction={setNextAction} />

    case 'action':
      return (
        <ActionScreen
          staff={staff}
          nextAction={nextAction}
          setScreen={setScreen}
          setSuccessData={setSuccessData}
        />
      )

    case 'success':
      return <SuccessScreen staff={staff} successData={successData} setScreen={setScreen} />

    default:
      return null
  }
}

export default Kiosk
