import React, { useState, useEffect } from 'react';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth', 
    });
  };

  const handleScroll = () => {
    if (window.scrollY > 300) { 
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll); 
    return () => {
      window.removeEventListener('scroll', handleScroll); 
    };
  }, []);

  return (
    <div>
      {isVisible && (
        <button className="fixed bottom-5 right-5 bg-[#00d9ff] text-black border-none rounded-full w-[50px] h-[50px] text-[20px] font-bold cursor-pointer shadow-lg transition-all duration-300 ease-in-out hover:bg-[#ffcc00] hover:shadow-[0_0_15px_4px_rgba(0,0,0,0.2)] hover:text-black hover:scale-110 active:scale-90 opacity-100 hidden:opacity-0 hidden:pointer-events-none" onClick={scrollToTop}>
          ↑
        </button>
      )}
    </div>
  );
};

export default ScrollToTopButton;