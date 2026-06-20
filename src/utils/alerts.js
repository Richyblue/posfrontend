import Swal from 'sweetalert2'

export const successAlert = (message) => {
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: message,
    timer: 2000,
    showConfirmButton: false,
  })
}

export const errorAlert = (message) => {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
  })
}

export const warningAlert = (message) => {
  Swal.fire({
    icon: 'warning',
    title: 'Warning',
    text: message,
  })
}

export const confirmDelete = async () => {
  return Swal.fire({
    title: 'Are you sure?',
    text: 'This item will be moved to Recycle Bin',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, Delete',
  })
}
