import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div style={styles.nav}>

      <Link to="/welcome" style={styles.link}>Welcome</Link>

      <Link to="/welcome" style={styles.link}>Home</Link>

      <Link to="/login" style={styles.link}>Login</Link>

      <Link to="/register" style={styles.link}>Register</Link>

    </div>
  );
};

const styles = {
  nav: {
    display: "flex",
    gap: "20px",
    padding: "15px",
    backgroundColor: "#2f6b3d",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "16px",
  },
};

export default Navbar;