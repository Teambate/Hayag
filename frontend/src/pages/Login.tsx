import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

// Adding custom animation keyframes
const solarPulseCss = `
@keyframes solarPulse {
  0% { opacity: 0.2; transform: scale(0.9); }
  50% { opacity: 0.4; transform: scale(1.05); }
  100% { opacity: 0.2; transform: scale(0.9); }
}
`;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!backgroundRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate relative position (0 to 1)
      const relX = clientX / innerWidth;
      const relY = clientY / innerHeight;
      
      // Create a radial gradient that follows the cursor with enhanced glow
      const gradientX = clientX;
      const gradientY = clientY;
      
      // Apply the radial light effect with enhanced colors
      backgroundRef.current.style.background = `
        radial-gradient(
          800px circle at ${gradientX}px ${gradientY}px,
          rgba(234, 144, 16, 0.25),
          transparent 40%
        ),
        radial-gradient(
          400px circle at ${gradientX}px ${gradientY}px,
          rgba(234, 144, 16, 0.4),
          transparent 30%
        ),
        linear-gradient(135deg, #0C4226 0%, #125C36 100%)
      `;
      
      // Create subtle rays effect with more dynamic movement
      const rays = document.querySelectorAll('.sun-ray');
      rays.forEach((ray, index) => {
        const rayElement = ray as HTMLElement;
        const angle = index * (360 / rays.length);
        const distance = 5 + Math.sin(Date.now() / 1000 + index) * 3;
        
        rayElement.style.transform = `
          rotate(${angle + relX * 5}deg) 
          translateX(${distance * (relX * 0.8 + 0.6)}px)
          translateY(${distance * (relY * 0.8 + 0.6)}px)
        `;
        
        rayElement.style.opacity = (0.4 + relX * 0.6).toString();
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Add keyframes to document on component mount
  useEffect(() => {
    // Create style element for custom animations
    const styleEl = document.createElement('style');
    styleEl.innerHTML = solarPulseCss;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Implement actual login logic here
      console.log('Logging in with:', email, password);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard on successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden">
      {/* Dynamic background */}
      <div 
        ref={backgroundRef} 
        className="absolute inset-0 transition-all duration-300 ease-out"
        style={{
          background: "linear-gradient(135deg,a7dfb9 # 0%, #107048 100%)"
        }}
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.12'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Remove the sun effect in background as we'll focus it behind the logo */}
        
        {/* Sun rays */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i}
              className="sun-ray absolute left-0 top-0 h-40 w-1 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-secondary opacity-20 blur-sm transition-all duration-300"
              style={{
                transformOrigin: 'center',
                transform: `rotate(${i * 30}deg) translateX(120px)`,
                animation: `solarPulse ${4 + i % 3}s infinite ease-in-out ${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Login form container */}
      <div className="relative z-10 m-auto flex w-full max-w-md flex-col items-center rounded-xl backdrop-blur-xl">
        <div className="w-full rounded-xl bg-white/10 p-8 shadow-xl backdrop-blur-md">
          {/* Logo with enhanced pulsing glow */}
          <div className="mb-8 flex justify-center">
            <div className="relative isolate">
              <div className="absolute inset-0 -z-10 rounded-full bg-[#FFBC3B]/30 blur-xl" 
                style={{ animation: 'solarPulse 4s infinite ease-in-out' }}></div>
              <img 
                src="/src/assets/HayagLogo.png" 
                alt="Hayag Logo" 
                className="relative h-24 w-24 object-contain drop-shadow-lg"
              />
            </div>
          </div>
          
          {/* HAYAG SVG Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-2 flex justify-center">
              <svg width="180" viewBox="0 0 758 164" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                <path d="M125.2 1.99999V142H99.2V82H26.8V142H0.800001V1.99999H26.8V59.8H99.2V1.99999H125.2ZM223.714 -7.62939e-06C236.247 -7.62939e-06 247.181 2.46666 256.514 7.39999C265.847 12.3333 273.047 19.6667 278.114 29.4C283.314 39 285.914 50.6667 285.914 64.4V142H259.914V106H187.114V142H161.514V64.4C161.514 50.6667 164.047 39 169.114 29.4C174.314 19.6667 181.581 12.3333 190.914 7.39999C200.247 2.46666 211.181 -7.62939e-06 223.714 -7.62939e-06ZM259.914 84.2V62C259.914 49.0667 256.714 39.3333 250.314 32.8C243.914 26.1333 234.981 22.8 223.514 22.8C212.047 22.8 203.114 26.1333 196.714 32.8C190.314 39.3333 187.114 49.0667 187.114 62V84.2H259.914ZM439.178 1.99999V99.2C439.178 119.867 433.511 135.733 422.178 146.8C410.978 157.867 395.445 163.4 375.578 163.4C363.845 163.4 353.178 161.667 343.578 158.2C333.978 154.867 325.845 150.067 319.178 143.8L329.778 123.8C342.178 135 357.311 140.6 375.178 140.6C400.511 140.6 413.178 127.2 413.178 100.4V89.8C403.711 101.8 389.978 107.8 371.978 107.8C354.245 107.8 340.511 102.733 330.778 92.6C321.045 82.4667 316.178 67.9333 316.178 49V1.99999H342.178V47.8C342.178 60.0667 345.111 69.4 350.978 75.8C356.978 82.0667 365.311 85.2 375.978 85.2C387.311 85.2 396.311 81.8667 402.978 75.2C409.778 68.4 413.178 58.4 413.178 45.2V1.99999H439.178ZM536.605 -7.62939e-06C549.138 -7.62939e-06 560.071 2.46666 569.405 7.39999C578.738 12.3333 585.938 19.6667 591.005 29.4C596.205 39 598.805 50.6667 598.805 64.4V142H572.805V106H500.005V142H474.405V64.4C474.405 50.6667 476.938 39 482.005 29.4C487.205 19.6667 494.471 12.3333 503.805 7.39999C513.138 2.46666 524.071 -7.62939e-06 536.605 -7.62939e-06ZM572.805 84.2V62C572.805 49.0667 569.605 39.3333 563.205 32.8C556.805 26.1333 547.871 22.8 536.405 22.8C524.938 22.8 516.005 26.1333 509.605 32.8C503.205 39.3333 500.005 49.0667 500.005 62V84.2H572.805ZM730.775 70.4H755.375V142H733.975V133.8C723.975 140.6 711.442 144 696.375 144C683.442 144 671.575 141.2 660.775 135.6C649.975 130 641.308 121.867 634.775 111.2C628.375 100.533 625.175 87.8 625.175 73C625.175 59 628.442 46.4667 634.975 35.4C641.508 24.2 650.508 15.5333 661.975 9.39999C673.575 3.13333 686.575 -7.62939e-06 700.975 -7.62939e-06C712.708 -7.62939e-06 723.375 1.93332 732.975 5.79999C742.575 9.66666 750.642 15.3333 757.175 22.8L740.775 38.8C730.108 28.1333 717.242 22.8 702.175 22.8C692.308 22.8 683.508 24.9333 675.775 29.2C668.175 33.3333 662.175 39.2 657.775 46.8C653.508 54.4 651.375 63.0667 651.375 72.8C651.375 83.0667 653.508 91.9333 657.775 99.4C662.175 106.733 667.975 112.333 675.175 116.2C682.375 119.933 690.242 121.8 698.775 121.8C704.775 121.8 710.508 120.867 715.975 119C721.575 117.133 726.508 114.4 730.775 110.8V70.4Z" fill="url(#hayag-gradient)" />
                <defs>
                  <linearGradient id="hayag-gradient" x1="0" y1="0" x2="758" y2="164" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#EDEDED" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="text-white/80">Log In to your account</p>
          </div>
          
          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email
              </label>
              <input
                id="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border-0 bg-white/10 p-3 text-white placeholder-white/50 shadow-sm ring-1 ring-inset ring-white/20 transition-all duration-200 ease-in-out focus:bg-white/10 focus:ring-2 focus:ring-inset focus:ring-white"
                placeholder="your@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password
                </label>
                <a href="#" className="text-sm text-[#FFBC3B] hover:text-[#FFBC3B]/80 transition-colors duration-200">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border-0 bg-white/10 p-3 text-white placeholder-white/50 shadow-sm ring-1 ring-inset ring-white/20 transition-all duration-200 ease-in-out focus:bg-white/10 focus:ring-2 focus:ring-inset focus:ring-white pr-10"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-white/70 hover:text-white transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="relative w-full bg-[#FFBC3B] p-3 text-white transition-all duration-200 hover:bg-[#FFBC3B]/90"
              disabled={isLoading}
            >
              <span className="relative z-10">{isLoading ? 'Logging in...' : 'Log In'}</span>
              {/* Button hover effect */}
              <span className="absolute inset-0 -z-0 rounded bg-gradient-to-r from-yellow-400 to-[#FFBC3B] opacity-0 blur-sm transition-opacity duration-300 ease-in-out group-hover:opacity-70"></span>
            </Button>
          </form>
          
          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-white/80">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-[#FFBC3B] transition-colors duration-200 hover:text-[#FFBC3B]/80">
              Sign up
            </a>
          </p>

          <Button
            type="button"
            className="mt-4 w-full bg-gray-500 p-3 text-white"
            onClick={() => navigate('/dashboard')}
          >
            Skip Login (Dev Only)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login; 