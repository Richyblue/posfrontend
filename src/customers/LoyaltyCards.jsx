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
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CSpinner,
} from '@coreui/react'

import { useState, useEffect } from 'react'

import axios from 'axios'

import Swal from 'sweetalert2'

import * as XLSX from 'xlsx'
const LoyaltyCard = () => {
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [cards, setCards] = useState([])

  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState('')

  const getCards = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/loyalty-cards`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setCards(response.data.cards)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await getCards()
    }
    fetchData()
  }, [])

  const totalCards = cards.length

  const activeCards = cards.filter((card) => card.status === 'active').length

  const inactiveCards = cards.filter((card) => card.status === 'inactive').length

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.cardNumber?.toLowerCase().includes(search.toLowerCase()) ||
      card.Customer?.fullname?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === '' ? true : card.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const updateStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    try {
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}api/v1/loyalty-cards/${id}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      Swal.fire('Success', 'Card updated', 'success')

      getCards()
    } catch (error) {
      Swal.fire('Error', 'Failed', 'error')
    }
  }

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredCards.map((card) => ({
        CardNumber: card.cardNumber,

        Customer: card.Customer?.fullname,

        Phone: card.Customer?.phone,

        Points: card.Customer?.loyaltyPoints,

        Status: card.status,
      })),
    )

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Loyalty Cards')

    XLSX.writeFile(workbook, 'LoyaltyCards.xlsx')
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Total Cards</h6>
              <h3>{totalCards}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Active Cards</h6>
              <h3>{activeCards}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Inactive Cards</h6>
              <h3>{inactiveCards}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CCard>
        <CCardHeader>Loyalty Cards</CCardHeader>

        <CCardBody>
          <div className="d-flex gap-2 mb-3">
            <CFormInput
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <CFormSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>
            </CFormSelect>

            <CButton onClick={exportExcel}>Export Excel</CButton>
          </div>

          <CTable hover responsive bordered>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Card Number</CTableHeaderCell>

                <CTableHeaderCell>Customer</CTableHeaderCell>

                <CTableHeaderCell>Phone</CTableHeaderCell>

                <CTableHeaderCell>Points</CTableHeaderCell>

                <CTableHeaderCell>Status</CTableHeaderCell>

                <CTableHeaderCell>Action</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {filteredCards.map((card) => (
                <CTableRow key={card.id}>
                  <CTableDataCell>{card.cardNumber}</CTableDataCell>

                  <CTableDataCell>{card.Customer?.fullname}</CTableDataCell>

                  <CTableDataCell>{card.Customer?.phone}</CTableDataCell>

                  <CTableDataCell>{card.Customer?.loyaltyPoints}</CTableDataCell>

                  <CTableDataCell>
                    <CBadge color={card.status === 'active' ? 'success' : 'danger'}>
                      {card.status}
                    </CBadge>
                  </CTableDataCell>

                  <CTableDataCell>
                    <CButton
                      size="sm"
                      color={card.status === 'active' ? 'danger' : 'success'}
                      onClick={() => updateStatus(card.id, card.status)}
                    >
                      {card.status === 'active' ? 'Deactivate' : 'Activate'}
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default LoyaltyCard
