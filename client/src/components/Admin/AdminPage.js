import { useState } from "react";
import AdminPortalNav from "./AdminPortalNav";

const AdminPage = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-portal-shell${collapsed ? " is-sidebar-collapsed" : ""}`}>
      <AdminPortalNav collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main className="admin-workspace">{children}</main>
    </div>
  );
};
export default AdminPage;
