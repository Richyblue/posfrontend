import { useEffect, useRef, useState } from 'react'
import * as faceapi from '@vladmandic/face-api'
import {
  CAlert,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import { enrollStaffFace } from '../services/kioskApi'

const MODEL_URL = '/models/face-api'

let modelsPromise = null

const loadFaceModels = () => {
  if (!modelsPromise) {
    modelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).catch((error) => {
      modelsPromise = null
      throw error
    })
  }

  return modelsPromise
}

const FaceEnrollmentModal = ({ visible, staff, onClose, onComplete }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const activeRef = useRef(false)

  const [initializing, setInitializing] = useState(false)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const stopCamera = () => {
    activeRef.current = false

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    setReady(false)
  }

  useEffect(() => {
    if (!visible || !staff?.id) return undefined

    let cancelled = false

    const initializeCamera = async () => {
      setInitializing(true)
      setError('')
      setSuccess('')
      setReady(false)

      try {
        if (!window.isSecureContext) {
          throw new Error(
            'Camera access requires HTTPS or localhost. Please open the application securely.',
          )
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera access is not supported by this browser.')
        }

        await loadFaceModels()

        if (cancelled) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        activeRef.current = true

        if (!videoRef.current) {
          throw new Error('Camera preview could not be initialized.')
        }

        videoRef.current.srcObject = stream
        await videoRef.current.play()

        if (!cancelled) {
          setReady(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.name === 'NotAllowedError'
              ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
              : err.name === 'NotFoundError'
                ? 'No camera was found on this device.'
                : err.message || 'Unable to initialize the camera.',
          )
        }
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    initializeCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [visible, staff?.id])

  const captureFace = async () => {
    if (!videoRef.current || !ready || !staff?.id) return

    try {
      setBusy(true)
      setError('')
      setSuccess('')

      const detection = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.55,
          }),
        )
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        throw new Error(
          'No clear face detected. Look directly at the camera, improve the lighting, and try again.',
        )
      }

      if (detection.detection.score < 0.65) {
        throw new Error(
          'Face detection confidence is too low. Please position your face clearly and try again.',
        )
      }

      if (!activeRef.current) {
        throw new Error('Camera is no longer active. Please reopen enrollment.')
      }

      await enrollStaffFace({
        staffId: staff.id,
        descriptor: Array.from(detection.descriptor),
      })

      setSuccess('Face enrollment completed successfully.')
      stopCamera()

      onComplete?.(staff)
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Face enrollment failed. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose?.()
  }

  return (
    <CModal visible={visible} onClose={handleClose} alignment="center" size="lg" backdrop="static">
      <CModalHeader>
        <CModalTitle>Staff Face Enrollment</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div className="text-center mb-3">
          <h5 className="mb-1">{staff?.User?.fullname || 'Selected Staff'}</h5>

          <div className="text-body-secondary small">Staff ID: {staff?.id}</div>

          <p className="text-body-secondary mt-3 mb-0">
            Position your face inside the camera frame. Ensure your face is clearly visible and the
            lighting is adequate.
          </p>
        </div>

        <div
          className="d-flex justify-content-center align-items-center rounded-3 overflow-hidden bg-dark mx-auto"
          style={{
            width: '100%',
            maxWidth: '520px',
            minHeight: '300px',
            position: 'relative',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              maxHeight: '380px',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: ready ? 'block' : 'none',
            }}
          />

          {!ready && (
            <div className="text-center text-white p-4">
              {initializing ? (
                <>
                  <CSpinner color="light" className="mb-3" />
                  <div>Initializing camera and face recognition...</div>
                </>
              ) : (
                <>
                  <div className="mb-2">Camera preview unavailable</div>
                  <small className="text-white-50">Check camera permission and try again.</small>
                </>
              )}
            </div>
          )}

          {ready && (
            <div
              className="position-absolute border border-2 border-success rounded-circle"
              style={{
                width: '190px',
                height: '230px',
                pointerEvents: 'none',
                opacity: 0.8,
              }}
            />
          )}
        </div>

        {error && (
          <CAlert color="danger" className="mt-3 mb-0">
            {error}
          </CAlert>
        )}

        {success && (
          <CAlert color="success" className="mt-3 mb-0">
            {success}
          </CAlert>
        )}

        <div className="text-center small text-body-secondary mt-3">
          <strong>Important:</strong> Obtain the staff member's consent before collecting and
          storing facial biometric data.
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={handleClose} disabled={busy}>
          Close
        </CButton>

        <CButton color="primary" onClick={captureFace} disabled={!ready || busy || initializing}>
          {busy ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Enrolling Face...
            </>
          ) : (
            'Capture & Register Face'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default FaceEnrollmentModal
