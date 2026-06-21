import React, { useRef } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CCard,
  CCardBody,
  CButton,
} from '@coreui/react'
const ReceiptModal = ({ show, onHide, sale }) => {
  const receiptRef = useRef()
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // Thermal printer setup
  const handlePrint = async () => {
    try {
      if (!window.electronAPI) {
        alert('Electron printing not available')
        return
      }

      const html = `
      <html>
      <head>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          body {
            width: 80mm;
            margin: 0;
            padding: 5px;
            font-family: monospace;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            padding: 2px;
          }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
      </body>
      </html>
    `

      await window.electronAPI.printReceipt(html)

      alert('Receipt Printed Successfully')
    } catch (error) {
      console.error(error)

      alert('Printer Error')
    }
  }
  if (!sale) return null
  return (
    <CModal visible={show} onClose={onHide} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle>Receipt</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CCard>
          <CCardBody>
            {/* Receipt Preview */}
            <div
              ref={receiptRef}
              style={{
                width: '80mm',
                margin: '0 auto',
                padding: '5px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#000',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '2px 0' }}>PRINCESS SALON</h3>

                <p style={{ margin: '2px 0' }}>Beauty & Wellness Center</p>

                <p style={{ margin: '2px 0' }}>Tel: +234 XXX XXX XXXX</p>
              </div>

              <hr
                style={{
                  borderTop: '1px dashed #000',
                }}
              />

              <p>
                <strong>Receipt No:</strong> {sale.receiptNumber || sale.id}
              </p>

              <p>
                <strong>Customer:</strong> {sale.customer || 'Walk-in Customer'}
              </p>

              <p>
                <strong>Date:</strong> {new Date(sale.createdAt).toLocaleString()}
              </p>

              <p>
                <strong>Cashier:</strong> {sale.recordedBy || 'Admin'}
              </p>

              <hr
                style={{
                  borderTop: '1px dashed #000',
                }}
              />

              <table
                style={{
                  width: '100%',
                  fontSize: '11px',
                }}
              >
                <thead>
                  <tr>
                    <th align="left">Item</th>
                    <th align="center">Qty</th>
                    <th align="right">Amt</th>
                  </tr>
                </thead>

                <tbody>
                  {sale.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>

                      <td align="center">{item.quantity || item.qty || 1}</td>

                      <td align="right">₦{Number(item.subtotal || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <hr
                style={{
                  borderTop: '1px dashed #000',
                }}
              />

              <div>
                <p
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Subtotal:</span>

                  <strong>₦{Number(sale.subtotal || sale.totalAmount).toLocaleString()}</strong>
                </p>

                <p
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Discount:</span>

                  <strong>₦{Number(sale.discount || 0).toLocaleString()}</strong>
                </p>

                <p
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '15px',
                  }}
                >
                  <span>TOTAL:</span>

                  <strong>₦{Number(sale.totalAmount || 0).toLocaleString()}</strong>
                </p>
              </div>

              <hr
                style={{
                  borderTop: '1px dashed #000',
                }}
              />

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '10px',
                }}
              >
                <p>Thank You For Your Patronage</p>

                <p>Please Visit Again</p>
              </div>
            </div>
          </CCardBody>
        </CCard>
        <div className="text-center mt-3">
          <CButton color="primary" onClick={handlePrint}>
            Print Receipt
          </CButton>
        </div>
      </CModalBody>
    </CModal>
  )
}

export default ReceiptModal
