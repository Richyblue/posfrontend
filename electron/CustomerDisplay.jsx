import { useState, useEffect } from 'react'

const CustomerDisplay = () => {
  const [cart, setCart] = useState([])

  const [total, setTotal] = useState(0)

  const [customer, setCustomer] = useState(null)

  useEffect(() => {
    if (window.electronAPI?.onCustomerUpdate) {
      window.electronAPI.onCustomerUpdate((data) => {
        setCart(data.cart || [])
        setTotal(data.total || 0)
        setCustomer(data.customer)
      })
    }
  }, [])

  return (
    <div
      style={{
        height: '100vh',
        background: '#fff',
        padding: '30px',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
        }}
      >
        PRINCESS SALON
      </h1>

      <hr />

      {customer && (
        <div
          style={{
            marginBottom: '20px',
          }}
        >
          <h3>{customer.fullname}</h3>

          <h5>Loyalty: {customer.loyaltyPoints}</h5>
        </div>
      )}

      <table
        width="100%"
        style={{
          fontSize: '24px',
        }}
      >
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>

              <td>{item.quantity}</td>

              <td>₦{Number((item.price || item.sellingPrice) * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h1
        style={{
          textAlign: 'right',
        }}
      >
        TOTAL: ₦{Number(total).toLocaleString()}
      </h1>

      <h3
        style={{
          textAlign: 'center',
          marginTop: '40px',
        }}
      >
        Thank You For Your Patronage
      </h3>
    </div>
  )
}

export default CustomerDisplay
