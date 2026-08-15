import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DecisionMaker from './pages/DecisionMaker'; 
import FieldEngineer from './pages/FieldEngineer';
import Farmer from './pages/Farmer';
import IoTSimulator from './IoTSimulator';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/decision-maker" element={<DecisionMaker />} />
        <Route path="/field-engineer" element={<FieldEngineer />} />
        <Route path="/farmer" element={<Farmer />} />
        <Route path="/iot-simulator" element={<IoTSimulator />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
