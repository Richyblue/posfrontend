const printReceipt = async (sale) => {
  const html = `
  <html>
  <body style="font-family:Arial;padding:10px;">
  
  <h2 style="text-align:center">
  PRINCESS SALON
  </h2>

  <hr/>

  <p><strong>Receipt:</strong> ${sale.receiptNumber}</p>

  <p><strong>Customer:</strong> ${sale.customerName}</p>

  <p><strong>Date:</strong>
  ${new Date().toLocaleString()}
  </p>

  <hr/>

  ${
    sale.items
      ?.map(
        (item) => `
      <div>
        ${item.name}
        x ${item.quantity}
        = ₦${item.subtotal}
      </div>
    `,
      )
      .join('') || ''
  }

  <hr/>

  <h3>
    Total:
    ₦${sale.totalAmount}
  </h3>

  <br/>

  <p>
    Thank you for your patronage
  </p>

  </body>
  </html>
  `

  if (window.electronAPI) {
    await window.electronAPI.printReceipt(html)
  }
}
