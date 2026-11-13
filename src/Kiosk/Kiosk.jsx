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
  const [cameraStream, setCameraStream] = useState(null)

  const resetKiosk = () => {
    setStaff(null)
    setNextAction('')
    setVerificationToken('')
    setSuccessData(null)
    setScreen('scan')
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div
        style={{
          position: screen === 'scan' ? 'relative' : 'absolute',
          inset: screen === 'scan' ? 'auto' : 0,
          width: '100%',
          minHeight: '100vh',
          visibility: screen === 'scan' ? 'visible' : 'hidden',
          pointerEvents: screen === 'scan' ? 'auto' : 'none',
          zIndex: screen === 'scan' ? 1 : 0,
        }}
      >
        <ScanScreen
          setScreen={setScreen}
          setStaff={setStaff}
          setNextAction={setNextAction}
          cameraStream={cameraStream}
          setCameraStream={setCameraStream}
          scannerActive={screen === 'scan'}
        />
      </div>

      {screen === 'face' && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <FaceVerificationScreen
            staff={staff}
            cameraStream={cameraStream}
            setVerificationToken={setVerificationToken}
            setScreen={setScreen}
            onCancel={resetKiosk}
          />
        </div>
      )}

      {screen === 'action' && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <ActionScreen
            staff={staff}
            nextAction={nextAction}
            verificationToken={verificationToken}
            setScreen={setScreen}
            setSuccessData={setSuccessData}
          />
        </div>
      )}

      {screen === 'success' && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <SuccessScreen staff={staff} successData={successData} setScreen={resetKiosk} />
        </div>
      )}
    </div>
  )
}

export default Kiosk
