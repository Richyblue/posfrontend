import { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CRow,
  CCol,
  CCard,
  CCardBody,
} from '@coreui/react'

const ReturnModal = ({ show, onHide, sale, reload }) => {
  const [items, setItems] = useState([])

  const [reason, setReason] = useState('')

  const [remarks, setRemarks] = useState('')

  const [refundType, setRefundType] = useState('refund')

  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!sale) return

    console.log('Selected Sale:', sale)

    const invoiceItems = (sale.SaleItems || []).map((item) => ({
      ...item,
      selected: false,
      returnQty: item.quantity,
      refund: Number(item.subtotal),
    }))

    setItems(invoiceItems)
  }, [sale])

  const toggleItem = (index) => {
    const data = [...items]

    data[index].selected = !data[index].selected

    setItems(data)
  }

  const changeQty = (index, value) => {
    const data = [...items]

    const qty = Math.max(1, Math.min(Number(value), data[index].quantity))

    data[index].returnQty = qty

    data[index].refund = qty * Number(data[index].price)

    setItems(data)
  }

  const totalRefund = items
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + Number(item.refund), 0)

  const processReturn = async () => {
    try {
      const selectedItems = items
        .filter((item) => item.selected)
        .map((item) => ({
          ProductId: item.ProductId || null,
          ServiceId: item.ServiceId || null,
          itemType: item.itemType,
          quantity: Number(item.returnQty),
          price: Number(item.price),
        }))

      if (selectedItems.length === 0) {
        return Swal.fire({
          icon: 'warning',
          title: 'No Item Selected',
          text: 'Please select at least one item to return.',
        })
      }

      if (!reason) {
        return Swal.fire({
          icon: 'warning',
          title: 'Reason Required',
          text: 'Please select a return reason.',
        })
      }

      setProcessing(true)

      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}api/v1/returns`,
        {
          saleId: sale.id,
          items: selectedItems,
          refundType,
          reason,
          remarks,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: response.data.message,
      })

      reload()

      onHide()
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Return Failed',
        text: error.response?.data?.message || 'Something went wrong.',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <CModal visible={show} size="xl" onClose={onHide}>
      <CModalHeader>
        <CModalTitle>Sales Return</CModalTitle>
      </CModalHeader>

      <CModalBody>
        {/* Invoice Summary */}

        <CCard className="mb-3">
          <CCardBody>
            <CRow>
              <CCol md={4}>
                <strong>Invoice</strong>
                <br />
                {sale?.receiptNumber}
              </CCol>

              <CCol md={4}>
                <strong>Customer</strong>
                <br />
                {sale?.Customer?.fullname || 'Walk-in Customer'}
              </CCol>

              <CCol md={4}>
                <strong>Total Amount</strong>
                <br />₦{Number(sale?.totalAmount || 0).toLocaleString()}
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* Items */}

        <CTable bordered hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Select</CTableHeaderCell>

              <CTableHeaderCell>Item</CTableHeaderCell>

              <CTableHeaderCell>Type</CTableHeaderCell>

              <CTableHeaderCell>Sold Qty</CTableHeaderCell>

              <CTableHeaderCell>Return Qty</CTableHeaderCell>

              <CTableHeaderCell>Refund</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {items.length > 0 ? (
              items.map((item, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>
                    <CFormCheck checked={item.selected} onChange={() => toggleItem(index)} />
                  </CTableDataCell>

                  <CTableDataCell>
                    {item.itemType === 'product' ? item.Product?.name : item.Service?.name}
                  </CTableDataCell>

                  <CTableDataCell>{item.itemType}</CTableDataCell>

                  <CTableDataCell>{item.quantity}</CTableDataCell>

                  <CTableDataCell style={{ width: '120px' }}>
                    <CFormInput
                      type="number"
                      min={1}
                      max={item.quantity}
                      value={item.returnQty}
                      disabled={!item.selected}
                      onChange={(e) => changeQty(index, e.target.value)}
                    />
                  </CTableDataCell>

                  <CTableDataCell>₦{Number(item.refund).toLocaleString()}</CTableDataCell>
                </CTableRow>
              ))
            ) : (
              <CTableRow>
                <CTableDataCell colSpan={6} className="text-center">
                  No sale items found.
                </CTableDataCell>
              </CTableRow>
            )}
          </CTableBody>
        </CTable>

        {/* Return Reason */}

        <CRow className="mt-4">
          <CCol md={6}>
            <label className="form-label">Return Reason</label>

            <CFormSelect value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Select Reason</option>

              <option value="Damaged Product">Damaged Product</option>

              <option value="Wrong Item">Wrong Item</option>

              <option value="Customer Complaint">Customer Complaint</option>

              <option value="Poor Service">Poor Service</option>

              <option value="Expired Product">Expired Product</option>

              <option value="Other">Other</option>
            </CFormSelect>
          </CCol>

          <CCol md={6}>
            <label className="form-label">Refund Type</label>

            <CFormSelect value={refundType} onChange={(e) => setRefundType(e.target.value)}>
              <option value="refund">Refund</option>

              <option value="exchange">Exchange</option>

              <option value="credit_note">Credit Note</option>
            </CFormSelect>
          </CCol>
        </CRow>

        {/* Remarks */}

        <div className="mt-3">
          <label className="form-label">Remarks</label>

          <CFormTextarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional remarks..."
          />
        </div>

        {/* Refund Summary */}

        <hr />

        <div className="text-end">
          <h5>Total Refund</h5>

          <h2 className="text-danger">₦{Number(totalRefund).toLocaleString()}</h2>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onHide}>
          Cancel
        </CButton>

        <CButton color="danger" disabled={processing || totalRefund <= 0} onClick={processReturn}>
          {processing ? 'Processing...' : 'Process Return'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ReturnModal
