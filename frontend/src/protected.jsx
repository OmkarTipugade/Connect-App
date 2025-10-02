import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import useUserStore from "./store/UseUserStore";
import { checkAuthentication } from "./services/user.service";
import Loader from "./utils/Loader.jsx";

const ProtectedRoute = () => {
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { isAuthenticated, setUser, clearUser } = useUserStore();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkAuthentication();

        if (response?.isAuthenticated) {
          setUser(response.user);
        } else {
          clearUser();
        }
      } catch (error) {
        console.error(error);
        clearUser();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [setUser, clearUser]);

  if (isCheckingAuth) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/user-login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export { ProtectedRoute, PublicRoute };
