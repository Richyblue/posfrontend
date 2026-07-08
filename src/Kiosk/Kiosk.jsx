import { useState } from 'react'

import ScanScreen from './ScanScreen'

import ActionScreen from './ActionScreen'

import SuccessScreen from './SuccessScreen'

const Kiosk = () => {
  const [screen, setScreen] = useState('scan')

  const [staff, setStaff] = useState(null)

  const [nextAction, setNextAction] = useState('')

  switch (screen) {
    case 'scan':
      return <ScanScreen setScreen={setScreen} setStaff={setStaff} setNextAction={setNextAction} />

    case 'action':
      return <ActionScreen staff={staff} nextAction={nextAction} setScreen={setScreen} />

    case 'success':
      return <SuccessScreen setScreen={setScreen} />

    default:
      return null
  }
}

export default Kiosk
