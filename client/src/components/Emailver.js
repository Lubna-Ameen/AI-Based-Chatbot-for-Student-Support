import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import Navbar from './Navbar';
import BrandLogo from './BrandLogo';
import './Style.css';

const Emailver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPasswordReset = location.state?.isPasswordReset === true;
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
      const response = await axios.post('http://127.0.0.1:3002/verify-otp', {
        email: data.email,
        otp: data.otp,
      });

      if (response.data.success) {
        if (isPasswordReset) {
          navigate('/change-password', {
            state: {
              email: data.email,
              resetToken: response.data.resetToken,
            },
          });
          return;
        }

        navigate('/search');
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
        message: 'Email or phone number is required to resend OTP',
      });
      return;
    }

    try {
      const endpoint = isPasswordReset
        ? 'http://127.0.0.1:3002/send-reset-otp'
        : 'http://127.0.0.1:3002/send-otp';
      const response = await axios.post(endpoint, { email });

      if (!response.data.success) {
        setError('root', {
          type: 'server',
          message: response.data.message || 'Unable to resend OTP email',
        });
        return;
      }

    } catch (error) {
      setError('root', {
        type: 'server',
        message: error.response?.data?.message || 'Unable to resend OTP email. Please try again.',
      });
    }
  };

  return (
    <div className="emailver-page">
      <Navbar />

      <div className="container emailver-container">
        <form className="form-box" onSubmit={handleSubmit(onSubmit)}>
          <BrandLogo className="verification-logo" size="medium" />

          <h2>Email Verification</h2>
          <p className="emailver-description">
            Enter your email address and the OTP code sent to your inbox to
            verify your account securely.
          </p>

        <input
          type="text"
          placeholder="Email address or phone number"
          {...register('email', {
            required: 'Email or phone number is required',
          })}
        />
        {errors.email && <p className="error-message">{errors.email.message}</p>}

        <input
          type="text"
          placeholder="OTP Code"
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
            Go to Login
          </button>
        </p>
        </form>

        <button
          type="button"
          className="back-icon"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>
      </div>
    </div>
  );
};

export default Emailver;
