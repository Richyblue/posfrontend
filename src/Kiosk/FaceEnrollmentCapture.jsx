import { useEffect, useRef, useState } from 'react'
import { CAlert, CButton, CSpinner } from '@coreui/react'
import * as faceapi from '@vladmandic/face-api'
import { enrollStaffFace } from '../services/kioskApi'

// Reusable component for an authenticated staff profile/admin enrollment screen.
const FaceEnrollmentCapture = ({ staffId, onComplete }) => {
  const videoRef = useRef(null),
    streamRef = useRef(null)
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const start = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models/face-api'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models/face-api'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models/face-api'),
        ])
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      } catch {
        setError('Camera or face model could not be initialized.')
      }
    }
    start()
    return () => {
      active = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])
  const capture = async () => {
    try {
      setBusy(true)
      setError('')
      const found = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.55 }),
        )
        .withFaceLandmarks()
        .withFaceDescriptor()
      if (!found) throw new Error('No clear face detected. Face the camera and try again.')
      await enrollStaffFace({ staffId, descriptor: Array.from(found.descriptor) })
      onComplete?.()
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Face enrollment failed.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: '100%', maxWidth: 420, borderRadius: 10, background: '#111' }}
      />
      {error && (
        <CAlert color="danger" className="mt-2">
          {error}
        </CAlert>
      )}
      <div className="mt-2">
        <CButton color="primary" onClick={capture} disabled={!ready || busy}>
          {busy ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Saving face...
            </>
          ) : (
            'Capture & Register Face'
          )}
        </CButton>
      </div>
    </div>
  )
}
export default FaceEnrollmentCapture
