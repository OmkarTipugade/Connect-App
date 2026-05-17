import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./pages/user-login/Login";
import "react-toastify/ReactToastify.css";
import { ProtectedRoute, PublicRoute } from "./protected";
import Home from "./components/Home";
import UserDetails from "./components/UserDetails";
import Status from "./pages/status/Status";
import Settings from "./pages/settings/Settings";
import useUserStore from "./store/UseUserStore";
import { use, useEffect } from "react";

const App = () => {

  const {user}  = useUserStore();

  useEffect(()=> {
    if(user.id) {
      const socket = getSocket();
    }

    return () => {
      disconnectSocket();
    }
  }, [user])
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
