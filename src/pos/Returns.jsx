import { useEffect, useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CBadge,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CSpinner,
} from '@coreui/react'

import ViewReturnModal from './ViewReturnModal'

const Returns = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')

  const [status, setStatus] = useState('')
  const [refundType, setRefundType] = useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [selectedReturn, setSelectedReturn] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const getReturns = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/returns`, {
        params: {
          status,
          refundType,
          startDate,
          endDate,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReturns(response.data.returns || [])
    } catch (error) {
      console.error(error)

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Unable to load returns.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getReturns()
  }, [])

  const filteredReturns = returns.filter((item) => {
    const keyword = search.toLowerCase()

    return (
      item.returnNumber?.toLowerCase().includes(keyword) ||
      item.Customer?.fullname?.toLowerCase().includes(keyword) ||
      item.Sale?.receiptNumber?.toLowerCase().includes(keyword)
    )
  })

  const totalRefund = filteredReturns.reduce(
    (sum, item) => sum + Number(item.totalRefund || 0),
    0,
  )

  const totalReturns = filteredReturns.length

  const approved = filteredReturns.filter((r) => r.status === 'approved').length

  const pending = filteredReturns.filter((r) => r.status === 'pending').length

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredReturns.map((r) => ({
        ReturnNumber: r.returnNumber,
        Invoice: r.Sale?.receiptNumber,
        Customer: r.Customer?.fullname,
        RefundType: r.refundType,
        Refund: r.totalRefund,
        Status: r.status,
        Date: new Date(r.createdAt).toLocaleDateString(),
      })),
    )

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Returns')

    XLSX.writeFile(workbook, 'ReturnsReport.xlsx')
  }

  const openReturn = (data) => {
    setSelectedReturn(data)
    setShowViewModal(true)
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Total Returns</h6>
              <h3>{totalReturns}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Total Refunded</h6>
              <h3>₦{totalRefund.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Approved</h6>
              <h3>{approved}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={3}>
          <CCard>
            <CCardBody>
              <h6>Pending</h6>
              <h3>{pending}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard>
        <CCardHeader>
          <strong>Returns Report</strong>
        </CCardHeader>

        <CCardBody>
          <CRow className="mb-3">
            <CCol md={2}>
              <CFormInput
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>

            <CCol md={2}>
              <CFormInput
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>

            <CCol md={2}>
              <CFormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </CFormSelect>
            </CCol>

            <CCol md={2}>
              <CFormSelect value={refundType} onChange={(e) => setRefundType(e.target.value)}>
                <option value="">All Types</option>
                <option value="refund">Refund</option>
                <option value="exchange">Exchange</option>
                <option value="credit_note">Credit Note</option>
              </CFormSelect>
            </CCol>

            <CCol md={2}>
              <CFormInput
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </CCol>

            <CCol md={2}>
              <CButton color="primary" onClick={getReturns}>
                Apply
              </CButton>{' '}
              <CButton color="success" onClick={exportExcel}>
                Excel
              </CButton>
            </CCol>
          </CRow>

          {loading ? (
            <div className="text-center">
              <CSpinner />
            </div>
          ) : (
            <CTable hover bordered responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Return No</CTableHeaderCell>
                  <CTableHeaderCell>Invoice</CTableHeaderCell>
                  <CTableHeaderCell>Customer</CTableHeaderCell>
                  <CTableHeaderCell>Refund Type</CTableHeaderCell>
                  <CTableHeaderCell>Refund</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredReturns.map((item) => (
                  <CTableRow key={item.id}>
                    <CTableDataCell>{item.returnNumber}</CTableDataCell>

                    <CTableDataCell>{item.Sale?.receiptNumber}</CTableDataCell>

                    <CTableDataCell>{item.Customer?.fullname}</CTableDataCell>

                    <CTableDataCell>{item.refundType}</CTableDataCell>

                    <CTableDataCell>
                      ₦{Number(item.totalRefund).toLocaleString()}
                    </CTableDataCell>

                    <CTableDataCell>
                      <CBadge
                        color={
                          item.status === 'approved'
                            ? 'success'
                            : item.status === 'pending'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {item.status}
                      </CBadge>
                    </CTableDataCell>

                    <CTableDataCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </CTableDataCell>

                    <CTableDataCell>
                      <CButton
                        size="sm"
                        color="info"
                        onClick={() => openReturn(item)}
                      >
                        View
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <ViewReturnModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        returnData={selectedReturn}
      />
    </>
  )
}

export default Returns