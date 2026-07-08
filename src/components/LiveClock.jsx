import { useEffect, useState } from 'react'

const LiveClock = () => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return <h2 className="fw-bold text-primary">{time.toLocaleTimeString()}</h2>
}

export default LiveClock
