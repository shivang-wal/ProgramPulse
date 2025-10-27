import { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import { Toaster } from '@/components/ui/sonner';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="nav-bar">
      <div className="nav-container">
        <div className="nav-brand">
          <div>
            <h1 className="brand-title">ProgramPulse</h1>
            <div className="brand-tagline">keeping a pulse on all LucyRx initiatives</div>
          </div>
        </div>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            data-testid="nav-dashboard"
          >
            Dashboard
          </Link>
          <Link 
            to="/calendar" 
            className={`nav-link ${location.pathname === '/calendar' ? 'active' : ''}`}
            data-testid="nav-calendar"
          >
            Release Calendar
          </Link>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;