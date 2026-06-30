import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaClock, FaLock, FaRegLightbulb } from "react-icons/fa";
import { useForm } from "react-hook-form";
import axios from "axios";
import Navbar from "./Navbar";
import BrandLogo from "./BrandLogo";
import "./Style.css";

const Register = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        type: "validate",
        message: "Passwords do not match",
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:3002/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        if (response.data.user) {
          localStorage.setItem("studentUser", JSON.stringify(response.data.user));
        }

        navigate("/search");
      } else {
        setError("root", {
          type: "server",
          message: response.data.message || "Registration failed",
        });
      }
    } catch (error) {
      setError("root", {
        type: "server",
        message:
          error.response?.data?.message ||
          "Unable to register. Please try again.",
      });
    }
  };

  return (
    <div className="register-page">
      <button
        type="button"
        className="register-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>

      <Navbar />

      <main className="register-layout">
        <section className="register-marketing">
          <span className="register-kicker">Student support made smarter</span>
          <h1>Create Your Account</h1>
          <p>
            Join an AI-powered learning workspace built to help students get
            answers faster, stay organized, and feel supported throughout their
            academic journey.
          </p>

          <div className="register-features">
            <div className="register-feature-item">
              <FaRegLightbulb />
              <div>
                <h3>Personalized guidance</h3>
                <p>Get study support that adapts to your questions and goals.</p>
              </div>
            </div>
            <div className="register-feature-item">
              <FaClock />
              <div>
                <h3>Fast answers</h3>
                <p>Find useful academic help without wasting time searching.</p>
              </div>
            </div>
            <div className="register-feature-item">
              <FaLock />
              <div>
                <h3>Trusted access</h3>
                <p>Use a clean, secure experience designed for student support.</p>
              </div>
            </div>
          </div>

          <div className="register-trust-line">
            <FaCheckCircle />
            <span>Built for modern AI student support platforms</span>
          </div>
        </section>

        <section className="register-form-section">
        <form className="register-card" onSubmit={handleSubmit(onSubmit)}>
          <BrandLogo className="auth-form-logo" size="small" />
          <h2>Register</h2>
          <p>Start your AI student support experience.</p>

          <input
            type="text"
            placeholder="Name is required"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="error-message">{errors.name.message}</p>
          )}

          <input
            type="email"
            placeholder="Email is required"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}

          <input
            type="password"
            placeholder="Password is required"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            })}
          />
          {errors.password && (
            <p className="error-message">{errors.password.message}</p>
          )}

          <input
            type="password"
            placeholder="Confirm your password"
            {...register("confirmPassword", {
              required: "Confirm Password is required",
            })}
          />
          {errors.confirmPassword && (
            <p className="error-message">{errors.confirmPassword.message}</p>
          )}

          {errors.root && (
            <p className="error-message">{errors.root.message}</p>
          )}

          <button className="register-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Register"}
          </button>

          <p className="register-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
        </section>
      </main>
    </div>
  );
};

export default Register;
