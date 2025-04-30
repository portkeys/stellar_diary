import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  animate: boolean;
}

const StarryBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const starCount = Math.floor(window.innerWidth * window.innerHeight / 2000);
    
    const stars: Star[] = [];
    
    // Create stars
    for (let i = 0; i < starCount; i++) {
      const star: Star = {
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        animate: Math.random() > 0.7
      };
      
      stars.push(star);
    }
    
    // Render stars
    stars.forEach(star => {
      const element = document.createElement('div');
      element.classList.add('star');
      
      // Set styles
      element.style.width = `${star.size}px`;
      element.style.height = `${star.size}px`;
      element.style.left = `${star.x}%`;
      element.style.top = `${star.y}%`;
      element.style.opacity = `${star.opacity}`;
      
      // Add animation
      if (star.animate) {
        element.style.animation = Math.random() > 0.5 
          ? 'twinkle 4s ease-in-out infinite' 
          : 'twinkle 4s ease-in-out 2s infinite';
      }
      
      container.appendChild(element);
    });
    
    // Cleanup
    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);
  
  return (
    <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" id="stars-container" />
  );
};

export default StarryBackground;
