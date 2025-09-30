import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import Login from './pages/user-login/Login'
import 'react-toastify/ReactToastify.css'
const App =()=> {
  return (
    <>
    <ToastContainer position='top-right' autoClose={3000} />
    <Router>
      <Routes>
        <Route path="/user-login" element={<Login/>} />
      </Routes>
    </Router>
    </>
  )
}

export default App
