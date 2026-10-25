import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import Emailver from "./components/Emailver";
import Welcome from "./components/Welcome";
import Home from "./components/Home";
import Forgetpass from "./components/Forgetpass";
import About from "./components/About";
import Contact from "./components/Contact";
import NextButton from "./components/NextButton";
import ChangePassword from "./components/ChangePassword";
import Logout from "./components/Logout";
import AdminAuth from "./components/Admin/AdminAuth";
import AdminForgotPassword from "./components/Admin/AdminForgotPassword";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminAccess from "./components/Admin/AdminAccess";
import AdminPage from "./components/Admin/AdminPage";
import AdminStudentManagement from "./components/Admin/AdminStudentManagement";
import AdminAcademicRecords from "./components/Admin/AdminAcademicRecords";
import AdminProfile from "./components/Admin/AdminProfile";
import AdminChangePassword from "./components/Admin/AdminChangePassword";
import AdminReports from "./components/Admin/AdminReports";
import AdminRiskMonitoring from "./components/Admin/AdminRiskMonitoring";
import Notifications from "./components/Notifications";
import MyProgress from "./components/MyProgress";
import Chatbot from "./components/Chatbot";
import StudentDashboard from "./components/StudentDashboard/StudentDashboard";
/* The App component sets up the routing for the application using React Router. It defines routes for public, student, and admin pages.
 The NextButton component is included outside of the Routes to ensure it is rendered on all pages. */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Emailver />} />
        <Route path="/reset-password" element={<ChangePassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/forget-password" element={<Forgetpass />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/my-progress" element={<MyProgress />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/admin/login" element={<AdminAccess><AdminAuth /></AdminAccess>} />
        <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
        <Route path="/admin/dashboard" element={<AdminAccess><AdminDashboard /></AdminAccess>} />
        <Route path="/admin/students" element={<AdminAccess><AdminPage><AdminStudentManagement /></AdminPage></AdminAccess>} />
        <Route path="/admin/academic-records" element={<AdminAccess><AdminPage><AdminAcademicRecords /></AdminPage></AdminAccess>} />
        <Route path="/admin/profile" element={<AdminAccess><AdminPage><AdminProfile /></AdminPage></AdminAccess>} />
        <Route path="/admin/change-password" element={<AdminAccess><AdminPage><AdminChangePassword /></AdminPage></AdminAccess>} />
        <Route path="/admin/reports" element={<AdminAccess><AdminPage><AdminReports /></AdminPage></AdminAccess>} />
        <Route path="/admin/risk-monitoring" element={<AdminAccess><AdminPage><AdminRiskMonitoring /></AdminPage></AdminAccess>} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="*" element={<Welcome />} />
      </Routes>
      <NextButton />
    </BrowserRouter>
  );
}

export default App;
