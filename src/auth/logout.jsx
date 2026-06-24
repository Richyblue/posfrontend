import { useNavigate } from 'react-router-dom'

function LogoutButton() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('loginTime')

    navigate('/login')
  }

  return (
    <button size="lg" className="btn btn-danger" onClick={handleLogout}>
      Sign Out
    </button>
  )
}

export default LogoutButton
