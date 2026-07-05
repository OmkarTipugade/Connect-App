import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { ProtectedRoute, PublicRoute } from "./protected";
import useUserStore from "./store/UseUserStore";
import { useChatStore } from "./store/chatStore";
import { useThemeInit } from "./store/themeStore";
import { disconnectSocket, initializeSocket } from "./services/chat.service";
import Loader from "./utils/Loader";

const Login = lazy(() => import("./pages/user-login/Login"));
const Home = lazy(() => import("./components/Home"));
const UserDetails = lazy(() => import("./components/UserDetails"));
const Status = lazy(() => import("./pages/status/Status"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const AboutPage = lazy(() => import("./pages/settings/AboutPage"));
const PrivacyPage = lazy(() => import("./pages/settings/PrivacyPage"));
const StarredMessagesPage = lazy(() => import("./pages/settings/StarredMessagesPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#111b21]">
    <Loader />
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </Router>
    </>
  );
};

export default App;
