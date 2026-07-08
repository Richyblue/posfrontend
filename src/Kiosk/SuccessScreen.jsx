import { useEffect } from 'react'

const SuccessScreen = ({ setScreen }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen('scan')
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        height: '100vh',
        background: '#198754',
        color: '#fff',
      }}
    >
      <div className="text-center">
        <h1
          style={{
            fontSize: 90,
          }}
        >
          ✅
        </h1>

        <h1>Successful</h1>

        <h4>Attendance Recorded</h4>

        <p className="mt-3">Returning to Scanner...</p>
      </div>
    </div>
  )
}

export default SuccessScreen
