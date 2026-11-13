import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const QRScanner = ({ onSuccess, onCameraStream, active = true }) => {
  const scannerRef = useRef(null)
  const onSuccessRef = useRef(onSuccess)
  const onCameraStreamRef = useRef(onCameraStream)
  const processingRef = useRef(false)

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onCameraStreamRef.current = onCameraStream
  }, [onSuccess, onCameraStream])

  useEffect(() => {
    let mounted = true

    const html5QrCode = new Html5Qrcode('reader')
    scannerRef.current = html5QrCode

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
          if (!mounted || processingRef.current) return

          processingRef.current = true

          // Pause QR decoding, but keep the camera stream running.
          try {
            html5QrCode.pause()
          } catch (error) {
            console.warn('Unable to pause QR scanner:', error)
          }

          const video = document.querySelector('#reader video')
          const stream = video?.srcObject

          if (stream) {
            onCameraStreamRef.current?.(stream)
          }

          onSuccessRef.current?.(decodedText, stream)
        },
        () => {},
      )
      .then(() => {
        if (!mounted) return

        const video = document.querySelector('#reader video')
        const stream = video?.srcObject

        if (stream) {
          onCameraStreamRef.current?.(stream)
        }
      })
      .catch((err) => {
        console.error('Camera Error:', err)
      })

    return () => {
      mounted = false
      processingRef.current = false

      // Do not stop the scanner here. Kiosk keeps this component mounted.
      // It will be stopped when the kiosk itself is removed.
    }
  }, [])

  useEffect(() => {
    const scanner = scannerRef.current
    if (!scanner) return

    if (!active) {
      try {
        if (scanner.getState() === 2) {
          scanner.pause()
        }
      } catch (error) {
        console.warn('Scanner pause:', error)
      }
      return
    }

    try {
      if (scanner.getState() === 2 && !processingRef.current) {
        scanner.resume()
      }
    } catch (error) {
      console.warn('Scanner resume:', error)
    }

    if (active) {
      processingRef.current = false
    }
  }, [active])

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
