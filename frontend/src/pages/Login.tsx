import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  const [error, setError] = useState('');
  const backgroundRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('User authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

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
        
        rayElement.style.transform = `rotate(${angle}deg) translateX(${distance * (relX * 0.8 + 0.6)}px) translateY(${distance * (relY * 0.8 + 0.6)}px)`;
        rayElement.style.opacity = (0.4 + relX * 0.6).toString();
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Add keyframes to document on component mount
    const styleEl = document.createElement('style');
    styleEl.innerHTML = solarPulseCss;
    document.head.appendChild(styleEl);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.head.removeChild(styleEl);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
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
          background: "linear-gradient(135deg, #0C4226 0%, #125C36 100%)"
        }}
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.12'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
          <div className="mb-8 flex justify-center">
            <img src="/src/assets/HayagLogo.png" alt="Hayag Logo" className="relative h-24 w-24 object-contain drop-shadow-lg" />
            <p className="text-white/80">Log In to your account</p>
          </div>
          
          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-500/20 p-3 text-sm text-white">
                {error}
              </div>
            )}
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

          {process.env.NODE_ENV !== 'production' && (
            <Button
              type="button"
              className="mt-4 w-full bg-gray-500 p-3 text-white"
              onClick={() => navigate('/dashboard')}
            >
              Skip Login (Dev Only)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 