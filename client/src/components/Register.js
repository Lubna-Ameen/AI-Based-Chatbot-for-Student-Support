import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import './Style.css';

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
      setError('confirmPassword', {
        type: 'validate',
        message: 'Passwords do not match',
      });
      return;
    }

    try {
      const response = await axios.post('http://localhost:3002/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        navigate('/verify', { state: { email: data.email } });
        return;
      }

      setError('root', {
        type: 'server',
        message: response.data.message || 'Registration failed',
      });
    } catch (error) {
      setError('root', {
        type: 'server',
        message: error.response?.data?.message || 'Unable to register. Please try again.',
      });
    }
  };

  return (
    <div className="container register-page">
      <div className="top-section">
        <img
          src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
          alt="person"
          className="left-image"
        />

        <img
          src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
          alt="robot"
          className="robot-image"
        />
      </div>

      <form className="form-box" onSubmit={handleSubmit(onSubmit)}>
        <input
          type="text"
          placeholder="Enter your name"
          {...register('name', {
            required: 'Name is required',
          })}
        />
        {errors.name && <p className="error-message">{errors.name.message}</p>}

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
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
        />
        {errors.password && <p className="error-message">{errors.password.message}</p>}

        <input
          type="password"
          placeholder="Confirm password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
          })}
        />
        {errors.confirmPassword && (
          <p className="error-message">{errors.confirmPassword.message}</p>
        )}

        {errors.root && <p className="error-message">{errors.root.message}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>

        <p>
          Already have an account ? <Link to="/login">log in</Link>
        </p>
      </form>

      <button
        type="button"
        className="back-icon"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        &larr;
      </button>
    </div>
  );
};

export default Register;
