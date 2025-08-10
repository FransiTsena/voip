import { Routes, Route, Outlet } from "react-router-dom";
import TopNav from "./components/TopNav";
import LiveCalls from "./pages/Dashboard";
import Sidebar from "./components/SideBar";
import Agents from "./pages/Agents";
import TableComponent from "./pages/ExtensionMestriks";
import QueueManagement from "./pages/QueueManagement";
import Report from "./pages/Report";
import CallHistory from "./pages/CallHistory";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { UseSocket } from "./context/SocketContext";
import IVRMenus from "./components/IVRMenus";
import IVRMenuForm from "./components/IVRMenuForm";
import SystemRecordingUpload from "./components/SystemRecordingUpload";
import MiscApplication from "./pages/MiscApplication";
import SystemRecordingsList from "./pages/SystemRecordingsList";
import EditIVRMenu from "./pages/EditIVRMenu";
import MiscApplicationList from "./components/MiscApplication/MiscApplicationList";
import RegistrationForm from "./forms/AgentRegistrationForm";
import QueuePage from "./pages/QueuePage";
import AgentPage from "./pages/AgentPage";
import QueueList from "./pages/QueueList";
import AgentList from "./pages/AgentList";
import LoginPage from "./auth/Login";
import { useAuth } from "./context/AuthContext";
import QueueStatistics from "./pages/QueueStatistics";

// Loading component to display while checking authentication
const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 text-lg">Loading...</p>
      </div>
    </div>
  );
};

// Define a Layout component for shared UI elements
const MainLayout = () => {
  const { socket, setSocket, clearSocketState } = UseSocket();

  useEffect(() => {
    if (!socket) {
      const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:4000");
      newSocket.on("connect", () => setSocket(newSocket));
      return () => {
        newSocket.disconnect();
        clearSocketState();
      };
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-50">
        <TopNav />
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <div className="w-full h-full overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const { loading } = useAuth();

  // Show loading UI while checking authentication
  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* 1. Login page - this route stands alone */}
      <Route path="/login" element={<LoginPage />} />

      {/* 2. All other routes that share the TopNav and Sidebar layout */}
      <Route path="/" element={<MainLayout />}>
        <Route path="report" element={<Report />} />
        <Route path="dashboard" element={<LiveCalls />} />
        <Route path="agents" element={<Agents />} />
        <Route path="agents/new" element={<RegistrationForm />} />
        <Route path="queues" element={<QueueManagement />} />
        <Route path="ivr-menu" element={<IVRMenus />} />
        <Route path="ivr-menu/edit/:id" element={<EditIVRMenu />} />
        <Route path="new-ivr" element={<IVRMenuForm />} />
        <Route path="system-recordings" element={<SystemRecordingsList />} />
        <Route path="system-recordings-upload" element={<SystemRecordingUpload />} />
        <Route path="call-history" element={<CallHistory />} />
        <Route path="new-misc-application" element={<MiscApplication />} />
        <Route path="misc-applications" element={<MiscApplicationList />} />
        <Route path="queue/dev" element={<QueuePage />} />
        <Route path="agent/dev" element={<AgentPage />} />
        <Route path="agent/dev/:id" element={<AgentPage />} />
        <Route path="queue-list" element={<QueueList />} />
        <Route path="queues/edit/:id" element={<QueuePage />} />
        <Route path="agents/list" element={<AgentList />} />
        <Route path="queue-statistics" element={<QueueStatistics />} />
        <Route index element={<TableComponent />} />
      </Route>
    </Routes>
  );
}