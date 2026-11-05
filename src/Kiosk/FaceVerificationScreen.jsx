import { useEffect, useRef, useState } from 'react'
import { CAlert, CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import * as faceapi from '@vladmandic/face-api'
import { verifyStaffFace } from '../services/kioskApi'

const MODEL_URL = '/models/face-api'
const FaceVerificationScreen = ({ staff, setVerificationToken, setScreen, onCancel }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [status, setStatus] = useState('Loading face recognition models...')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const [challenge] = useState(() => Math.random() > 0.5 ? 'left' : 'right')
  const startXRef = useRef(null)
  const challengePassedRef = useRef(false)
  const [challengePassed, setChallengePassed] = useState(false)

  useEffect(() => {
    let active = true
    let interval
    const start = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        if (!active) return
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStatus(`Look at the camera, then gently turn your head to the ${challenge}.`)
        setBusy(false)
        interval = window.setInterval(async () => {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) return
          const found = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor()
          if (!found) { setStatus('Position your face clearly inside the camera view.'); return }
          const offset = found.detection.box.x + found.detection.box.width / 2 - videoRef.current.videoWidth / 2
          if (startXRef.current === null) {
            startXRef.current = offset
            setStatus(`Turn your head slightly to the ${challenge}.`)
          } else if (!challengePassedRef.current && (challenge === 'left' ? offset < startXRef.current - 22 : offset > startXRef.current + 22)) {
            challengePassedRef.current = true
            setChallengePassed(true)
            setStatus('Movement detected. Hold still while we verify your identity.')
          }
        }, 450)
      } catch (e) {
        console.error(e); setError('Unable to start face verification. Check camera permission and face model installation.'); setBusy(false)
      }
    }
    start()
    return () => { active = false; if (interval) window.clearInterval(interval); streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [challenge])

  const submitVerification = async () => {
    if (!challengePassed || !videoRef.current) return
    try {
      setBusy(true); setError('')
      const found = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor()
      if (!found) throw new Error('Face not detected. Please try again.')
      const response = await verifyStaffFace({ staffId: staff.id, descriptor: Array.from(found.descriptor), livenessPassed: true, challenge })
      if (!response.data?.verificationToken) throw new Error('Server did not return a verification token.')
      setVerificationToken(response.data.verificationToken); setScreen('action')
    } catch (e) { setError(e.response?.data?.message || e.message || 'Face verification failed.') }
    finally { setBusy(false) }
  }

  return <div className="container py-4"><CCard className="mx-auto shadow-sm" style={{ maxWidth: 650 }}><CCardBody className="text-center p-4">
    <h3>Face Verification</h3><p>Confirming identity for <strong>{staff?.fullname}</strong></p>
    <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', maxWidth: 480, borderRadius: 12, background: '#111', transform: 'scaleX(-1)' }} />
    {busy && <div className="my-3"><CSpinner /><span className="ms-2">{status}</span></div>}
    {!busy && <p className="mt-3">{status}</p>}{error && <CAlert color="danger">{error}</CAlert>}
    <div className="d-flex justify-content-center gap-2 mt-3">
      <CButton color="secondary" variant="outline" onClick={onCancel} disabled={busy}>Cancel</CButton>
      <CButton color="success" onClick={submitVerification} disabled={busy || !challengePassed}>{busy ? 'Verifying...' : 'Verify My Face'}</CButton>
    </div><small className="d-block text-body-secondary mt-3">Face verification is required before attendance can continue.</small>
  </CCardBody></CCard></div>
}
export default FaceVerificationScreen
