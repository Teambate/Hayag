import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Banner from "./components/layout/Banner"
import { useState } from "react"
// Import your pages
import Dashboard from "./pages/Dashboard"
import Analytics from "./pages/Analytics"
import Sensors from "./pages/Sensors"
import Notes from "./pages/Notes"
import Settings from "./pages/Settings"
//import Login from "./pages/Login"

function App() {
  const [activeTab, setActiveTab] = useState("Dashboard")
  // In a real app, you would check for authentication status here
 // const [isAuthenticated, setIsAuthenticated] = useState(false) 

  return (
    <BrowserRouter>
      {/** {isAuthenticated ? ( */}
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
      {/** ) : (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      )} */}
    </BrowserRouter>
  )
}

export default App
