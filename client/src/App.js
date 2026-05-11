import Home from "./pages/Home";
import StudentLogin from "./pages/StudentLogin";
import AdminLogin from "./pages/AdminLogin";
import StudentRegister from "./pages/StudentRegister";
import AdminRegister from "./pages/AdminRegister";

function App() {
  return (
    <div>
      {/* Home Page */}
      <Home />

      {/* Student Login */}
      <StudentLogin />

      {/* Admin Login */}
      <AdminLogin />

      {/* Student Register */}
      <StudentRegister />

      {/* Admin Register */}
      <AdminRegister />
    </div>
  );
}

export default App;