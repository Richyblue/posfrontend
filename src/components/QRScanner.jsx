import { Html5QrcodeScanner } from 'html5-qrcode'

import { useEffect } from 'react'

const QRScanner = ({ onSuccess }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',

      {
        fps: 10,

        qrbox: 250,
      },

      false,
    )

    scanner.render(
      (decodedText) => {
        onSuccess(decodedText)
      },

      () => {},
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [])

  return <div id="reader"></div>
}

export default QRScanner
