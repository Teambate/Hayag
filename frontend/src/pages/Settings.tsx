import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { Button } from "../components/ui/button"
import { RefreshCw } from "lucide-react"

export default function Settings() {
  const { user, refreshUser, logout } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshUser()
    setIsRefreshing(false)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold">User Profile</h2>
          <p className="text-gray-500">Your account information</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-lg">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-lg">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="text-lg capitalize">{user?.role}</p>
          </div>
          <div className="pt-2 flex gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Profile'}
            </Button>
            <Button 
              onClick={logout} 
              variant="destructive"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}