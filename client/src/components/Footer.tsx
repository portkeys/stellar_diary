import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-space-blue-dark mt-16 border-t border-cosmic-purple-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <i className="fas fa-telescope text-stellar-gold text-2xl mr-2"></i>
              <span className="text-space font-bold text-xl">StellarView</span>
            </div>
            <p className="text-star-dim text-sm mb-4">
              Your personal guide to exploring the cosmos with your telescope. Track celestial events, build your observation list, and learn about our fascinating universe.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-star-dim hover:text-stellar-gold">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-star-dim hover:text-stellar-gold">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-star-dim hover:text-stellar-gold">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-space font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="text-star-dim hover:text-star-white">Astronomy Picture of the Day</a>
                </Link>
              </li>
              <li>
                <Link href="/monthly-guide">
                  <a className="text-star-dim hover:text-star-white">Monthly Sky Guide</a>
                </Link>
              </li>
              <li>
                <Link href="/my-observations">
                  <a className="text-star-dim hover:text-star-white">Observation Planning</a>
                </Link>
              </li>
              <li>
                <Link href="/learn">
                  <a className="text-star-dim hover:text-star-white">Telescope Tips</a>
                </Link>
              </li>
              <li>
                <Link href="/learn">
                  <a className="text-star-dim hover:text-star-white">Learning Resources</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-space font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-star-dim hover:text-star-white">Beginner's Guide</a></li>
              <li><a href="#" className="text-star-dim hover:text-star-white">Dobsonian Telescopes</a></li>
              <li><a href="#" className="text-star-dim hover:text-star-white">Astronomy Glossary</a></li>
              <li><a href="#" className="text-star-dim hover:text-star-white">Light Pollution Map</a></li>
              <li><a href="#" className="text-star-dim hover:text-star-white">Community Forums</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-space font-semibold mb-4">Newsletter</h3>
            <p className="text-star-dim text-sm mb-4">
              Subscribe to get monthly updates on celestial events and telescope tips.
            </p>
            <form>
              <div className="flex mb-2">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-1 bg-space-blue border border-cosmic-purple rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nebula-pink"
                />
                <button 
                  type="submit" 
                  className="bg-nebula-pink hover:bg-opacity-90 px-3 py-2 rounded-r-md"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              <label className="flex items-center text-xs text-star-dim">
                <input type="checkbox" className="mr-2 h-3 w-3" />
                I agree to receive occasional emails from StellarView
              </label>
            </form>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-cosmic-purple-light text-center text-sm text-star-dim">
          <p>© {new Date().getFullYear()} StellarView. All rights reserved. NASA APOD images © NASA.</p>
          <div className="mt-2 space-x-4">
            <a href="#" className="hover:text-star-white">Privacy Policy</a>
            <a href="#" className="hover:text-star-white">Terms of Service</a>
            <a href="#" className="hover:text-star-white">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
