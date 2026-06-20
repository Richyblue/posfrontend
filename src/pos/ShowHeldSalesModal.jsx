import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CTable,
} from '@coreui/react'

export default function ShowHeldSalesModal({ show, onHide, heldSales = [], onRestore }) {
  return (
    <CModal visible={show} onClose={onHide} size="xl">
      <CModalHeader>
        <CModalTitle>Held Transactions</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <CTable striped hover responsive>
          <thead>
            <tr>
              <th>Hold No</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {heldSales.length > 0 ? (
              heldSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.holdNumber}</td>

                  <td>{sale.Customer?.fullname || 'Walk-in'}</td>

                  <td>{sale.items?.length || 0}</td>

                  <td>₦{Number(sale.totalAmount).toLocaleString()}</td>

                  <td>{new Date(sale.createdAt).toLocaleString()}</td>

                  <td>
                    <CButton color="success" size="sm" onClick={() => onRestore(sale)}>
                      Restore
                    </CButton>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No Held Sales
                </td>
              </tr>
            )}
          </tbody>
        </CTable>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" onClick={onHide}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
