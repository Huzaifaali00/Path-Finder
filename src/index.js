// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Ensure you're using client
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);