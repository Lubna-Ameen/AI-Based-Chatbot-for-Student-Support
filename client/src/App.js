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
        <Route path="/forget-password" element={<Forgetpass />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Welcome />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;