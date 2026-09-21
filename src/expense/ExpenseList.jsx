import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

import CIcon from '@coreui/icons-react'

import {
  cilSearch,
  cilTrash,
  cilPencil,
  cilCloudDownload,
  cilReload,
  cilFilter,
} from '@coreui/icons'

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
  const API_URL = import.meta.env.VITE_BACKEND_URL

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  // ==========================================
  // CURRENCY FORMAT
  // ==========================================

  const money = (value) => {
    return `₦${Number(value || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  // ==========================================
  // GET EXPENSES
  // ==========================================

  const getExpenses = async () => {
    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      const response = await axios.get(`${API_URL}api/v1/getexpenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setExpenses(response.data?.expenses || [])
    } catch (error) {
      console.error('GET EXPENSES ERROR:', error)

      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    getExpenses()
  }, [])

  // ==========================================
  // FILTER EXPENSES
  // ==========================================

  const filteredExpenses = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return expenses.filter((expense) => {
      const expenseDate = expense.createdAt ? new Date(expense.createdAt) : null

      const title = String(expense.title || '').toLowerCase()

      const category = String(expense.category || '').toLowerCase()

      const matchesSearch = !keyword || title.includes(keyword) || category.includes(keyword)

      const matchesCategory = !categoryFilter || expense.category === categoryFilter

      const expenseDateString = expense.createdAt
        ? new Date(expense.createdAt).toISOString().split('T')[0]
        : ''

      const matchesDate = !selectedDate || expenseDateString === selectedDate

      const matchesMonth =
        selectedMonth === '' || (expenseDate && expenseDate.getMonth().toString() === selectedMonth)

      const matchesYear =
        !selectedYear || (expenseDate && expenseDate.getFullYear().toString() === selectedYear)

      return matchesSearch && matchesCategory && matchesDate && matchesMonth && matchesYear
    })
  }, [expenses, search, categoryFilter, selectedDate, selectedMonth, selectedYear])

  // ==========================================
  // KPI CALCULATIONS
  // ==========================================

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((total, expense) => total + Number(expense.amount || 0), 0)
  }, [filteredExpenses])

  const totalExpenseRecords = filteredExpenses.length

  const totalCategories = useMemo(() => {
    return new Set(filteredExpenses.map((expense) => expense.category).filter(Boolean)).size
  }, [filteredExpenses])

  // ==========================================
  // RESET FILTERS
  // ==========================================

  const resetFilters = () => {
    setSelectedDate('')
    setSelectedMonth('')
    setSelectedYear('')
    setCategoryFilter('')
    setSearch('')
  }

  // ==========================================
  // EXPORT EXCEL
  // ==========================================

  const exportExcel = () => {
    if (!filteredExpenses.length) {
      return
    }

    const exportData = filteredExpenses.map((expense) => ({
      Title: expense.title || '-',
      Category: expense.category || '-',
      Amount: Number(expense.amount || 0),
      Date: expense.createdAt ? new Date(expense.createdAt).toLocaleDateString('en-NG') : '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    const file = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    saveAs(file, `Expenses_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // ==========================================
  // DELETE EXPENSE
  // ==========================================
  //
  // The actual delete endpoint was not provided,
  // so this function does not invent one.
  //
  // Add your backend delete endpoint here when
  // you have it.
  // ==========================================

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${expense.title}"?`)

    if (!confirmed) {
      return
    }

    /*
     * Your current code does not provide the
     * DELETE API endpoint, so I am deliberately
     * not inventing one.
     *
     * Example when your backend endpoint is known:
     *
     * await axios.delete(
     *   `${API_URL}api/v1/expenses/${expense.id}`,
     *   {
     *     headers: {
     *       Authorization: `Bearer ${token}`,
     *     },
     *   },
     * )
     *
     * await getExpenses()
     */

    console.log('Delete requested for expense:', expense.id)
  }

  // ==========================================
  // EDIT EXPENSE
  // ==========================================

  const handleEdit = (expense) => {
    /*
     * Keep your existing edit flow here.
     *
     * The current code does not provide an edit
     * modal or update endpoint, so we don't invent
     * one.
     */

    console.log('Edit requested for expense:', expense)
  }

  return (
    <>
      {/* ==========================================
          PAGE HEADER
      ========================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardBody>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="fw-bold mb-1">Expense Management</h4>

              <p className="text-medium-emphasis mb-0">
                View, filter and manage business expenses and operating costs.
              </p>
            </div>

            <CButton color="success" onClick={exportExcel} disabled={!filteredExpenses.length}>
              <CIcon icon={cilCloudDownload} className="me-2" />
              Export Excel
            </CButton>
          </div>
        </CCardBody>
      </CCard>

      {/* ==========================================
          KPI SECTION
      ========================================== */}

      <CRow className="g-3 mb-4">
        {/* EXPENSE RECORDS */}

        <CCol xs={12} md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Expense Records</div>

              <h3 className="fw-bold mb-1">{totalExpenseRecords}</h3>

              <small className="text-medium-emphasis">Matching selected filters</small>
            </CCardBody>
          </CCard>
        </CCol>

        {/* TOTAL EXPENSE */}

        <CCol xs={12} md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Total Expenses</div>

              <h3 className="fw-bold text-danger mb-1">{money(totalExpenses)}</h3>

              <small className="text-medium-emphasis">Total amount for selected filters</small>
            </CCardBody>
          </CCard>
        </CCol>

        {/* CATEGORIES */}

        <CCol xs={12} md={4}>
          <CCard className="border-0 shadow-sm h-100">
            <CCardBody>
              <div className="text-medium-emphasis small mb-2">Categories</div>

              <h3 className="fw-bold mb-1">{totalCategories}</h3>

              <small className="text-medium-emphasis">Expense categories</small>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ==========================================
          FILTER PANEL
      ========================================== */}

      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-transparent border-0">
          <div className="d-flex align-items-center">
            <CIcon icon={cilFilter} className="me-2" />

            <strong>Expense Filters</strong>
          </div>
        </CCardHeader>

        <CCardBody>
          <CRow className="g-3">
            {/* SEARCH */}

            <CCol xs={12} lg={4}>
              <label className="small fw-semibold mb-1">Search</label>

              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>

                <CFormInput
                  placeholder="Search title or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>
            </CCol>

            {/* CATEGORY */}

            <CCol xs={12} md={6} lg={2}>
              <label className="small fw-semibold mb-1">Category</label>

              <CFormSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>

                <option value="Rent">Rent</option>

                <option value="Utilities">Utilities</option>

                <option value="Salary">Salary</option>

                <option value="Fuel">Fuel</option>

                <option value="Maintenance">Maintenance</option>

                <option value="Marketing">Marketing</option>

                <option value="Supplies">Supplies</option>

                <option value="Others">Others</option>
              </CFormSelect>
            </CCol>

            {/* DATE */}

            <CCol xs={12} md={6} lg={2}>
              <label className="small fw-semibold mb-1">Specific Date</label>

              <CFormInput
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </CCol>

            {/* MONTH */}

            <CCol xs={12} md={6} lg={2}>
              <label className="small fw-semibold mb-1">Month</label>

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

            {/* YEAR */}

            <CCol xs={12} md={6} lg={2}>
              <label className="small fw-semibold mb-1">Year</label>

              <CFormSelect value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="">All Years</option>

                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </CFormSelect>
            </CCol>
          </CRow>

          {/* FILTER ACTIONS */}

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-4">
            <small className="text-medium-emphasis">
              Showing <strong>{filteredExpenses.length}</strong> of {expenses.length} expense
              records
            </small>

            <div className="d-flex gap-2">
              <CButton color="secondary" variant="outline" onClick={resetFilters}>
                Reset Filters
              </CButton>

              <CButton color="primary" variant="outline" onClick={getExpenses} disabled={loading}>
                {loading ? (
                  <CSpinner size="sm" className="me-2" />
                ) : (
                  <CIcon icon={cilReload} className="me-2" />
                )}
                Refresh
              </CButton>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* ==========================================
          EXPENSE TABLE
      ========================================== */}

      <CCard className="border-0 shadow-sm">
        <CCardHeader className="bg-transparent">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-1">Expense Records</h5>

              <small className="text-medium-emphasis">Business expenses and operating costs</small>
            </div>

            <CBadge color="danger" className="px-3 py-2">
              Total: {money(totalExpenses)}
            </CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="p-0">
          <CTable hover responsive className="mb-0 align-middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>

                <CTableHeaderCell>Expense Title</CTableHeaderCell>

                <CTableHeaderCell>Category</CTableHeaderCell>

                <CTableHeaderCell>Amount</CTableHeaderCell>

                <CTableHeaderCell>Date</CTableHeaderCell>

                <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {loading ? (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-5">
                    <CSpinner className="mb-3" />

                    <div className="text-medium-emphasis">Loading expenses...</div>
                  </CTableDataCell>
                </CTableRow>
              ) : filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense, index) => (
                  <CTableRow key={expense.id}>
                    {/* NUMBER */}

                    <CTableDataCell>{index + 1}</CTableDataCell>

                    {/* TITLE */}

                    <CTableDataCell>
                      <strong>{expense.title || '-'}</strong>
                    </CTableDataCell>

                    {/* CATEGORY */}

                    <CTableDataCell>
                      <CBadge color="info">{expense.category || 'Others'}</CBadge>
                    </CTableDataCell>

                    {/* AMOUNT */}

                    <CTableDataCell>
                      <strong className="text-danger">{money(expense.amount)}</strong>
                    </CTableDataCell>

                    {/* DATE */}

                    <CTableDataCell>
                      {expense.createdAt
                        ? new Date(expense.createdAt).toLocaleDateString('en-NG', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </CTableDataCell>

                    {/* ACTIONS */}

                    <CTableDataCell className="text-end">
                      <CButton
                        size="sm"
                        color="info"
                        className="me-2"
                        title="Edit Expense"
                        onClick={() => handleEdit(expense)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>

                      <CButton
                        size="sm"
                        color="danger"
                        title="Delete Expense"
                        onClick={() => handleDelete(expense)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={6} className="text-center py-5">
                    <CIcon icon={cilSearch} size="xl" className="text-medium-emphasis mb-3" />

                    <h5>No expenses found</h5>

                    <p className="text-medium-emphasis mb-0">
                      Try changing your search or filters.
                    </p>
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </>
  )
}

export default ExpenseList
