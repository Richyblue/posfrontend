import React, { useEffect, useState } from 'react'

import axios from 'axios'

import * as XLSX from 'xlsx'

import { saveAs } from 'file-saver'

import CIcon from '@coreui/icons-react'

import { cilSearch, cilTrash, cilPencil, cilCloudDownload } from '@coreui/icons'

import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CButton,
  CFormInput,
  CFormSelect,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CBadge,
  CInputGroup,
  CInputGroupText,
  CSpinner,
} from '@coreui/react'
const ExpenseList = () => {
  const [expenses, setExpenses] = useState([])

  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')

  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const [selectedMonth, setSelectedMonth] = useState('')

  const [selectedYear, setSelectedYear] = useState('')

  const getExpenses = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get('http://localhost:9000/api/v1/getexpenses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setExpenses(response.data.expenses || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await getExpenses()
    }
    fetchData()
  }, [])

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.createdAt)

    const matchesSearch = expense.title?.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = !categoryFilter || expense.category === categoryFilter

    const matchesDate = !selectedDate || expense.createdAt.split('T')[0] === selectedDate

    const matchesMonth = selectedMonth === '' || expenseDate.getMonth().toString() === selectedMonth

    const matchesYear = !selectedYear || expenseDate.getFullYear().toString() === selectedYear

    return matchesSearch && matchesCategory && matchesDate && matchesMonth && matchesYear
  })

  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + Number(expense.amount),

    0,
  )

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredExpenses)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const file = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    saveAs(file, `Expenses_${Date.now()}.xlsx`)
  }

  return (
    <>
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Total Expenses</h6>

              <h3>{expenses.length}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Total Amount</h6>

              <h3>₦{totalExpenses.toLocaleString()}</h3>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol md={4}>
          <CCard>
            <CCardBody>
              <h6>Categories</h6>

              <h3>{[...new Set(expenses.map((e) => e.category))].length}</h3>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CRow className="mb-3">
        <CCol md={4}>
          <CInputGroup>
            <CInputGroupText>
              <CIcon icon={cilSearch} />
            </CInputGroupText>

            <CFormInput
              placeholder="Search Expense"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CInputGroup>
        </CCol>
        <CRow className="mb-3 mt-3">
          <CCol md={3}>
            <CFormInput
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </CCol>

          <CCol md={3}>
            <CFormSelect value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="">All Months</option>

              <option value="0">January</option>

              <option value="1">February</option>

              <option value="2">March</option>

              <option value="3">April</option>

              <option value="4">May</option>

              <option value="5">June</option>

              <option value="6">July</option>

              <option value="7">August</option>

              <option value="8">September</option>

              <option value="9">October</option>

              <option value="10">November</option>

              <option value="11">December</option>
            </CFormSelect>
          </CCol>

          <CCol md={3}>
            <CFormSelect value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="">All Years</option>

              <option value="2024">2024</option>

              <option value="2025">2025</option>

              <option value="2026">2026</option>

              <option value="2027">2027</option>
            </CFormSelect>
          </CCol>

          <CCol md={3}>
            <CButton
              color="secondary"
              className="w-100"
              onClick={() => {
                setSelectedDate('')
                setSelectedMonth('')
                setSelectedYear('')
                setCategoryFilter('')
                setSearch('')
              }}
            >
              Reset Filters
            </CButton>
          </CCol>
        </CRow>

        <CCol md={3}>
          <CFormSelect value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>

            <option value="Rent">Rent</option>

            <option value="Utilities">Utilities</option>

            <option value="Fuel">Fuel</option>

            <option value="Salary">Salary</option>

            <option value="Marketing">Marketing</option>
          </CFormSelect>
        </CCol>

        <CCol md={5} className="text-end">
          <CButton color="success" onClick={exportExcel}>
            <CIcon icon={cilCloudDownload} className="me-2" />
            Export Excel
          </CButton>
        </CCol>
      </CRow>

      <CTable striped hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Title</CTableHeaderCell>

            <CTableHeaderCell>Category</CTableHeaderCell>

            <CTableHeaderCell>Amount</CTableHeaderCell>

            <CTableHeaderCell>Date</CTableHeaderCell>

            <CTableHeaderCell>Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {filteredExpenses.map((expense) => (
            <CTableRow key={expense.id}>
              <CTableDataCell>{expense.title}</CTableDataCell>

              <CTableDataCell>
                <CBadge color="info">{expense.category}</CBadge>
              </CTableDataCell>

              <CTableDataCell>₦{Number(expense.amount).toLocaleString()}</CTableDataCell>

              <CTableDataCell>{expense.createdAt?.split('T')[0]}</CTableDataCell>

              <CTableDataCell>
                <CButton size="sm" color="info" className="me-2">
                  <CIcon icon={cilPencil} />
                </CButton>

                <CButton size="sm" color="danger">
                  <CIcon icon={cilTrash} />
                </CButton>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </>
  )
}

export default ExpenseList
