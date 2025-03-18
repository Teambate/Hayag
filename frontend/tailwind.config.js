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
  			// Chart colors (if you need them)
  			chart: {
  				'1': '#FF6B6B',
  				'2': '#4ECDC4',
  				'3': '#45B7D1',
  				'4': '#96CEB4',
  				'5': '#FFEEAD',
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