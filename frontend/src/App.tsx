import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "./context/AuthContext"
// Import your pages
import Dashboard from "./pages/Dashboard"
import Analytics from "./pages/Analytics"
import Sensors from "./pages/Sensors"
import Notes from "./pages/Notes"
import Settings from "./pages/Settings"
import Login from "./pages/Login"

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    // You could return a loading spinner here
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App routes with AuthProvider
function AppRoutes() {
  const { isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [location, setLocation] = useState(window.location.pathname);

  // Refresh user data on page navigation or window focus
  useEffect(() => {
    let isRefreshing = false;
    
    const handleRefresh = async () => {
      if (!isAuthenticated || isRefreshing) return;
      
      // Check if we've refreshed recently (within 2 seconds)
      const lastRefresh = localStorage.getItem('lastUserRefresh');
      const now = Date.now();
      if (lastRefresh && now - parseInt(lastRefresh) < 2000) {
        return; // Skip refresh if it was done recently
      }
      
      isRefreshing = true;
      await refreshUser();
      isRefreshing = false;
    };

    // Small delay to avoid race condition with AuthContext initialization
    const timer = setTimeout(() => {
      handleRefresh();
    }, 500);
    
    // Refresh on window focus (for when user returns to tab)
    const handleFocus = () => {
      handleRefresh();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, refreshUser]);

  // Update location state when pathname changes
  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return (
    <>
      {isAuthenticated ? (
        <div className="min-h-screen bg-background">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics setActiveTab={setActiveTab} />} />
              <Route path="/sensors" element={<Sensors />} />
              <Route path="/notes" element={<Notes setActiveTab={setActiveTab} />} />
              <Route path="/settings" element={<Settings />} />
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" replace />} 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sensors" 
                element={
                  <ProtectedRoute>
                    <Sensors />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notes" 
                element={
                  <ProtectedRoute>
                    <Notes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
