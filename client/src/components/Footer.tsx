const Footer = () => {
  return (
    <footer className="bg-space-blue-dark mt-16 border-t border-cosmic-purple-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center text-sm text-star-dim">
          <p>&copy; {new Date().getFullYear()} StellarDiary</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
