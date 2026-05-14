import { Link, useNavigate } from 'react-router-dom';

import { useForm } from 'react-hook-form';

import axios from 'axios';

import './Style.css';

const Login = () => {

  const navigate = useNavigate();

  const {

    register,

    handleSubmit,

    formState: { errors, isSubmitting },

    setError,

  } = useForm();

  const onSubmit = async (data) => {

    try {

      const response = await axios.post(

        'http://localhost:3002/login',

        data

      );

      if (response.data.success) {

        navigate('/');

        return;

      }

      setError('root', {

        type: 'server',

        message:

          response.data.message || 'Login failed',

      });

    } catch (error) {

      setError('root', {

        type: 'server',

        message:

          error.response?.data?.message ||

          'Unable to login. Please try again.',

      });

    }

  };

  return (
    <div className="login-page">

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <h2>AI Learn</h2>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">

              About Us
            </Link>
          </li>
          <li>
            <Link to="/contact">

              Contact Us
            </Link>
          </li>
        </ul>
      </nav>

      {/* Login Section */}
      <div className="login-container">
        <div className="container">

          {/* Left Side */}
          <div className="top-section">
            <img

              src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"

              alt="AI learning"

              className="left-image"

            />
            <img

              src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"

              alt="robot assistant"

              className="robot-image"

            />
          </div>

          {/* Right Side */}
          <form

            onSubmit={handleSubmit(onSubmit)}
          >
            <h1>

              Welcome Back
            </h1>
            <p>

              Login securely and continue

              your AI learning journey.
            </p>

            {/* Email */}
            <input

              type="email"

              placeholder="Enter your email"

              {...register('email', {

                required:

                  'Email is required',

                pattern: {

                  value:

                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

                  message:

                    'Enter a valid email address',

                },

              })}

            />

            {errors.email && (
              <p className="error-message">

                {errors.email.message}
              </p>

            )}

            {/* Password */}
            <input

              type="password"

              placeholder="Enter your password"

              {...register('password', {

                required:

                  'Password is required',

              })}

            />

            {errors.password && (
              <p className="error-message">

                {errors.password.message}
              </p>

            )}

            {/* Options */}
            <div className="options">
              <label className="remember">
                <input

                  type="checkbox"

                  {...register(

                    'rememberMe'

                  )}

                />

                Remember me
              </label>
              <button

                type="button"

                className="link-button"

                onClick={() =>

                  navigate('/forget-password')

                }
              >

                Forgot password?
              </button>
            </div>

            {/* Server Error */}

            {errors.root && (
              <p className="error-message">

                {errors.root.message}
              </p>

            )}

            {/* Login Button */}
            <button

              type="submit"

              className="login-btn"

              disabled={isSubmitting}
            >

              {isSubmitting

                ? 'Logging in...'

                : 'Secure Login'}
            </button>

            {/* Signup */}
            <p className="signup">

              Don't have an account?
              <Link to="/register">

                {' '}Sign up
              </Link>
            </p>

            {/* Back Button */}
            <button

              type="button"

              className="back-icon"

              onClick={() => navigate(-1)}

              aria-label="Go back"
            >
              &larr;
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Message */}
      <div className="ai-assistant-message">
        <p>

          Need help? Just chat with our

          friendly AI assistant anytime 🤖💬

          It can answer your questions,

          suggest learning plans, and guide

          you through your academic journey.
        </p>
      </div>
    </div>

  );

};

export default Login;
