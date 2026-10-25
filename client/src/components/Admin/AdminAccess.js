import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { get } from "./adminApi";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/forgot-password"];

const AdminAccess = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(
    PUBLIC_ADMIN_PATHS.includes(location.pathname)
  );

  useEffect(() => {
    if (PUBLIC_ADMIN_PATHS.includes(location.pathname)) {
      setAuthorized(true);
      return;
    }

    let active = true;
    setAuthorized(false);
    get("/auth/me")
      .then(() => active && setAuthorized(true))
      .catch(() => {
        if (active) navigate("/admin/login", { replace: true });
      });

    return () => {
      active = false;
    };
  }, [location.pathname, navigate]);

  return authorized ? children : null;
};

export default AdminAccess;
