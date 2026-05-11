import { Form, FormGroup, Input, Label} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoginValidation } from '../validations/LoginValidation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './Style.css';
 
 
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="container">

      {/* صورة */}
      <div className="top-image">
        <img
          src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
          alt="login"
        />
      </div>

      {/* الفورم */}
      <form>

        {/* Email */}
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

      