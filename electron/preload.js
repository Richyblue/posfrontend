const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  printReceipt: (html) => ipcRenderer.invoke('print-receipt', html),

  updateCustomerDisplay: (data) => ipcRenderer.send('update-customer-display', data),

  onCustomerUpdate: (callback) =>
    ipcRenderer.on('customer-update', (event, data) => callback(data)),
})
