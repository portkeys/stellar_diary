import { useState } from 'react';
import { Link, useLocation } from 'wouter';

const Navbar = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const isActive = (path: string) => location === path;
  
  return (
    <nav className="sticky top-0 bg-space-blue-dark bg-opacity-90 backdrop-blur-sm z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <i className="fas fa-telescope text-stellar-gold text-2xl mr-2"></i>
              <span className="text-space font-bold text-xl">StellarDiary</span>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-6">
              <Link href="/">
                <a className={`px-3 py-5 text-sm font-medium border-b-2 ${isActive('/') ? 'border-nebula-pink' : 'border-transparent hover:border-stellar-gold'}`}>
                  Home
                </a>
              </Link>
              <Link href="/monthly-guide">
                <a className={`px-3 py-5 text-sm font-medium border-b-2 ${isActive('/monthly-guide') ? 'border-nebula-pink' : 'border-transparent hover:border-stellar-gold'}`}>
                  Monthly Guide
                </a>
              </Link>
              <Link href="/my-observations">
                <a className={`px-3 py-5 text-sm font-medium border-b-2 ${isActive('/my-observations') ? 'border-nebula-pink' : 'border-transparent hover:border-stellar-gold'}`}>
                  My Observations
                </a>
              </Link>
              <Link href="/learn">
                <a className={`px-3 py-5 text-sm font-medium border-b-2 ${isActive('/learn') ? 'border-nebula-pink' : 'border-transparent hover:border-stellar-gold'}`}>
                  Learn
                </a>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button className="bg-cosmic-purple hover:bg-cosmic-purple-light text-white px-4 py-2 rounded-md text-sm font-medium">
              <i className="fas fa-user mr-1"></i> Sign In
            </button>
            <div className="ml-3 md:hidden">
              <button 
                type="button" 
                className="text-gray-300 hover:text-white"
                onClick={toggleMobileMenu}
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? '' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'bg-cosmic-purple-light' : 'hover:bg-cosmic-purple-light'}`}>
              Home
            </a>
          </Link>
          <Link href="/monthly-guide">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/monthly-guide') ? 'bg-cosmic-purple-light' : 'hover:bg-cosmic-purple-light'}`}>
              Monthly Guide
            </a>
          </Link>
          <Link href="/my-observations">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/my-observations') ? 'bg-cosmic-purple-light' : 'hover:bg-cosmic-purple-light'}`}>
              My Observations
            </a>
          </Link>
          <Link href="/learn">
            <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/learn') ? 'bg-cosmic-purple-light' : 'hover:bg-cosmic-purple-light'}`}>
              Learn
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
