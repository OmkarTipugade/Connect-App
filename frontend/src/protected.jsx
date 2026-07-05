import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import useUserStore from "./store/UseUserStore";
import { checkAuthentication } from "./services/user.service";
import Loader from "./utils/Loader.jsx";

const ProtectedRoute = () => {
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkAuthentication();

        if (response?.isAuthenticated && response.user?.id) {
          setUser(response.user);
          setIsAuthed(true);
        } else {
          clearUser();
          setIsAuthed(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        clearUser();
        setIsAuthed(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [setUser, clearUser]);

  if (isCheckingAuth) {
    return <Loader />;
  }

  if (!isAuthed) {
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const isAuthenticated = useUserStore(
    (state) => state.isAuthenticated && Boolean(state.user?.id),
  );

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute, PublicRoute };
