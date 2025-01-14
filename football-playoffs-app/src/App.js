import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing
import Navbar from './components/Navbar';
import Register from './components/register';
import Login from './components/login';
import Predictions from './components/Predictions';



function App() {
  const [user, setUser] = useState(null); // Manage logged-in user
  const [usersDB, setUsersDB] = useState([]); // Store users' credentials (In memory for now)

  useEffect(() => {
    // Check if user is already logged in on page reload
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Register user
  const registerUser = (username, password) => {
    // Hash password before saving
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Store username and hashed password
    setUsersDB([...usersDB, { username, password: hashedPassword }]);
    localStorage.setItem('user', username); // Store the logged-in user
    setUser(username); // Log in the user immediately after registering
  };

  // Login user
  const loginUser = (username, password) => {
    // Find the user by username
    const user = usersDB.find((user) => user.username === username);
    if (user && bcrypt.compareSync(password, user.password)) {
      setUser(username);
      localStorage.setItem('user', username);
      return true;
    } else {
      alert('Invalid username or password');
      return false;
    }
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <Navbar user={user} logoutUser={logoutUser} />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/predictions" /> : <Login loginUser={loginUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/predictions" /> : <Register registerUser={registerUser} />}
        />
        <Route
          path="/predictions"
          element={user ? <Predictions /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={user ? "/predictions" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
