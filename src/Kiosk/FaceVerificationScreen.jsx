import { useEffect, useRef, useState, useCallback } from 'react'

import { CAlert, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'

import * as faceapi from '@vladmandic/face-api'

import { verifyStaffFace } from '../services/kioskApi'

// =========================================================
// CONFIGURATION
// =========================================================

const MODEL_URL = '/models/face-api'

const FaceVerificationScreen = ({ staff, setVerificationToken, setScreen, onCancel }) => {
  // =======================================================
  // REFS
  // =======================================================

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const activeRef = useRef(false)
  const detectingRef = useRef(false)

  const startXRef = useRef(null)
  const challengePassedRef = useRef(false)

  // =======================================================
  // STATE
  // =======================================================

  const [status, setStatus] = useState('Loading face recognition models...')

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)

  const [cameraReady, setCameraReady] = useState(false)
  const [challengePassed, setChallengePassed] = useState(false)

  const [challenge] = useState(() => (Math.random() > 0.5 ? 'left' : 'right'))

  // =======================================================
  // STOP CAMERA
  // =======================================================

  const stopCamera = useCallback(() => {
    activeRef.current = false

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })

      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    detectingRef.current = false
    setCameraReady(false)
  }, [])

  // =======================================================
  // LOAD FACE MODELS
  // =======================================================

  const loadFaceModels = async () => {
    const models = [
      {
        name: 'Face detector',
        loader: faceapi.nets.tinyFaceDetector,
      },
      {
        name: 'Face landmarks',
        loader: faceapi.nets.faceLandmark68Net,
      },
      {
        name: 'Face recognition',
        loader: faceapi.nets.faceRecognitionNet,
      },
    ]

    for (const model of models) {
      if (!model.loader.isLoaded) {
        setStatus(`Loading ${model.name} model...`)
        await model.loader.loadFromUri(MODEL_URL)
      }
    }
  }

  // =======================================================
  // FACE DETECTION
  // =======================================================

  const startFaceDetection = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
    }

    intervalRef.current = window.setInterval(async () => {
      const video = videoRef.current

      if (
        !activeRef.current ||
        !video ||
        video.readyState < 2 ||
        detectingRef.current ||
        challengePassedRef.current
      ) {
        return
      }

      detectingRef.current = true

      try {
        const found = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
          }),
        )

        if (!activeRef.current) return

        if (!found) {
          setStatus('Position your face clearly inside the camera view.')
          return
        }

        const faceCenter = found.box.x + found.box.width / 2

        const videoCenter = video.videoWidth / 2

        const offset = faceCenter - videoCenter

        if (startXRef.current === null) {
          startXRef.current = offset

          setStatus(`Gently turn your head to the ${challenge}.`)

          return
        }

        const movementDetected =
          challenge === 'left' ? offset < startXRef.current - 22 : offset > startXRef.current + 22

        if (movementDetected) {
          challengePassedRef.current = true

          setChallengePassed(true)

          setStatus('Movement detected. Click Verify My Face to continue.')

          if (intervalRef.current) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      } catch (err) {
        console.error('[FACE DETECTION ERROR]', err)
      } finally {
        detectingRef.current = false
      }
    }, 450)
  }, [challenge])

  // =======================================================
  // INITIALIZE MODELS AND CAMERA
  // =======================================================

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        activeRef.current = true

        setBusy(true)
        setError('')

        setStatus('Checking browser compatibility...')

        if (!window.isSecureContext) {
          throw new Error('Face verification requires HTTPS or localhost.')
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is unavailable in this browser.')
        }

        // Load models
        await loadFaceModels()

        if (!mounted) return

        setStatus('Face models loaded. Starting camera...')

        // Request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        const video = videoRef.current

        if (!video) {
          throw new Error('Camera video element is unavailable.')
        }

        video.srcObject = stream

        // Wait for camera video
        await new Promise((resolve, reject) => {
          const handleLoaded = () => {
            cleanup()
            resolve()
          }

          const handleError = () => {
            cleanup()
            reject(new Error('Unable to initialize camera video.'))
          }

          const cleanup = () => {
            video.removeEventListener('loadedmetadata', handleLoaded)

            video.removeEventListener('error', handleError)
          }

          if (video.readyState >= 2) {
            resolve()
            return
          }

          video.addEventListener('loadedmetadata', handleLoaded, { once: true })

          video.addEventListener('error', handleError, { once: true })

          video.play().catch((err) => {
            cleanup()
            reject(err)
          })
        })

        await video.play()

        if (!mounted) return

        setCameraReady(true)
        setBusy(false)

        setStatus(`Look at the camera, then gently turn your head to the ${challenge}.`)

        // Start detection
        startFaceDetection()
      } catch (err) {
        console.error('[FACE VERIFICATION INITIALIZATION ERROR]', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          modelUrl: MODEL_URL,
        })

        if (!mounted) return

        let message = err.message || 'Unknown initialization error.'

        if (err.name === 'NotAllowedError') {
          message = 'Camera permission denied. Please allow camera access.'
        } else if (err.name === 'NotFoundError') {
          message = 'No camera was detected on this device.'
        } else if (err.name === 'NotReadableError') {
          message = 'Camera is being used by another application.'
        } else if (err.name === 'OverconstrainedError') {
          message = 'The requested camera configuration is unavailable.'
        }

        setError(`Unable to start face verification: ${message}`)

        setBusy(false)
        stopCamera()
      }
    }

    initialize()

    return () => {
      mounted = false
      stopCamera()
    }
  }, [challenge, startFaceDetection, stopCamera])

  // =======================================================
  // SUBMIT FACE VERIFICATION
  // =======================================================

  const submitVerification = async () => {
    if (!challengePassed || !cameraReady || !videoRef.current || busy) {
      return
    }

    try {
      setBusy(true)
      setError('')

      setStatus('Capturing face descriptor...')

      const video = videoRef.current

      if (video.readyState < 2) {
        throw new Error('Camera is not ready. Please try again.')
      }

      const found = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
          }),
        )
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!found) {
        throw new Error('Face not detected. Please position your face and try again.')
      }

      const descriptor = Array.from(found.descriptor)

      if (descriptor.length !== 128) {
        throw new Error('Invalid face descriptor generated.')
      }

      if (!staff?.id) {
        throw new Error('Staff identification is missing.')
      }

      if (!staff?.qrCode) {
        throw new Error('Staff QR identity is missing. Please scan the staff QR code again.')
      }

      setStatus('Verifying your identity...')

      const response = await verifyStaffFace({
        staffId: staff.id,
        qrCode: staff.qrCode,
        descriptor,
      })

      const verificationToken =
        response?.data?.verificationToken ||
        response?.data?.data?.verificationToken ||
        response?.verificationToken

      if (!verificationToken) {
        console.error('[FACE VERIFICATION RESPONSE]', response?.data)

        throw new Error('Server did not return a verification token.')
      }

      setStatus('Identity verified successfully.')

      setVerificationToken(verificationToken)

      stopCamera()

      setScreen('action')
    } catch (err) {
      console.error('[FACE VERIFICATION SUBMISSION ERROR]', err)

      setError(err.response?.data?.message || err.message || 'Face verification failed.')
    } finally {
      setBusy(false)
    }
  }

  // =======================================================
  // CANCEL
  // =======================================================

  const handleCancel = () => {
    stopCamera()
    onCancel?.()
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="container py-4">
      <CCard className="mx-auto shadow-sm" style={{ maxWidth: 650 }}>
        <CCardBody className="text-center p-4">
          <h3 className="mb-2">Face Verification</h3>

          <p className="text-body-secondary">
            Confirming identity for <strong>{staff?.fullname || 'Staff'}</strong>
          </p>

          {/* CAMERA */}

          <div className="position-relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                maxWidth: 480,
                minHeight: 250,
                borderRadius: 12,
                background: '#111',
                transform: 'scaleX(-1)',
                objectFit: 'cover',
              }}
            />
          </div>

          {/* LOADING */}

          {busy && (
            <div className="my-3">
              <CSpinner />
              <span className="ms-2">{status}</span>
            </div>
          )}

          {!busy && <p className="mt-3">{status}</p>}

          {/* CAMERA STATUS */}

          {cameraReady && !challengePassed && !busy && (
            <CAlert color="info">
              Please gently turn your head to the <strong>{challenge}</strong>.
            </CAlert>
          )}

          {/* CHALLENGE COMPLETE */}

          {challengePassed && (
            <CAlert color="success">
              Face movement challenge completed. You can now verify your identity.
            </CAlert>
          )}

          {/* ERRORS */}

          {error && <CAlert color="danger">{error}</CAlert>}

          {/* ACTION BUTTONS */}

          <div className="d-flex justify-content-center gap-2 mt-3">
            <CButton color="secondary" variant="outline" onClick={handleCancel} disabled={busy}>
              Cancel
            </CButton>

            <CButton
              color="success"
              onClick={submitVerification}
              disabled={busy || !cameraReady || !challengePassed}
            >
              {busy ? 'Verifying...' : 'Verify My Face'}
            </CButton>
          </div>

          <small className="d-block text-body-secondary mt-3">
            Face verification is required before attendance can continue.
          </small>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default FaceVerificationScreen
