import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

type User = {
  _id: string;
  email: string;
  displayName: string;
  role: 'agent' | 'supervisor' | 'admin';
} | null;

type AuthContextType = {
  user: User;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const base_url = import.meta.env.VITE_API_URL || 'http://10.42.0.1:4000 ';
  const [user, setUser] = useState<User>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          `${base_url}/api/auth/me`,
          { withCredentials: true }
        );
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
        if (error instanceof Error) {
          console.error(error.message);
        } else {
          console.error(String(error));
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate, location.pathname]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(
        `${base_url}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data);
      setIsAuthenticated(true);
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || "Invalid email or password");
      } else {
        throw new Error(String(error));
      }
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${base_url}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(String(error));
      }
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};