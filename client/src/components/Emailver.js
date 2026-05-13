import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import './Style.css';

const Emailver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm();

  useEffect(() => {
    if (location.state?.email) {
      setValue('email', location.state.email);
    }
  }, [location.state, setValue]);

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('http://localhost:3002/verify-otp', {
        email: data.email,
        otp: data.otp,
      });

      if (response.data.success) {
        navigate('/login');
        return;
      }

      setError('root', {
        type: 'server',
        message: response.data.message || 'Verification failed',
      });
    } catch (error) {
      setError('root', {
        type: 'server',
        message: error.response?.data?.message || 'Unable to verify code. Please try again.',
      });
    }
  };

  const resendOtp = async () => {
    const email = getValues('email');

    if (!email) {
      setError('email', {
        type: 'required',
        message: 'Email is required to resend OTP',
      });
      return;
    }

    try {
      const response = await axios.post('http://localhost:3002/send-otp', { email });

      if (!response.data.success) {
        setError('root', {
          type: 'server',
          message: response.data.message || 'Unable to resend OTP',
        });
      }
    } catch (error) {
      setError('root', {
        type: 'server',
        message: error.response?.data?.message || 'Unable to resend OTP. Please try again.',
      });
    }
  };

  return (
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

      <form className="form-box" onSubmit={handleSubmit(onSubmit)}>
        <h2>Email Verification</h2>

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
          type="text"
          placeholder="Enter OTP code"
          {...register('otp', {
            required: 'OTP is required',
            minLength: {
              value: 6,
              message: 'OTP must be 6 digits',
            },
            maxLength: {
              value: 6,
              message: 'OTP must be 6 digits',
            },
          })}
        />
        {errors.otp && <p className="error-message">{errors.otp.message}</p>}

        {errors.root && <p className="error-message">{errors.root.message}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Verify Email'}
        </button>

        <button type="button" className="link-button" onClick={resendOtp}>
          Resend OTP
        </button>

        <p>
          Already verified? <button type="button" className="link-button" onClick={() => navigate('/login')}>
            Go to login
          </button>
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

export default Emailver;
