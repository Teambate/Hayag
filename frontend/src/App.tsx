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
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <>
      {isAuthenticated ? (
        <div className="min-h-screen bg-background">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main>
            <Routes>
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

// Add this debug component
const ApiDebugger = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const checkApi = async () => {
      try {
        // Test the API connection
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setApiStatus('ok');
          setDebugInfo(JSON.stringify(data, null, 2));
        } else {
          setApiStatus('error');
          setDebugInfo(`API returned ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        setApiStatus('error');
        setDebugInfo(`Error connecting to API: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    checkApi();
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '10px',
      backgroundColor: apiStatus === 'ok' ? 'rgba(0, 128, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)',
      color: 'white',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
    }}>
      <div>API Status: {apiStatus}</div>
      <pre style={{ maxHeight: '100px', overflow: 'auto' }}>{debugInfo}</pre>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      <ApiDebugger />
    </BrowserRouter>
  )
}

export default App
