import { useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const QRScanner = ({ onSuccess }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode('reader')

    const config = {
      fps: 5,
      qrbox: {
        width: 320,
        height: 320,
      },
      aspectRatio: 1.0,
    }

    html5QrCode
      .start(
        { facingMode: 'user' },
        config,
        (decodedText) => {
          onSuccess(decodedText)
        },
        () => {},
      )
      .catch((err) => {
        console.error('Camera Error:', err)
      })

    return () => {
      html5QrCode
        .stop()
        .then(() => {
          html5QrCode.clear()
        })
        .catch(() => {})
    }
  }, [])

  return (
    <div
      id="reader"
      style={{
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    />
  )
}

export default QRScanner
