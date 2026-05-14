import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
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
        navigate("/verify", { state: { email: data.email } });
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
      <div className="register-container">

        {/* animation side */}
        <div className="register-visual">
          <img
            src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
            alt="programmer"
            className="register-img"
          />
        </div>

        {/* form card */}
        <form className="register-card" onSubmit={handleSubmit(onSubmit)}>
          <h1>Create Account</h1>
          <p>Join our AI Student Support System</p>

          <input
            type="text"
            placeholder="Enter your name"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && <p className="error-message">{errors.name.message}</p>}

          <input
            type="email"
            placeholder="Enter your email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter valid email",
              },
            })}
          />
          {errors.email && <p className="error-message">{errors.email.message}</p>}

          <input
            type="password"
            placeholder="Enter password"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Min 6 characters" },
            })}
          />
          {errors.password && (
            <p className="error-message">{errors.password.message}</p>
          )}

          <input
            type="password"
            placeholder="Confirm password"
            {...register("confirmPassword", {
              required: "Confirm your password",
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
      </div>
    </div>
  );
};

export default Register;