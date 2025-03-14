import { Bell } from "lucide-react"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import HayagLogo from "../../assets/HayagLogo.png"
import GirlProfile from "../../assets/girl.png"

export default function Navbar() {
  // Get current date
  const currentDate = new Date()
  const day = currentDate.getDate()
  const month = currentDate.toLocaleString("default", { month: "long" })
  const year = currentDate.getFullYear()

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <div className="flex items-center">
        <img src={HayagLogo} alt="Hayag Logo" width={40} height={40} className="mr-2" />
        <span className="text-xl font-bold text-green-800">HAYAG</span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex space-x-8">
        <Button variant="ghost">Dashboard</Button>
        <Button
          variant="ghost"
          className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-amber-500"
        >
          Analytics
        </Button>
        <Button variant="ghost">Sensors</Button>
        <Button variant="ghost">Notes</Button>
        <Button variant="ghost">Settings</Button>
      </div>

      {/* Right Side - Date, Notifications, Profile */}
      <div className="flex items-center space-x-4">
        <div className="hidden md:block">
          <span className="text-2xl font-bold text-amber-400">{day}</span>
          <span className="ml-2 text-gray-600">
            {month} {year}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="text-gray-600">
          <Bell className="h-5 w-5" />
        </Button>
        <Avatar>
          <AvatarImage src={GirlProfile} alt="Profile" />
          <AvatarFallback>PF</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  )
}