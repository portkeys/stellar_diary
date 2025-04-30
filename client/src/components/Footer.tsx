import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="relative z-10 bg-space-blue-dark bg-opacity-95 backdrop-blur-sm border-t border-stellar-blue/30 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1">
            <h3 className="text-lg font-medium text-stellar-gold mb-3">
              StellarView
            </h3>
            <p className="text-sm text-gray-300">
              Your personal astronomy companion for exploring the night sky with your Dobsonian telescope.
            </p>
          </div>

          {/* Navigation */}
          <div className="col-span-1">
            <h3 className="text-sm font-medium text-stellar-gold uppercase mb-3">
              Explore
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-sm text-gray-300 hover:text-stellar-gold">
                    Home
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/monthly-guide">
                  <a className="text-sm text-gray-300 hover:text-stellar-gold">
                    Monthly Guide
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/my-observations">
                  <a className="text-sm text-gray-300 hover:text-stellar-gold">
                    My Observations
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/learn">
                  <a className="text-sm text-gray-300 hover:text-stellar-gold">
                    Learning Resources
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-sm font-medium text-stellar-gold uppercase mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://apod.nasa.gov/apod/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-stellar-gold"
                >
                  NASA APOD
                </a>
              </li>
              <li>
                <a 
                  href="https://stellarium-web.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-stellar-gold"
                >
                  Stellarium Web
                </a>
              </li>
              <li>
                <a 
                  href="https://skyandtelescope.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-stellar-gold"
                >
                  Sky & Telescope
                </a>
              </li>
              <li>
                <a 
                  href="https://astronomy.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-300 hover:text-stellar-gold"
                >
                  Astronomy Magazine
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="col-span-1">
            <h3 className="text-sm font-medium text-stellar-gold uppercase mb-3">
              Get NASA API Key
            </h3>
            <p className="text-sm text-gray-300 mb-3">
              For better performance, get your free NASA API key
            </p>
            <a 
              href="https://api.nasa.gov/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-nebula-pink/90 hover:bg-nebula-pink text-white text-sm font-medium rounded-md"
            >
              Register for API Key
              <i className="fas fa-external-link-alt ml-2"></i>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stellar-blue/30 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} StellarView. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 mt-2 md:mt-0">
            Powered by <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer" className="text-nebula-pink">NASA APIs</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;