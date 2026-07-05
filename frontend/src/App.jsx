import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./pages/user-login/Login";
import "react-toastify/ReactToastify.css";
import { ProtectedRoute, PublicRoute } from "./protected";
import Home from "./components/Home";
import UserDetails from "./components/UserDetails";
import Status from "./pages/status/Status";
import Settings from "./pages/settings/Settings";
import AboutPage from "./pages/settings/AboutPage";
import PrivacyPage from "./pages/settings/PrivacyPage";
import StarredMessagesPage from "./pages/settings/StarredMessagesPage";
import useUserStore from "./store/UseUserStore";
import { useChatStore } from "./store/chatStore";
import { useThemeInit } from "./store/themeStore";
import { useEffect } from "react";
import { disconnectSocket, initializeSocket } from "./services/chat.service";

const App = () => {
  useThemeInit();
  const user = useUserStore((state) => state.user);
  const setCurrentUser = useChatStore((state) => state.setCurrentUser);
  const initSocketListeners = useChatStore((state) => state.initSocketListeners);

  useEffect(() => {
    if (!user?.id) {
      disconnectSocket();
      return;
    }

    setCurrentUser(user);
    initializeSocket();
    initSocketListeners();

    return () => {
      disconnectSocket();
    };
  }, [user?.id, setCurrentUser, initSocketListeners]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/user/:userId" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/about" element={<AboutPage />} />
            <Route path="/settings/privacy" element={<PrivacyPage />} />
            <Route path="/settings/starred" element={<StarredMessagesPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
