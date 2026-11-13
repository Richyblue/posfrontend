import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const QRScanner = ({ onSuccess, onCameraStream, active = true }) => {
  const scannerRef = useRef(null)
  const startedRef = useRef(false)
  const successRef = useRef(false)
  const mountedRef = useRef(false)

  const onSuccessRef = useRef(onSuccess)
  const onCameraStreamRef = useRef(onCameraStream)

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    onCameraStreamRef.current = onCameraStream
  }, [onCameraStream])

  useEffect(() => {
    let cancelled = false

    const startScanner = async () => {
      if (startedRef.current || cancelled) return

      try {
        const scanner = new Html5Qrcode('reader', {
          verbose: false,
        })

        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'user' },
          {
            fps: 5,
            qrbox: {
              width: 320,
              height: 320,
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (successRef.current || !mountedRef.current) return

            successRef.current = true

            // Pause QR decoding without stopping the camera video.
            try {
              scanner.pause(false)
            } catch (error) {
              console.warn('Unable to pause QR decoding:', error)
            }

            onSuccessRef.current?.(decodedText)
          },
          () => {},
        )

        startedRef.current = true

        if (cancelled) {
          await scanner.stop().catch(() => {})
          await scanner.clear().catch(() => {})
          return
        }

        const video = document.querySelector('#reader video')

        if (video?.srcObject) {
          onCameraStreamRef.current?.(video.srcObject)
        }
      } catch (error) {
        console.error('QR scanner initialization failed:', error)
      }
    }

    mountedRef.current = true
    startScanner()

    return () => {
      cancelled = true
      mountedRef.current = false

      // Stop the camera only when this component is genuinely unmounted.
      const scanner = scannerRef.current

      if (scanner && startedRef.current) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch((error) => {
            console.warn('QR scanner cleanup:', error)
          })
      }

      scannerRef.current = null
      startedRef.current = false
    }
  }, [])

  useEffect(() => {
    const scanner = scannerRef.current

    if (!scanner || !startedRef.current) return

    try {
      if (!active) {
        scanner.pause(false)
      } else {
        successRef.current = false
        scanner.resume()
      }
    } catch (error) {
      console.warn('QR scanner active-state update:', error)
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
