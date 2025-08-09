import axios from 'axios';
import { useState } from 'react';
import { Home, Phone, Settings, ChevronDown, ChevronUp, Layers, HardDrive, Share2, Mail, Mic, MessageSquare, Briefcase, List, Code, Globe, Zap, Loader2, CheckCircle, XCircle } from 'lucide-react'; // Added Loader2, CheckCircle, XCircle icons
import { Link } from 'react-router-dom';

const TopNav = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const [isApplicationsOpen, setIsApplicationsOpen] = useState(false);
  const [isConnectivityOpen, setIsConnectivityOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'applying' | 'success' | 'error'>('idle'); // New state for apply config status

  const handleApplyConfig = async () => {
    setApplyStatus('applying'); // Set status to applying

    try {
      // Use VITE_API_URL from env or fallback
      const response = await axios.post(`${baseUrl}/api/apply-config`);
      console.log(response);
      if (response.status >= 200 && response.status < 300) {
        setApplyStatus('success');
      } else {
        setApplyStatus('error');
      }
    } catch (error) {
      console.error("Error applying config:", error);
      setApplyStatus('error');
    } finally {
      // Reset status after a short delay to show feedback
      setTimeout(() => {
        setApplyStatus('idle');
      }, 3000); // Show success/error for 3 seconds
    }
  };


  const renderApplyButtonContent = () => {
    switch (applyStatus) {
      case 'idle':
        return (
          <>
            <Zap className="h-5 w-5" />
            <span>Apply Config</span>
          </>
        );
      case 'applying':
        return (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Applying...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-5 w-5" />
            <span>Applied!</span>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="h-5 w-5" />
            <span>Failed!</span>
          </>
        );
      default:
        return null;
    }
  };

  const getButtonClasses = () => {
    let baseClasses = "ml-4 font-semibold px-5 py-2.5 rounded-full shadow-lg flex items-center space-x-2 transition-all duration-300 ";
    if (applyStatus === 'idle') {
      baseClasses += "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl transform hover:scale-105 animate-pulse-button";
    } else if (applyStatus === 'applying') {
      baseClasses += "bg-blue-500 text-white cursor-not-allowed";
    } else if (applyStatus === 'success') {
      baseClasses += "bg-green-500 text-white cursor-default";
    } else if (applyStatus === 'error') {
      baseClasses += "bg-red-500 text-white cursor-default";
    }
    return baseClasses;
  };

  return (
    <nav className="bg-white shadow-md font-inter border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 justify-between">
          {/* Left: Logo/Brand and Main Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-6">
              <a href="/dashboard" className="text-xl font-bold text-gray-800 flex items-center">
                <span className="text-blue-600">INSA</span>PBX
              </a>
            </div>
            <div className="flex space-x-6">
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Home className="h-5 w-5 mr-1" /> Home
              </Link>
              {/* Applications Dropdown */}
              <div className="relative"
                onMouseEnter={() => setIsApplicationsOpen(true)}
                onMouseLeave={() => setIsApplicationsOpen(false)}
              >
                <button
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center focus:outline-none"
                >
                  <Layers className="h-5 w-5 mr-1" /> Applications
                  {isApplicationsOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </button>
                {isApplicationsOpen && (
                  <div className="absolute left-0 mt-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <Link to="/ivr-menu" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <List className="h-4 w-4 mr-2" /> IVR
                      </Link>
                      <Link to="/misc-applications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" /> Misc Applications
                      </Link>
                      <Link to="/queue-list" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Briefcase className="h-4 w-4 mr-2" /> Queues
                      </Link>
                      <Link to="/system-recordings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Mail className="h-4 w-4 mr-2" /> Call Recording
                      </Link>
                      <Link to="/system-recordings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Mic className="h-4 w-4 mr-2" /> System Recordings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {/* Connectivity Dropdown */}
              <div className="relative"
                onMouseEnter={() => setIsConnectivityOpen(true)}
                onMouseLeave={() => setIsConnectivityOpen(false)}
              >
                <button
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center focus:outline-none"
                >
                  <Share2 className="h-5 w-5 mr-1" /> Connectivity
                  {isConnectivityOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </button>
                {isConnectivityOpen && (
                  <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <Link to="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <HardDrive className="h-4 w-4 mr-2" /> Trunks
                      </Link>
                      <Link to="/agents/list" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Phone className="h-4 w-4 mr-2" /> Extensions
                      </Link>
                      <Link to="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Globe className="h-4 w-4 mr-2" /> Inbound Routes
                      </Link>
                      <Link to="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Globe className="h-4 w-4 mr-2" /> Outbound Routes
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              {/* Settings Dropdown */}
              <div className="relative"
                onMouseEnter={() => setIsSettingsOpen(true)}
                onMouseLeave={() => setIsSettingsOpen(false)}
              >
                <button
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center focus:outline-none"
                >
                  <Settings className="h-5 w-5 mr-1" /> Settings
                  {isSettingsOpen ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </button>
                {isSettingsOpen && (
                  <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <Link to="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Settings className="h-4 w-4 mr-2" /> Advanced Settings
                      </Link>
                      <Link to="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Code className="h-4 w-4 mr-2" /> Manager User
                      </Link>
                      <Link to="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Mic className="h-4 w-4 mr-2" /> REST Interface Users
                      </Link>
                      <Link to="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Phone className="h-4 w-4 mr-2" /> SIP Settings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right: Apply Config Button */}
          <div className="flex items-center">
            <button
              className={getButtonClasses()}
              type="button"
              onClick={handleApplyConfig}
              disabled={applyStatus === 'applying'} // Disable button when applying
            >
              {renderApplyButtonContent()}
            </button>
          </div>
        </div>
      </div>
      {/* Styles for animations */}
      <style>{`
        @keyframes pulse-button {
          0% { transform: scale(1); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          50% { transform: scale(1.02); box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2); }
          100% { transform: scale(1); box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        }
        .animate-pulse-button {
          animation: pulse-button 2s infinite;
        }
      `}</style>
    </nav>
  );
};

export default TopNav;
