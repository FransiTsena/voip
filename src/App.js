import React from 'react';
import Dashboard from './components/Dashboard';
import RequireAuth from './components/RequireAuth';
import './App.css';

function App() {
  return (
    <div className="App">
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    </div>
  );
}

export default App;
