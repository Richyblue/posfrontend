import { useState } from 'react'
import ScanScreen from './ScanScreen'
import FaceVerificationScreen from './FaceVerificationScreen'
import ActionScreen from './ActionScreen'
import SuccessScreen from './SuccessScreen'

const Kiosk = () => {
  const [screen, setScreen] = useState('scan')
  const [staff, setStaff] = useState(null)
  const [nextAction, setNextAction] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [successData, setSuccessData] = useState(null)
  const resetKiosk = () => {
    setStaff(null)
    setNextAction('')
    setVerificationToken('')
    setSuccessData(null)
    setScreen('scan')
  }
  switch (screen) {
    case 'scan':
      return <ScanScreen setScreen={setScreen} setStaff={setStaff} setNextAction={setNextAction} />
    case 'face':
      return (
        <FaceVerificationScreen
          staff={staff}
          setVerificationToken={setVerificationToken}
          setScreen={setScreen}
          onCancel={resetKiosk}
        />
      )
    case 'action':
      return (
        <ActionScreen
          staff={staff}
          nextAction={nextAction}
          verificationToken={verificationToken}
          setScreen={setScreen}
          setSuccessData={setSuccessData}
        />
      )
    case 'success':
      return <SuccessScreen staff={staff} successData={successData} setScreen={resetKiosk} />
    default:
      return null
  }
}
export default Kiosk
