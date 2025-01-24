import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', {
        username,
        password,
      });

      // Ambil token dari response
      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token); // Simpan token di localStorage
        onLogin(); // Panggil callback untuk pindah ke halaman utama
      } else {
        setErrorMessage('Invalid server response. Please try again.');
      }
    } catch (error) {
      // Tangkap error dan tampilkan pesan
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Login failed!');
      } else {
        setErrorMessage('Unable to connect to the server.');
      }
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username: </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password: </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
};

export default Login;
