import Dashboard from './components/Dashboard';
import RequireAuth from './components/RequireAuth';
import { SIPProvider } from './components/SIPProvider';
import './App.css';

function App() {
  return (
    <SIPProvider>
      <div className="App">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </div>
    </SIPProvider>
  );
}

export default App;
