"use client";

import { useState, useEffect } from "react";

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize size on mount
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    ...windowSize,
    isMobile: windowSize.width < 1024,
  };
}
