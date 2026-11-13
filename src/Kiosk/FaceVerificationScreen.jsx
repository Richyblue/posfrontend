import { useEffect, useRef, useState, useCallback } from 'react'
import { CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import * as faceapi from '@vladmandic/face-api'

import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'

import { verifyStaffFace } from '../services/kioskApi'

// =========================================================
// CONFIGURATION
// =========================================================

const MODEL_URL = '/models/face-api'

const DETECTION_INTERVAL = 350
const VERIFICATION_COOLDOWN = 2000

let tensorflowPromise = null
let faceModelsPromise = null

// =========================================================
// TENSORFLOW INITIALIZATION
// =========================================================

const initializeTensorFlow = async () => {
  if (!tensorflowPromise) {
    tensorflowPromise = (async () => {
      const tf = faceapi.tf

      if (!tf) {
        throw new Error('TensorFlow.js is unavailable.')
      }

      let backend = tf.getBackend()

      if (backend !== 'webgl') {
        try {
          const ready = await tf.setBackend('webgl')

          if (!ready) {
            throw new Error('WebGL backend unavailable.')
          }

          await tf.ready()
          backend = tf.getBackend()
        } catch (webglError) {
          console.warn('[TENSORFLOW] WebGL unavailable. Using CPU.', webglError)

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
// FACE MODEL INITIALIZATION
// =========================================================

const loadFaceModels = async (onProgress) => {
  const allLoaded =
    faceapi.nets.tinyFaceDetector.isLoaded &&
    faceapi.nets.faceLandmark68TinyNet.isLoaded &&
    faceapi.nets.faceRecognitionNet.isLoaded

  if (allLoaded) return

  if (!faceModelsPromise) {
    faceModelsPromise = (async () => {
      await initializeTensorFlow()

      onProgress?.('Preparing face recognition...')

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

      console.log('[FACE MODEL] Recognition models loaded.')
      console.log('[FACE MODEL] Backend:', faceapi.tf.getBackend())
    })().catch((error) => {
      faceModelsPromise = null
      throw error
    })
  }

  await faceModelsPromise
}

// =========================================================
// WAIT FOR CAMERA VIDEO
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
// MAIN COMPONENT
// =========================================================

const FaceVerificationScreen = ({ staff, setVerificationToken, setScreen, onCancel }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timeoutRef = useRef(null)

  const activeRef = useRef(false)
  const detectingRef = useRef(false)
  const verificationStartedRef = useRef(false)
  const lastVerificationAttemptRef = useRef(0)

  const [status, setStatus] = useState('Preparing face recognition...')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [cameraReady, setCameraReady] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const staffName =
    staff?.fullname || staff?.fullName || staff?.name || staff?.User?.fullname || 'Staff Member'

  // =======================================================
  // STOP CAMERA AND DETECTION
  // =======================================================

  const stopCamera = useCallback(() => {
    activeRef.current = false

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
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
  }, [])

  // =======================================================
  // VERIFY FACE WITH BACKEND
  // =======================================================

  const verifyDetectedFace = useCallback(
    async (found) => {
      if (!activeRef.current || verificationStartedRef.current) {
        return
      }

      const now = Date.now()

      // Avoid repeatedly sending failed verification requests.
      if (now - lastVerificationAttemptRef.current < VERIFICATION_COOLDOWN) {
        return
      }

      verificationStartedRef.current = true
      lastVerificationAttemptRef.current = now

      try {
        setBusy(true)
        setError('')
        setStatus('Verifying your identity...')

        if (!staff?.id) {
          throw new Error('Staff identification is missing.')
        }

        if (!staff?.qrCode) {
          throw new Error('Staff QR identity is missing. Please scan your card again.')
        }

        const descriptor = Array.from(found.descriptor)

        if (descriptor.length !== 128 || descriptor.some((value) => !Number.isFinite(value))) {
          throw new Error('Unable to read your facial features. Please try again.')
        }

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
          throw new Error(response?.data?.message || 'Identity verification was unsuccessful.')
        }

        if (!activeRef.current) return

        setStatus('Identity verified successfully.')
        setVerificationToken(verificationToken)

        stopCamera()
        setScreen('action')
      } catch (err) {
        console.error('[FACE VERIFICATION ERROR]', err)

        verificationStartedRef.current = false

        if (activeRef.current) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Verification failed. Please position your face and try again.',
          )

          setStatus('Please try again. Keep your face visible.')
          setFaceDetected(false)
        }
      } finally {
        if (activeRef.current) {
          setBusy(false)
        }
      }
    },
    [staff, setVerificationToken, setScreen, stopCamera],
  )

  // =======================================================
  // AUTOMATIC FACE DETECTION
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
        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.25,
        })

        /*
         * Detect the face, landmarks and descriptor in one
         * operation. This avoids running the detector twice.
         */

        const found = await faceapi
          .detectSingleFace(video, options)
          .withFaceLandmarks(true)
          .withFaceDescriptor()

        if (!activeRef.current) return

        if (!found?.descriptor) {
          setFaceDetected(false)
          setStatus('Position your face inside the guide.')
          return
        }

        setFaceDetected(true)
        setError('')

        const currentTime = Date.now()
        const cooldownPassed =
          currentTime - lastVerificationAttemptRef.current >= VERIFICATION_COOLDOWN

        if (cooldownPassed) {
          setStatus('Face detected. Hold still...')
          await verifyDetectedFace(found)
        } else {
          setStatus('Face detected. Please hold still...')
        }
      } catch (err) {
        console.error('[FACE DETECTION ERROR]', err)

        if (activeRef.current) {
          setFaceDetected(false)
          setStatus('Adjust your position. Looking for your face...')
        }
      } finally {
        detectingRef.current = false

        if (activeRef.current && !verificationStartedRef.current) {
          timeoutRef.current = window.setTimeout(detect, DETECTION_INTERVAL)
        }
      }
    }

    detect()
  }, [verifyDetectedFace])

  // =======================================================
  // INITIALIZE CAMERA AND MODELS
  // =======================================================

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        activeRef.current = true
        verificationStartedRef.current = false
        detectingRef.current = false
        lastVerificationAttemptRef.current = 0

        setBusy(true)
        setError('')
        setCameraReady(false)
        setFaceDetected(false)
        setStatus('Preparing secure face recognition...')

        if (!window.isSecureContext) {
          throw new Error('Face verification requires HTTPS or localhost.')
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is unavailable in this browser.')
        }

        // Initialize TensorFlow.
        setStatus('Starting recognition engine...')
        await initializeTensorFlow()

        if (!mounted || !activeRef.current) return

        // Load models.
        setStatus('Preparing facial recognition models...')

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
          console.warn('[CAMERA] Trying fallback configuration.', cameraError)

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

        console.log('[CAMERA SETTINGS]', stream.getVideoTracks()[0]?.getSettings())

        setCameraReady(true)
        setBusy(false)
        setStatus('Position your face inside the guide.')

        startFaceDetection()
      } catch (err) {
        console.error('[FACE INITIALIZATION ERROR]', err)

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
        setStatus('Camera initialization unsuccessful.')
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
  // RETRY
  // =======================================================

  const handleRetry = () => {
    stopCamera()

    verificationStartedRef.current = false
    detectingRef.current = false
    lastVerificationAttemptRef.current = 0

    setError('')
    setBusy(true)
    setCameraReady(false)
    setFaceDetected(false)
    setStatus('Restarting face verification...')

    setRetryCount((count) => count + 1)
  }

  // =======================================================
  // CANCEL
  // =======================================================

  const handleCancel = () => {
    stopCamera()
    onCancel?.()
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="face-id-screen">
      <style>{`
        .face-id-screen {
          --gold: #c6a15b;
          --gold-light: #f0dfb9;
          --gold-soft: rgba(198,161,91,.18);

          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 25px 15px;
          box-sizing: border-box;

          background:
            radial-gradient(circle at 50% 15%, rgba(198,161,91,.13), transparent 38%),
            linear-gradient(145deg, #050505, #111 55%, #080808);
        }

        .face-id-card {
          width: 100%;
          max-width: 560px;
          overflow: hidden;
          border: 1px solid rgba(198,161,91,.42) !important;
          border-radius: 25px !important;
          background: #101010 !important;
          box-shadow: 0 30px 90px rgba(0,0,0,.6);
        }

        .face-id-header {
          padding: 23px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(198,161,91,.25);
          background: linear-gradient(110deg, #151515, #201b12);
        }

        .face-id-brand {
          color: #f2dfb8;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .face-id-subtitle {
          color: #9d927e;
          font-size: 10px;
          margin-top: 4px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .face-id-secure {
          color: #b9d9bc;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .face-id-body {
          padding: 34px 25px 30px;
          text-align: center;
          background:
            radial-gradient(ellipse at center top, rgba(198,161,91,.07), transparent 60%),
            #101010;
        }

        .face-id-heading {
          color: #f5e7ca;
          font-size: 27px;
          font-weight: 900;
          letter-spacing: .7px;
          margin: 0 0 8px;
        }

        .face-id-description {
          color: #aaa49a;
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .face-id-name {
          color: var(--gold-light);
          font-weight: 800;
        }

        .face-id-camera-stage {
          width: 100%;
          max-width: 390px;
          height: 340px;
          position: relative;
          overflow: hidden;
          margin: 0 auto 23px;
          border-radius: 24px;
          background:
            radial-gradient(circle, #242424, #090909 75%);
          border: 1px solid rgba(198,161,91,.3);
          box-shadow:
            inset 0 0 45px rgba(0,0,0,.8),
            0 15px 40px rgba(0,0,0,.3);
        }

        .face-id-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
          opacity: .9;
        }

        .face-id-camera-shade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            180deg,
            rgba(0,0,0,.12),
            transparent 25%,
            transparent 75%,
            rgba(0,0,0,.25)
          );
        }

        .face-id-guide {
          position: absolute;
          width: 205px;
          height: 260px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border: 2px solid rgba(230,211,169,.65);
          border-radius: 48% 48% 44% 44%;
          box-shadow: 0 0 0 1000px rgba(0,0,0,.12);
          transition: border-color .3s, box-shadow .3s;
          pointer-events: none;
        }

        .face-id-guide.detected {
          border-color: #6ee7a0;
          box-shadow:
            0 0 0 1000px rgba(0,0,0,.08),
            0 0 22px rgba(110,231,160,.45);
        }

        .face-id-corner {
          position: absolute;
          width: 24px;
          height: 24px;
          border-color: var(--gold-light);
          border-style: solid;
          pointer-events: none;
        }

        .face-id-corner.tl {
          top: 17px;
          left: 17px;
          border-width: 2px 0 0 2px;
          border-radius: 7px 0 0 0;
        }

        .face-id-corner.tr {
          top: 17px;
          right: 17px;
          border-width: 2px 2px 0 0;
          border-radius: 0 7px 0 0;
        }

        .face-id-corner.bl {
          bottom: 17px;
          left: 17px;
          border-width: 0 0 2px 2px;
          border-radius: 0 0 0 7px;
        }

        .face-id-corner.br {
          bottom: 17px;
          right: 17px;
          border-width: 0 2px 2px 0;
          border-radius: 0 0 7px 0;
        }

        .face-id-scan-line {
          position: absolute;
          z-index: 3;
          left: 50%;
          top: 50%;
          width: 205px;
          height: 2px;
          transform: translate(-50%, -50%);
          background: linear-gradient(
            90deg,
            transparent,
            #f1d28e,
            #fff2d0,
            #f1d28e,
            transparent
          );
          box-shadow: 0 0 15px rgba(240,205,130,.8);
          animation: faceScan 2.8s ease-in-out infinite;
          pointer-events: none;
        }

        .face-id-scan-line.detected {
          background: linear-gradient(90deg, transparent, #6ee7a0, transparent);
          box-shadow: 0 0 15px rgba(110,231,160,.8);
        }

        @keyframes faceScan {
          0%, 100% {
            top: 25%;
            opacity: .35;
          }
          50% {
            top: 75%;
            opacity: 1;
          }
        }

        .face-id-camera-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 13px;
          color: #e8d4a5;
          background: rgba(0,0,0,.75);
          z-index: 5;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .face-id-status {
          min-height: 49px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          color: #e8d4a5;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.5;
          margin: 0 auto 15px;
        }

        .face-id-status-dot {
          width: 9px;
          height: 9px;
          flex: 0 0 9px;
          border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 12px rgba(198,161,91,.6);
        }

        .face-id-status-dot.detected {
          background: #6ee7a0;
          box-shadow: 0 0 12px rgba(110,231,160,.6);
        }

        .face-id-instructions {
          color: #898276;
          font-size: 11px;
          line-height: 1.8;
          max-width: 350px;
          margin: 0 auto;
        }

        .face-id-error {
          padding: 13px 15px;
          margin: 15px 0;
          border: 1px solid rgba(239,68,68,.35);
          border-radius: 11px;
          background: rgba(127,29,29,.18);
          color: #ffb4b4;
          font-size: 12px;
          line-height: 1.6;
          text-align: left;
        }

        .face-id-retry {
          min-height: 48px;
          padding: 0 24px !important;
          border-radius: 10px !important;
          border: 1px solid var(--gold) !important;
          background: linear-gradient(110deg, #f0dfb9, #c6a15b) !important;
          color: #15110a !important;
          font-weight: 900 !important;
        }

        .face-id-cancel {
          min-height: 48px;
          padding: 0 24px !important;
          border-radius: 10px !important;
          border: 1px solid #555 !important;
          color: #ddd !important;
          background: #242424 !important;
          font-weight: 800 !important;
        }

        .face-id-footer {
          padding: 17px 22px;
          border-top: 1px solid rgba(198,161,91,.2);
          background: #0a0a0a;
          color: #817967;
          text-align: center;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        @media (max-width: 575px) {
          .face-id-body {
            padding: 28px 16px;
          }

          .face-id-heading {
            font-size: 23px;
          }

          .face-id-camera-stage {
            height: 315px;
          }

          .face-id-header {
            padding: 18px;
          }

          .face-id-brand {
            font-size: 14px;
          }

          .face-id-secure {
            font-size: 9px;
          }
        }
      `}</style>

      <CCard className="face-id-card">
        {/* HEADER */}

        <div className="face-id-header">
          <div>
            <div className="face-id-brand">PRINCESS SALON</div>
            <div className="face-id-subtitle">Secure Staff Authentication</div>
          </div>

          <div className="face-id-secure">
            <span className="me-1">●</span>
            SECURE KIOSK
          </div>
        </div>

        <CCardBody className="face-id-body">
          <h2 className="face-id-heading">Face Verification</h2>

          <p className="face-id-description">
            Welcome, <span className="face-id-name">{staffName}</span>.
            <br />
            Look at the camera to verify your identity.
          </p>

          {/* CAMERA AND FACE GUIDE */}

          <div className="face-id-camera-stage">
            <video ref={videoRef} autoPlay muted playsInline className="face-id-video" />

            <div className="face-id-camera-shade" />

            <div className={`face-id-guide ${faceDetected ? 'detected' : ''}`} />

            <div className="face-id-corner tl" />
            <div className="face-id-corner tr" />
            <div className="face-id-corner bl" />
            <div className="face-id-corner br" />

            {cameraReady && (
              <div className={`face-id-scan-line ${faceDetected ? 'detected' : ''}`} />
            )}

            {!cameraReady && (
              <div className="face-id-camera-loading">
                <CSpinner color="light" />
                <span>PREPARING CAMERA</span>
              </div>
            )}
          </div>

          {/* LIVE STATUS */}

          <div className="face-id-status">
            <span className={`face-id-status-dot ${faceDetected ? 'detected' : ''}`} />
            <span>{status}</span>
          </div>

          <p className="face-id-instructions">
            Keep your face inside the outline, look directly at the camera and hold still.
            Verification happens automatically.
          </p>

          {/* ERROR */}

          {error && <div className="face-id-error">{error}</div>}

          {/* CONTROLS */}

          <div className="d-flex justify-content-center gap-2 flex-wrap mt-4">
            <CButton className="face-id-cancel" onClick={handleCancel}>
              CANCEL
            </CButton>

            {error && (
              <CButton className="face-id-retry" onClick={handleRetry} disabled={busy}>
                {busy ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    RESTARTING...
                  </>
                ) : (
                  'TRY AGAIN'
                )}
              </CButton>
            )}
          </div>
        </CCardBody>

        <div className="face-id-footer">
          © {new Date().getFullYear()} Princess Salon · Identity Protection
        </div>
      </CCard>
    </div>
  )
}

export default FaceVerificationScreen
