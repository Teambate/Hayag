import { Bell } from "lucide-react"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import HayagLogo from "../../assets/HayagLogo.png"
import GirlProfile from "../../assets/girl.png"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navigate = useNavigate()
  const { refreshUser, user } = useAuth()

  // Get current date
  const currentDate = new Date()
  const day = currentDate.getDate()
  const month = currentDate.toLocaleString("default", { month: "long" })
  const year = currentDate.getFullYear()

  const navItems = ["Dashboard", "Analytics", "Sensors", "Notes", "Settings"]

  const handleTabChange = (item: string) => {
    setActiveTab(item)
    navigate(`/${item.toLowerCase()}`)
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b">
      <div className="flex items-center gap-8">
        <div className="flex items-center">
          <img src={HayagLogo} alt="Hayag Logo" width={40} height={40} className="mr-2" />
          <span className="text-xl font-bold text-green-800">HAYAG</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8 ml-5">
          {navItems.map((item) => (
            <Button
              key={item}
              variant="ghost"
              className={`relative hover:bg-transparent px-0 justify-start ${
                activeTab === item
                  ? "font-bold text-[#664300] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#FFBC3B]"
                  : "font-normal text-[#4F4F4F]"
              }`}
              onClick={() => handleTabChange(item)}
            >
              {item}
            </Button>
          ))}
        </div>
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
          <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      </div>
    </nav>
  )
}