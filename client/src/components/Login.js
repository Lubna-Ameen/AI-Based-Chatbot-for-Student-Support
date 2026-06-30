import { Link, useNavigate } from 'react-router-dom';

import { useForm } from 'react-hook-form';

import axios from 'axios';

import Navbar from './Navbar';
import BrandLogo from './BrandLogo';
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

        if (response.data.user) {
          localStorage.setItem('studentUser', JSON.stringify(response.data.user));
        }

        navigate('/search');

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

      <Navbar />

      {/* Login Section */}
      <div className="login-container">
        <div className="container">

          <form

            onSubmit={handleSubmit(onSubmit)}
          >
            <BrandLogo className="auth-form-logo" size="small" />

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

                Rememberme
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

                : 'Login'}
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

          friendly AI assistant anytime.

          It can answer your questions,

          suggest learning plans, and guide

          you through your academic journey.
        </p>
      </div>
    </div>

  );

};

export default Login;
