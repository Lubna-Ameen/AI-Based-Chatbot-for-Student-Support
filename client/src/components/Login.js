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
      const response = await axios.post('http://localhost:3002/login', data);

      if (response.data.success) {
        navigate('/');
        return;
      }

      setError('root', {
        type: 'server',
        message: response.data.message || 'Login failed',
      });
    } catch (error) {
      setError('root', {
        type: 'server',
        message: error.response?.data?.message || 'Unable to login. Please try again.',
      });
    }
  };

  return (
    <div className="login-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-brand">
          <h2>AI Chatbot</h2>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>
       </nav>
      {/* Main Content */}
      <div className="login-container">
        <div className="container">
          <div className="top-section">
            <img
              src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
              alt="person using laptop"
              className="left-image"
            />

            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
              alt="robot assistant"
              className="robot-image"
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <input
              type="email"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
            />
            {errors.email && <p className="error-message">{errors.email.message}</p>}

            <input
              type="password"
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
              })}
            />
            {errors.password && <p className="error-message">{errors.password.message}</p>}

            <div className="options">
              <label className="remember">
                <input type="checkbox" {...register('rememberMe')} />
                Remember me
              </label>

              <button
                type="button"
                className="link-button"
                onClick={() => navigate('/forget-password')}
              >
                Forgot password?
              </button>
            </div>

            {errors.root && <p className="error-message">{errors.root.message}</p>}

            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Secure Login'}
            </button>
          </form>

          <p className="signup">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>

          <button
            type="button"
            className="back-icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            &larr;
          </button>
        </div>
      </div>

      {/* Bottom Message */}
      <div className="ai-assistant-message">
        <p>
          Need help? Just chat with our friendly AI assistant anytime! 🤖💬
          It can answer your questions, give study tips, suggest personalized learning plans,
          and guide you toward the right academic support when you need it.
        </p>
      </div>
    </div>
  );
};

export default Login;
