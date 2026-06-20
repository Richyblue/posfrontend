import { useEffect, useState } from 'react'

export default function CustomerDisplay() {
  const [cart, setCart] = useState([])

  const [total, setTotal] = useState(0)

  useEffect(() => {
    window.electronAPI.onCartUpdate((data) => {
      setCart(data.items)

      setTotal(data.total)
    })
  }, [])

  return (
    <div className="vh-100 bg-dark text-white p-5">
      <h1>Princess Salon</h1>

      {cart.map((item) => (
        <div key={item.id}>
          {item.name}₦{item.subtotal}
        </div>
      ))}

      <hr />

      <h1>Total: ₦{total}</h1>
    </div>
  )
}
