/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Main colors
  			primary: '#0C4226',
  			secondary: '#EA9010',
  			'dark-green': '#0C4226',
  			
  			// Background and text colors
  			background: '#FFFFFF',
  			foreground: '#111111',
  
  			// UI element colors
  			muted: {
  				DEFAULT: '#F5F5F5',
  				foreground: '#737373',
  			},
  			accent: {
  				DEFAULT: '#F5F5F5',
  				foreground: '#111111',
  			},
  			card: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#111111',
  			},
  			popover: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#111111',
  			},
  			border: '#E5E5E5',
  			input: '#E5E5E5',
  			ring: '#111111',
  			destructive: {
  				DEFAULT: '#FF0000',
  				foreground: '#FFFFFF',
  			},
  			// Chart colors for our dashboard
  			chart: {
  				'1': '#FFB547', // Amber/Orange for battery/temperature
  				'2': '#4CAF50', // Green for energy/panel
  				'3': '#FF5252', // Red for warnings
  				'4': '#81C784', // Light green for afternoon irradiance
  				'5': '#FFE082', // Light amber for morning irradiance
  			}
  		},
  		borderRadius: {
  			lg: '0.5rem',
  			md: '0.375rem',
  			sm: '0.25rem'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} 