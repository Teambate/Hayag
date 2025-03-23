import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Banner from "./components/layout/Banner"
import { useState, useEffect } from "react"
// Import your pages
import Dashboard from "./pages/Dashboard"
import Analytics from "./pages/Analytics"
import Sensors from "./pages/Sensors"
import Notes from "./pages/Notes"
import Settings from "./pages/Settings"
//import Login from "./pages/Login"

// Helper component to handle location changes
function AppContent() {
  const [activeTab, setActiveTab] = useState("Dashboard")
  const location = useLocation()
  
  // Update activeTab based on current location
  useEffect(() => {
    const path = location.pathname
    if (path === "/" || path === "/dashboard") {
      setActiveTab("Dashboard")
    } else if (path === "/analytics") {
      setActiveTab("Analytics")
    } else if (path === "/sensors") {
      setActiveTab("Sensors")
    } else if (path === "/notes") {
      setActiveTab("Notes")
    } else if (path === "/settings") {
      setActiveTab("Settings")
    }
  }, [location])

  return (
    <div className="min-h-screen bg-background">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Banner activeTab={activeTab} />
      
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
