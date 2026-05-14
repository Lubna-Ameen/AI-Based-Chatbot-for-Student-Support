import { useState } from 'react';
import './Style.css';

const Forgetpass = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSearchByUsername = (e) => {
    e.preventDefault();
    if (!username) {
      setMessage('❌ Please enter a username');
      return;
    }
    setMessage(`✅ If "${username}" exists, reset instructions will be sent.`);
    setUsername('');
  };

  const handleSearchByEmail = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('❌ Please enter a valid email');
      return;
    }
    setMessage(`✅ If "${email}" exists, reset instructions will be sent.`);
    setEmail('');
  };

  return (
    <div className="forgetpass-page">
      <div className="forget-container">
        <h1>Forgot Password?</h1>
        <p>
          To reset your password, submit your username or your email address below.
          If we can find you in the database, an email will be sent with instructions.
        </p>

        {/* Search by Username */}
        <form onSubmit={handleSearchByUsername} className="forget-form">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
          <button type="submit" className="forget-btn">Search</button>
        </form>

        {/* Search by Email */}
        <form onSubmit={handleSearchByEmail} className="forget-form">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            required
          />
          <button type="submit" className="forget-btn">Search</button>
        </form>

        {message && <div className="message-box">{message}</div>}
      </div>
      <button
        className="close-btn"
        onClick={() => window.history.back()}
        title="Close"
      >
        ✕
      </button>
    </div>
  );
};

export default Forgetpass;
