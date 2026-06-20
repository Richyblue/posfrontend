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
import axios from 'axios'

const ReceiptModal = ({ show, onHide, sale }) => {
  const receiptRef = useRef()
  const API_URL = import.meta.env.VITE_BACKEND_URL

  // Thermal printer setup
  const handlePrint = async () => {
    try {
      const token = localStorage.getItem('token')

      await axios.post(`${API_URL}api/v1/print-receipt`, sale, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      alert('Receipt Printed')
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
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              <h4 style={{ textAlign: 'center' }}>Store Name</h4>
              <hr />
              <p>Customer: {sale.customer || 'N/A'}</p>
              <p>Date: {new Date(sale.createdAt).toLocaleString()}</p>
              <hr />
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ textAlign: 'right' }}>
                        ₦{Number(item.subtotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <hr />
              <h5 style={{ textAlign: 'right' }}>Total: ₦{sale.totalAmount.toFixed(2)}</h5>
              <p style={{ textAlign: 'center' }}>Thank you for shopping!</p>
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
