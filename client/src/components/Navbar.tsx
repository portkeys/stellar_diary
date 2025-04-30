import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Navigation items
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Monthly Guide", path: "/monthly-guide" },
    { name: "My Observations", path: "/my-observations" },
    { name: "Learn", path: "/learn" },
  ];

  return (
    <nav className="relative z-10 bg-space-blue-dark bg-opacity-95 backdrop-blur-sm border-b border-stellar-blue/30 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center cursor-pointer">
                <div className="text-2xl text-white">
                  <i className="fas fa-telescope text-stellar-gold"></i>
                </div>
                <span className="ml-2 text-xl font-semibold text-white tracking-wide">
                  Stellar<span className="text-stellar-gold">View</span>
                </span>
              </a>
            </Link>
          </div>

          {/* Desktop navigation */}
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.path
                        ? "text-stellar-gold bg-space-blue/40"
                        : "text-gray-300 hover:text-stellar-gold hover:bg-space-blue/20"
                    }`}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
              <Link href="/monthly-guide">
                <Button
                  size="sm"
                  className="ml-4 bg-nebula-pink hover:bg-nebula-pink/90"
                >
                  <i className="fas fa-star mr-1"></i> What's Up Tonight
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <div className="flex items-center md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-space-blue focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <i className="fas fa-bars text-xl"></i>
                ) : (
                  <i className="fas fa-times text-xl"></i>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobile && isMenuOpen && (
        <div className="md:hidden">
          <div className="flex flex-col px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-stellar-blue/30 bg-space-blue-dark/95 backdrop-blur-sm">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === item.path
                      ? "text-stellar-gold bg-space-blue"
                      : "text-gray-300 hover:text-stellar-gold hover:bg-space-blue/30"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              </Link>
            ))}
            <Link href="/monthly-guide">
              <Button
                className="w-full mt-2 bg-nebula-pink hover:bg-nebula-pink/90"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fas fa-star mr-1"></i> What's Up Tonight
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;