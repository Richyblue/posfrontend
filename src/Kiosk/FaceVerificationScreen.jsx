
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CSpinner,
} from '@coreui/react'

import * as faceapi from '@vladmandic/face-api'
import { verifyStaffFace } from '../services/kioskApi'

const MODEL_URL = '/models/face-api'

const FaceVerificationScreen = ({
  staff,
  setVerificationToken,
  setScreen,
  onCancel,
}) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const activeRef = useRef(false)

  const startXRef = useRef(null)
  const challengePassedRef = useRef(false)
  const detectingRef = useRef(false)

  const [status, setStatus] = useState('Loading face recognition models...')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)
  const [challengePassed, setChallengePassed] = useState(false)

  const [challenge] = useState(() =>
    Math.random() > 0.5 ? 'left' : 'right'
  )

  // Stop camera and detection
  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    setCameraReady(false)
  }, [])

  // Initialize face models and camera
  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        activeRef.current = true
        setBusy(true)
        setError('')
        setStatus('Loading face recognition models...')

        // Ensure browser supports camera access
        if (!window.isSecureContext) {
          throw new Error(
            'Face verification requires HTTPS or localhost.'
          )
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Camera access is unavailable in this browser.'
          )
        }

        // Load all required models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])

        if (!mounted) return

        setStatus('Face models loaded. Starting camera...')

        // Request camera access
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

        await new Promise((resolve, reject) => {
          if (video.readyState >= 2) {
            resolve()
            return
          }

          const onLoaded = () => {
            cleanup()
            resolve()
          }

          const onError = () => {
            cleanup()
            reject(new Error('Unable to initialize camera video.'))
          }

          const cleanup = () => {
            video.removeEventListener('loadeddata', onLoaded)
            video.removeEventListener('error', onError)
          }

          video.addEventListener('loadeddata', onLoaded, { once: true })
          video.addEventListener('error', onError, { once: true })

          video.play().catch((err) => {
            cleanup()
            reject(err)
          })
        })

        await video.play()

        if (!mounted) return

        setCameraReady(true)
        setBusy(false)

        setStatus(
          `Look at the camera, then gently turn your head to the ${challenge}.`
        )

        // Face detection loop
        intervalRef.current = window.setInterval(async () => {
          if (
            !activeRef.current ||
            !mounted ||
            !videoRef.current ||
            videoRef.current.readyState < 2 ||
            detectingRef.current ||
            challengePassedRef.current
          ) {
            return
          }

          try {
            detectingRef.current = true

            const found = await faceapi
              .detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({
                  inputSize: 320,
                  scoreThreshold: 0.5,
                })
              )
              .withFaceLandmarks()

            if (!mounted || !activeRef.current) return

            if (!found) {
              setStatus(
                'Position your face clearly inside the camera view.'
              )
              return
            }

            const video = videoRef.current

            const offset =
              found.detection.box.x +
              found.detection.box.width / 2 -
              video.videoWidth / 2

            if (startXRef.current === null) {
              startXRef.current = offset

              setStatus(
                `Turn your head slightly to the ${challenge}.`
              )

              return
            }

            const movementDetected =
              challenge === 'left'
                ? offset < startXRef.current - 22
                : offset > startXRef.current + 22

            if (movementDetected) {
              challengePassedRef.current = true

              setChallengePassed(true)

              setStatus(
                'Movement detected. Hold still while we verify your identity.'
              )
            }
          } catch (err) {
            console.error('[FACE DETECTION ERROR]', err)
          } finally {
            detectingRef.current = false
          }
        }, 450)

      } catch (err) {
        console.error('[FACE VERIFICATION INITIALIZATION ERROR]', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          secureContext: window.isSecureContext,
          cameraAvailable: !!navigator.mediaDevices?.getUserMedia,
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
      activeRef.current = false
      stopCamera()
    }
  }, [challenge, stopCamera])

  // Submit face verification
  const submitVerification = async () => {
    if (!challengePassed || !videoRef.current || busy) return

    try {
      setBusy(true)
      setError('')
      setStatus('Capturing face descriptor...')

      if (videoRef.current.readyState < 2) {
        throw new Error('Camera is not ready. Please try again.')
      }

      const found = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!found) {
        throw new Error('Face not detected. Please try again.')
      }

      const descriptor = Array.from(found.descriptor)

      if (descriptor.length !== 128) {
        throw new Error('Invalid face descriptor generated.')
      }

      if (!staff?.id) {
        throw new Error('Staff identification is missing.')
      }

      if (!staff?.qrCode) {
        throw new Error(
          'Staff QR identity is missing. Please scan the staff QR code again.'
        )
      }

      setStatus('Verifying your identity...')

      const response = await verifyStaffFace({
        staffId: staff.id,
        qrCode: staff.qrCode,
        descriptor,
      })

      const verificationToken =
        response?.data?.verificationToken ||
        response?.verificationToken

      if (!verificationToken) {
        throw new Error(
          'Server did not return a verification token.'
        )
      }

      setVerificationToken(verificationToken)

      stopCamera()

      setScreen('action')

    } catch (err) {
      console.error('[FACE VERIFICATION SUBMISSION ERROR]', err)

      setError(
        err.response?.data?.message ||
        err.message ||
        'Face verification failed.'
      )
    } finally {
      setBusy(false)
    }
  }

  // Cancel verification
  const handleCancel = () => {
    stopCamera()
    onCancel?.()
  }

  return (
    <div className="container py-4">
      <CCard
        className="mx-auto shadow-sm"
        style={{ maxWidth: 650 }}
      >
        <CCardBody className="text-center p-4">

          <h3>Face Verification</h3>

          <p>
            Confirming identity for{' '}
            <strong>{staff?.fullname || 'Staff'}</strong>
          </p>

          <div className="position-relative">

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                maxWidth: 480,
                borderRadius: 12,
                background: '#111',
                transform: 'scaleX(-1)',
                minHeight: 250,
                objectFit: 'cover',
              }}
            />

          </div>

          {busy && (
            <div className="my-3">
              <CSpinner />
              <span className="ms-2">{status}</span>
            </div>
          )}

          {!busy && (
            <p className="mt-3">{status}</p>
          )}

          {cameraReady && !busy && (
            <CAlert color="info">
              Please follow the head movement instruction.
            </CAlert>
          )}

          {challengePassed && (
            <CAlert color="success">
              Face movement challenge completed.
            </CAlert>
          )}

          {error && (
            <CAlert color="danger">
              {error}
            </CAlert>
          )}

          <div className="d-flex justify-content-center gap-2 mt-3">

            <CButton
              color="secondary"
              variant="outline"
              onClick={handleCancel}
              disabled={busy}
            >
              Cancel
            </CButton>

            <CButton
              color="success"
              onClick={submitVerification}
              disabled={
                busy ||
                !cameraReady ||
                !challengePassed
              }
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
