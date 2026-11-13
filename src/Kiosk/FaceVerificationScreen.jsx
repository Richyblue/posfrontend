import { useEffect, useRef, useState, useCallback } from 'react'

import { CAlert, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'

import * as faceapi from '@vladmandic/face-api'

import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'

import { verifyStaffFace } from '../services/kioskApi'

// =========================================================
// CONFIGURATION
// =========================================================

const MODEL_URL = '/models/face-api'

const DETECTION_INTERVAL = 250
const MAX_INITIALIZATION_RETRIES = 2

let tensorflowPromise = null
let faceModelsPromise = null

// =========================================================
// STEP 1: INITIALIZE TENSORFLOW
// GPU FIRST, CPU FALLBACK
// =========================================================

const initializeTensorFlow = async () => {
  if (!tensorflowPromise) {
    tensorflowPromise = (async () => {
      const tf = faceapi.tf

      if (!tf) {
        throw new Error('TensorFlow.js is unavailable.')
      }

      let backend = tf.getBackend()

      // Prefer WebGL for faster browser inference.
      if (backend !== 'webgl') {
        try {
          const ready = await tf.setBackend('webgl')

          if (!ready) {
            throw new Error('WebGL backend unavailable.')
          }

          await tf.ready()
          backend = tf.getBackend()
        } catch (webglError) {
          console.warn('[TENSORFLOW] WebGL unavailable. Falling back to CPU.', webglError)

          const ready = await tf.setBackend('cpu')

          if (!ready) {
            throw new Error('Unable to initialize TensorFlow CPU backend.')
          }

          await tf.ready()
          backend = tf.getBackend()
        }
      }

      console.log('[TENSORFLOW] Active backend:', backend)

      return tf
    })().catch((error) => {
      tensorflowPromise = null
      throw error
    })
  }

  return tensorflowPromise
}

// =========================================================
// STEP 2: LOAD MODELS
// =========================================================

const loadFaceModels = async (onProgress) => {
  const allLoaded =
    faceapi.nets.tinyFaceDetector.isLoaded &&
    faceapi.nets.faceLandmark68TinyNet.isLoaded &&
    faceapi.nets.faceRecognitionNet.isLoaded

  if (allLoaded) {
    console.log('[FACE MODEL] Models already loaded.')
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
        throw new Error('One or more face models failed to load.')
      }

      await faceapi.tf.ready()

      console.log('[FACE MODEL] All models loaded.')
      console.log('[FACE MODEL] Backend:', faceapi.tf.getBackend())
    })().catch((error) => {
      faceModelsPromise = null
      throw error
    })
  }

  await faceModelsPromise
}

// =========================================================
// STEP 3: CAMERA VIDEO READY
// =========================================================

const waitForVideoReady = (video) => {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      resolve()
      return
    }

    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Camera initialization timed out.'))
    }, 15000)

    const cleanup = () => {
      window.clearTimeout(timeout)
      video.removeEventListener('loadeddata', handleLoaded)
      video.removeEventListener('error', handleError)
    }

    const handleLoaded = () => {
      if (video.videoWidth > 0) {
        cleanup()
        resolve()
      }
    }

    const handleError = () => {
      cleanup()
      reject(new Error('Unable to initialize camera video.'))
    }

    video.addEventListener('loadeddata', handleLoaded)
    video.addEventListener('error', handleError)
  })
}

// =========================================================
// STEP 4: COMPONENT
// =========================================================

const FaceVerificationScreen = ({ staff, setVerificationToken, setScreen, onCancel }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timeoutRef = useRef(null)

  const activeRef = useRef(false)
  const detectingRef = useRef(false)
  const verificationStartedRef = useRef(false)
  const detectionCountRef = useRef(0)

  const [status, setStatus] = useState('Initializing face recognition...')

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // =======================================================
  // STOP CAMERA
  // =======================================================

  const stopCamera = useCallback(() => {
    activeRef.current = false

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
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
  // STEP 5: VERIFY FACE WITH BACKEND
  // =======================================================

  const verifyDetectedFace = useCallback(
    async (found) => {
      if (verificationStartedRef.current || !activeRef.current) {
        return false
      }

      verificationStartedRef.current = true

      try {
        setBusy(true)
        setError('')
        setStatus('Face detected. Preparing identity...')

        if (!staff?.id) {
          throw new Error('Staff identification is missing.')
        }

        if (!staff?.qrCode) {
          throw new Error('Staff QR identity is missing. Please scan your QR code again.')
        }

        const descriptor = Array.from(found.descriptor)

        if (descriptor.length !== 128 || descriptor.some((value) => !Number.isFinite(value))) {
          throw new Error('Invalid face identity descriptor.')
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

        if (!activeRef.current) {
          return false
        }

        setStatus('Identity verified successfully.')

        setVerificationToken(verificationToken)

        stopCamera()

        setScreen('action')

        return true
      } catch (err) {
        console.error('[FACE VERIFICATION ERROR]', err)

        verificationStartedRef.current = false

        if (activeRef.current) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Face verification failed. Please try again.',
          )

          setStatus('Verification unsuccessful. Looking for your face again...')
        }

        return false
      } finally {
        if (activeRef.current) {
          setBusy(false)
        }
      }
    },
    [staff, setVerificationToken, setScreen, stopCamera],
  )

  // =======================================================
  // STEP 6: ADAPTIVE FACE DETECTION
  // =======================================================

  const startFaceDetection = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    const detect = async () => {
      const video = videoRef.current

      if (
        !activeRef.current ||
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        detectingRef.current ||
        verificationStartedRef.current
      ) {
        if (activeRef.current) {
          timeoutRef.current = window.setTimeout(detect, DETECTION_INTERVAL)
        }

        return
      }

      detectingRef.current = true

      try {
        detectionCountRef.current += 1

        /*
         * Normal detection:
         * 320 input size for speed.
         *
         * Every fifth attempt:
         * 416 input size with a lower threshold
         * for more difficult camera conditions.
         */

        const useSensitiveDetection = detectionCountRef.current % 5 === 0

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: useSensitiveDetection ? 416 : 320,
          scoreThreshold: useSensitiveDetection ? 0.2 : 0.28,
        })

        // First detect the face only.
        const detection = await faceapi.detectSingleFace(video, options)

        if (!activeRef.current) return

        if (!detection) {
          setStatus('Looking for your face. Move closer and face the camera.')

          return
        }

        console.log('[FACE DETECTION] Face found. Generating identity descriptor...')

        setError('')
        setStatus('Face detected. Reading facial features...')

        /*
         * Only calculate landmarks and descriptor after
         * a face has been detected. This saves processing time.
         */

        const found = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks(true)
          .withFaceDescriptor()

        if (!activeRef.current) return

        if (!found?.descriptor) {
          setStatus('Face detected, but facial details are unclear. Adjust your position.')

          return
        }

        await verifyDetectedFace(found)
      } catch (err) {
        console.error('[FACE DETECTION ERROR]', err)

        if (activeRef.current) {
          setStatus('Detection interrupted. Trying again automatically...')
        }
      } finally {
        detectingRef.current = false

        // Continue detecting after unsuccessful attempts.
        if (activeRef.current && !verificationStartedRef.current) {
          timeoutRef.current = window.setTimeout(detect, DETECTION_INTERVAL)
        }
      }
    }

    detect()
  }, [verifyDetectedFace])

  // =======================================================
  // STEP 7: INITIALIZE CAMERA AND MODELS
  // =======================================================

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        activeRef.current = true
        verificationStartedRef.current = false
        detectionCountRef.current = 0

        setBusy(true)
        setError('')
        setCameraReady(false)

        setStatus('Checking browser compatibility...')

        if (!window.isSecureContext) {
          throw new Error('Face verification requires HTTPS or localhost.')
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is unavailable in this browser.')
        }

        // Initialize TensorFlow.
        setStatus('Starting face recognition engine...')

        await initializeTensorFlow()

        if (!mounted || !activeRef.current) return

        // Load face models.
        setStatus('Loading face recognition models...')

        await loadFaceModels((message) => {
          if (mounted) setStatus(message)
        })

        if (!mounted || !activeRef.current) return

        // Start camera.
        setStatus('Starting camera...')

        let stream

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 24 },
            },
          })
        } catch (cameraError) {
          console.warn('[CAMERA] Preferred configuration failed. Trying fallback.', cameraError)

          // Fallback for cameras that cannot satisfy preferred settings.
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          })
        }

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

        const settings = stream.getVideoTracks()[0]?.getSettings()

        console.log('[CAMERA SETTINGS]', settings)

        setCameraReady(true)
        setBusy(false)

        setStatus('Camera ready. Looking for your face...')

        // Begin automatic detection.
        startFaceDetection()
      } catch (err) {
        console.error('[FACE VERIFICATION INITIALIZATION ERROR]', err)

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
  }, [retryCount, startFaceDetection, stopCamera])

  // =======================================================
  // STEP 8: RETRY
  // =======================================================

  const handleRetry = () => {
    stopCamera()

    verificationStartedRef.current = false
    detectingRef.current = false

    setError('')
    setBusy(true)
    setCameraReady(false)
    setStatus('Restarting face verification...')

    setRetryCount((count) => count + 1)
  }

  // =======================================================
  // STEP 9: CANCEL
  // =======================================================

  const handleCancel = () => {
    stopCamera()
    onCancel?.()
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="container py-4">
      <CCard className="mx-auto shadow-sm" style={{ maxWidth: 650 }}>
        <CCardBody className="text-center p-4">
          <h3 className="mb-2">Face Verification</h3>

          <p className="text-body-secondary">
            Confirming identity for{' '}
            <strong>{staff?.fullname || staff?.fullName || staff?.name || 'Staff'}</strong>
          </p>

          {/* CAMERA */}

          <div className="position-relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                display: 'block',
                width: '100%',
                maxWidth: 480,
                minHeight: 250,
                margin: '0 auto',
                borderRadius: 12,
                background: '#111',
                transform: 'scaleX(-1)',
                objectFit: 'cover',
              }}
            />

            {!cameraReady && (
              <div
                className="position-absolute top-50 start-50 translate-middle text-white"
                style={{ pointerEvents: 'none' }}
              >
                <CSpinner color="light" />
              </div>
            )}
          </div>

          {/* STATUS */}

          <div className="my-3">
            {busy && <CSpinner size="sm" className="me-2" />}

            <span>{status}</span>
          </div>

          {/* CAMERA READY */}

          {cameraReady && !error && (
            <CAlert color="info">
              Keep your face visible and look towards the camera. Verification happens
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
              <CButton color="success" onClick={handleRetry} disabled={busy}>
                Retry Face Verification
              </CButton>
            )}
          </div>

          <small className="d-block text-body-secondary mt-3">
            Identity verification is required before attendance can continue.
          </small>
        </CCardBody>
      </CCard>
    </div>
  )
}

export default FaceVerificationScreen
