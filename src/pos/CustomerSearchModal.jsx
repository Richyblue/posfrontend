import { useState } from 'react'

import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CButton,
  CTable,
  CFormInput,
} from '@coreui/react'

export default function CustomerSearchModal({ show, onHide, customers = [], onSelect }) {
  const [search, setSearch] = useState('')

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(
        (customer) =>
          customer.fullname?.toLowerCase().includes(search.toLowerCase()) ||
          customer.phone?.includes(search),
      )
    : []
  return (
    <CModal visible={show} onClose={onHide} size="lg">
      <CModalHeader>
        <CModalTitle>Search Customer</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CFormInput
          placeholder="Search by name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <CTable striped hover responsive className="mt-3">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Points</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.fullname}</td>

                  <td>{customer.phone}</td>

                  <td>{customer.loyaltyPoints}</td>

                  <td>
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={() => {
                        onSelect(customer)

                        onHide()
                      }}
                    >
                      Select
                    </CButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </CTable>
      </CModalBody>
    </CModal>
  )
}
