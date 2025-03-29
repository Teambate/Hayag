import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import axios, { AxiosError } from 'axios';

// Define user type
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  devices?: Array<{
    deviceId: string;
    name: string;
    dateAdded: string;
    location: string;
  }>;
}

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  refreshUser: async () => false,
});

// Create AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in on component mount
  useEffect(() => {
    // Create a module-scoped initialization flag to prevent duplicate calls
    let isInitializing = false;
    
    const loadStoredUser = async () => {
      if (isInitializing) return;
      isInitializing = true;
      
      try {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          // Set the user from localStorage
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Set the lastUserRefresh timestamp to prevent immediate refresh from App.tsx useEffect
          localStorage.setItem('lastUserRefresh', Date.now().toString());
          
          // Directly fetch user data from API instead of calling refreshUser
          try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
              localStorage.setItem('user', JSON.stringify(response.data.data));
              setUser(response.data.data);
            }
          } catch (error) {
            console.error('Error refreshing user data on load:', error);
          }
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
        isInitializing = false;
      }
    };
    
    loadStoredUser();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.data));
        // Update user state
        setUser(response.data.data);
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Login failed' 
        };
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      let message = 'Network error. Please try again.';
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string }>;
        message = axiosError.response?.data?.message || 'Invalid credentials';
      }
      
      return { 
        success: false, 
        message 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage and user state regardless of API success
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    }
  };

  // Refresh user function - fetches latest user data from API
  const refreshUser = async (): Promise<boolean> => {
    if (!user) return false;
    
    // Add a timestamp-based cache mechanism to prevent excessive calls
    const lastRefresh = localStorage.getItem('lastUserRefresh');
    const now = Date.now();
    
    // Only refresh if it's been more than 5 seconds since the last refresh
    if (lastRefresh && now - parseInt(lastRefresh) < 5000) {
      return true; // Return success without actually refreshing
    }
    
    try {
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        // Update localStorage and state with fresh user data
        localStorage.setItem('user', JSON.stringify(response.data.data));
        localStorage.setItem('lastUserRefresh', now.toString());
        setUser(response.data.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout,
        refreshUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext; 