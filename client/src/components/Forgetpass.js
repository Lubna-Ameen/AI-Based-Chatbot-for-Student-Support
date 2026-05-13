import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Style.css';

const Forgetpass = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  
  const handleSubmit = (event) => {
    event.preventDefault();
    // Replace with actual reset logic when ready.
    alert('A password reset link will be sent if this email is registered.');
  };

  return (
    <div className="forgetpass-page">
      <div className="forget-container">
        <div className="forget-left">
          <img
            src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
            alt="Person standing in front of a computer screen"
            className="forget-main-image"
          />
        </div>

        <div className="forget-right">
          <div className="forget-top">
            <h1>Forget password</h1>
            <p>Enter your email to reset your password</p>
          </div>
          <form className="forget-form" onSubmit={handleSubmit}>
            <input
              id="reset-email"
              type="email"
              className="forget-input"
              value={email}
               onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
            <button type="submit" className="forget-btn">
              Send reset password
            </button>
          </form>

          <div className="forget-robots">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
              alt="friendly robot"
            />
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
              alt="friendly robot"
            />
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712042.png"
              alt="friendly robot"
            />
          </div>

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
    </div>
    
    );
};

export default Forgetpass;