import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  animate: boolean;
}

const StarryBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  const createStars = (width: number, height: number): Star[] => {
    // Create between 150-300 stars depending on screen size
    const starCount = Math.min(Math.floor((width * height) / 3000), 300);
    const minStars = Math.min(150, starCount);
    const stars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      // Make about 20% of stars animated (twinkling)
      const animate = Math.random() > 0.8;
      
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5, // Size between 0.5 and 2.5
        opacity: Math.random() * 0.5 + 0.3, // Opacity between 0.3 and 0.8
        animate,
      });
    }
    
    return stars;
  };
  
  const drawStars = (
    ctx: CanvasRenderingContext2D,
    stars: Star[],
    width: number,
    height: number,
    time: number
  ) => {
    ctx.clearRect(0, 0, width, height);
    
    // Create a subtle gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0a0f1e"); // Deep space blue at top
    gradient.addColorStop(1, "#131d3b"); // Slightly lighter space blue at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw each star
    stars.forEach((star) => {
      ctx.beginPath();
      
      // For animated stars, vary their opacity over time
      let opacity = star.opacity;
      if (star.animate) {
        // Create a sine wave oscillation for opacity
        opacity = star.opacity * (0.5 + Math.sin(time / 1000 + star.x) * 0.5);
      }
      
      // Draw the star
      const starGradient = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.size
      );
      starGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      starGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      
      ctx.fillStyle = starGradient;
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Add a subtle nebula-like effect in a few spots
    drawNebula(ctx, width * 0.7, height * 0.3, 200, "rgba(138, 43, 226, 0.05)"); // Purple
    drawNebula(ctx, width * 0.2, height * 0.6, 250, "rgba(64, 224, 208, 0.03)"); // Teal
    drawNebula(ctx, width * 0.5, height * 0.8, 180, "rgba(255, 105, 180, 0.04)"); // Pink
  };
  
  const drawNebula = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
  ) => {
    const gradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, size
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size to window size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      starsRef.current = createStars(canvas.width, canvas.height);
    };
    
    // Initial setup
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);
    
    // Animation loop
    const animate = (time: number) => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        setCanvasSize();
      }
      
      drawStars(ctx, starsRef.current, canvas.width, canvas.height, time);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none"
    />
  );
};

export default StarryBackground;