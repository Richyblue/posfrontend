import { useEffect, useRef, useState, useCallback } from 'react'

import { CAlert, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'

import * as faceapi from '@vladmandic/face-api'

import '@tensorflow/tfjs-backend-cpu'

import { verifyStaffFace } from '../services/kioskApi'

// =========================================================
// CONFIGURATION
// =========================================================

const MODEL_URL = '/models/face-api'

let tensorflowPromise = null
let faceModelsPromise = null

// =========================================================
// STEP 1: INITIALIZE TENSORFLOW
// =========================================================

const initializeTensorFlow = async () => {
  if (!tensorflowPromise) {
    tensorflowPromise = (async () => {
      const tf = faceapi.tf

      if (!tf) {
        throw new Error('TensorFlow.js is unavailable.')
      }

      const backendReady = await tf.setBackend('cpu')

      if (!backendReady) {
        throw new Error('Unable to initialize TensorFlow CPU backend.')
      }

      await tf.ready()

      const activeBackend = tf.getBackend()

      if (activeBackend !== 'cpu') {
        throw new Error(`Unexpected TensorFlow backend: ${activeBackend}`)
      }

      console.log('[TENSORFLOW] Initialized successfully:', activeBackend)

      return tf
    })().catch((error) => {
      tensorflowPromise = null
      throw error
    })
  }

  return tensorflowPromise
}

// =========================================================
// STEP 2: LOAD FACE RECOGNITION MODELS
// =========================================================

const loadFaceModels = async (onProgress) => {
  if (
    faceapi.nets.tinyFaceDetector.isLoaded &&
    faceapi.nets.faceLandmark68TinyNet.isLoaded &&
    faceapi.nets.faceRecognitionNet.isLoaded
  ) {
    console.log('[FACE MODEL] All models already loaded.')
    return
  }

  if (!faceModelsPromise) {
    faceModelsPromise = (async () => {
      await initializeTensorFlow()

      onProgress?.('Loading face recognition models...')

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])

      if (
        !faceapi.nets.tinyFaceDetector.isLoaded ||
        !faceapi.nets.faceLandmark68TinyNet.isLoaded ||
        !faceapi.nets.faceRecognitionNet.isLoaded
      ) {
        throw new Error('One or more face recognition models failed to load.')
      }

      await faceapi.tf.ready()

      console.log('[FACE MODEL] All models loaded successfully.')
      console.log('[FACE MODEL] Backend:', faceapi.tf.getBackend())
    })().catch((error) => {
      faceModelsPromise = null
      throw error
    })
  }

  await faceModelsPromise
}

// =========================================================
// STEP 3: WAIT FOR CAMERA VIDEO
// =========================================================

const waitForVideoReady = async (video) => {
  if (video.readyState >= 2) return

  await new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener('loadeddata', handleLoaded)
      video.removeEventListener('error', handleError)
    }

    const handleLoaded = () => {
      cleanup()
      resolve()
    }

    const handleError = () => {
      cleanup()
      reject(new Error('Unable to initialize camera video.'))
    }

    video.addEventListener('loadeddata', handleLoaded, { once: true })
    video.addEventListener('error', handleError, { once: true })
  })
}

// =========================================================
// FACE VERIFICATION COMPONENT
// =========================================================

const FaceVerificationScreen = ({ staff, setVerificationToken, setScreen, onCancel }) => {
  // =======================================================
  // REFS
  // =======================================================

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const activeRef = useRef(false)
  const detectingRef = useRef(false)
  const verificationStartedRef = useRef(false)

  // =======================================================
  // STATE
  // =======================================================

  const [status, setStatus] = useState('Initializing face recognition...')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)

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
      streamRef.current.getTracks().forEach((track) => track.stop())
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
  // VERIFY DETECTED FACE AUTOMATICALLY
  // =======================================================

  const verifyDetectedFace = useCallback(
    async (found) => {
      if (verificationStartedRef.current || !activeRef.current) {
        return
      }

      verificationStartedRef.current = true

      try {
        setBusy(true)
        setError('')
        setStatus('Face detected. Preparing face identity...')

        if (!staff?.id) {
          throw new Error('Staff identification is missing.')
        }

        if (!staff?.qrCode) {
          throw new Error('Staff QR identity is missing. Please scan the staff QR code again.')
        }

        const descriptor = Array.from(found.descriptor)

        if (descriptor.length !== 128) {
          throw new Error('Unable to generate a valid face identity.')
        }

        setStatus('Verifying your identity...')

        const response = await verifyStaffFace({
          staffId: staff.id,
          qrCode: staff.qrCode,
          descriptor,
        })

        console.log('[FACE VERIFICATION RESPONSE]', response?.data)

        const verificationToken =
          response?.data?.verificationToken ||
          response?.data?.data?.verificationToken ||
          response?.verificationToken

        if (!verificationToken) {
          throw new Error(response?.data?.message || 'Server did not return a verification token.')
        }

        setStatus('Identity verified successfully.')

        setVerificationToken(verificationToken)

        stopCamera()

        setScreen('action')
      } catch (err) {
        console.error('[FACE VERIFICATION ERROR]', err)

        verificationStartedRef.current = false

        setError(
          err.response?.data?.message ||
            err.message ||
            'Face verification failed. Please try again.',
        )

        setStatus('Face verification unsuccessful. Please try again.')
      } finally {
        setBusy(false)
      }
    },
    [staff, setVerificationToken, setScreen, stopCamera],
  )

  // =======================================================
  // START SIMPLE FACE DETECTION
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
        verificationStartedRef.current
      ) {
        return
      }

      detectingRef.current = true

      try {
        await faceapi.tf.ready()

        const found = await faceapi
          .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.4,
            }),
          )
          .withFaceLandmarks(true)
          .withFaceDescriptor()

        if (!activeRef.current) return

        if (!found) {
          setStatus('Position your face clearly in front of the camera.')
          return
        }

        console.log('[FACE DETECTION] Face detected successfully.')

        // Stop detection and verify the captured face.
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        await verifyDetectedFace(found)
      } catch (err) {
        console.error('[FACE DETECTION ERROR]', err)
        setStatus('Unable to detect your face. Please adjust your position.')
      } finally {
        detectingRef.current = false
      }
    }, 500)
  }, [verifyDetectedFace])

  // =========================================================
  // INITIALIZE MODELS AND CAMERA
  // =========================================================

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        activeRef.current = true
        verificationStartedRef.current = false

        setBusy(true)
        setError('')
        setStatus('Checking browser compatibility...')

        if (!window.isSecureContext) {
          throw new Error('Face verification requires HTTPS or localhost.')
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is unavailable in this browser.')
        }

        // Initialize TensorFlow.
        setStatus('Initializing TensorFlow CPU engine...')

        await initializeTensorFlow()

        if (!mounted || !activeRef.current) return

        // Load face models.
        setStatus('Loading face recognition models...')

        await loadFaceModels((message) => {
          if (mounted) setStatus(message)
        })

        if (!mounted || !activeRef.current) return

        await faceapi.tf.ready()

        // Start camera.
        setStatus('Face models loaded. Starting camera...')

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })

        if (!mounted || !activeRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        const video = videoRef.current

        if (!video) {
          throw new Error('Camera video element is unavailable.')
        }

        video.srcObject = stream

        await video.play()
        await waitForVideoReady(video)

        if (!mounted || !activeRef.current) return

        setCameraReady(true)
        setBusy(false)

        setStatus('Camera ready. Looking for your face...')

        // Begin automatic face detection.
        startFaceDetection()
      } catch (err) {
        console.error('[FACE VERIFICATION INITIALIZATION ERROR]', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          modelUrl: MODEL_URL,
          tensorflowBackend: faceapi.tf?.getBackend?.(),
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
  }, [startFaceDetection, stopCamera])

  // =========================================================
  // RETRY VERIFICATION
  // =========================================================

  const handleRetry = () => {
    verificationStartedRef.current = false
    setError('')
    setBusy(false)
    setStatus('Looking for your face...')

    if (cameraReady) {
      startFaceDetection()
    }
  }

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = () => {
    stopCamera()
    onCancel?.()
  }

  // =========================================================
  // RENDER UI
  // =========================================================

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

          {/* STATUS */}

          {busy && (
            <div className="my-3">
              <CSpinner />
              <span className="ms-2">{status}</span>
            </div>
          )}

          {!busy && <p className="mt-3">{status}</p>}

          {/* CAMERA READY */}

          {cameraReady && !busy && !error && (
            <CAlert color="info">
              Keep your face clearly visible in front of the camera. Verification will happen
              automatically.
            </CAlert>
          )}

          {/* ERROR */}

          {error && <CAlert color="danger">{error}</CAlert>}

          {/* BUTTONS */}

          <div className="d-flex justify-content-center gap-2 mt-3">
            <CButton color="secondary" variant="outline" onClick={handleCancel} disabled={busy}>
              Cancel
            </CButton>

            {error && (
              <CButton color="success" onClick={handleRetry} disabled={busy || !cameraReady}>
                Retry Face Verification
              </CButton>
            )}
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
