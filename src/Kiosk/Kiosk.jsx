import { useState } from 'react'

import ScanScreen from './ScanScreen'
import ActionScreen from './ActionScreen'
import SuccessScreen from './SuccessScreen'

const Kiosk = () => {
  const [screen, setScreen] = useState('scan')
  const [staff, setStaff] = useState(null)
  const [nextAction, setNextAction] = useState('')
  const [successData, setSuccessData] = useState(null)

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
