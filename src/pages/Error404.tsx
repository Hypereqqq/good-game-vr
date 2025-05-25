import React, { useRef, useState } from "react";

const getRandomPosition = () => {
  const padding = 80; // większy padding na mobile
  const width = window.innerWidth;
  const height = window.innerHeight;
  // Ustaw limity, żeby przycisk nie wychodził poza ekran
  const x = Math.random() * Math.max(0, width - padding);
  const y = Math.random() * Math.max(0, height - padding);
  return { x, y };
};

const Error404: React.FC = () => {
  const [caught, setCaught] = useState(false);
  const [pos, setPos] = useState(getRandomPosition());
  const [score, setScore] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  const moveButton = () => {
    setPos(getRandomPosition());
    setScore((s) => s + 1);
  };

  const handleCatch = () => {
    setCaught(true);
  };

  return (
    <div
      className="w-screen h-screen flex flex-col justify-center items-center bg-gradient-to-tl from-[#0f1525] via-[#00d9ff]  to-[#8b05c9] relative overflow-hidden"
      style={{ minHeight: "100vh" }}
    >
      {/* Glassmorphism container */}
      <div
        className="flex flex-col items-center justify-center mb-8"
        style={{
          background: "rgba(255,255,255,0.13)",
          boxShadow: "0 8px 60px 0 rgba(31, 38, 135, 0.37)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "32px",
          border: "1.5px solid rgba(255,255,255,0.18)",
          zIndex: 2,
          maxWidth: "95vw",
          width: "420px",
          padding: "2.5rem 2rem",
        }}
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-2 animate-bounce text-center">
          404
        </h1>
        <p className="text-2xl md:text-3xl text-white mb-4 font-mono text-center leading-snug">
          Ups! Strona nie istnieje.<br />
          Ale możesz się pobawić!
        </p>
      </div>
      {!caught ? (
        <>
          <button
            ref={btnRef}
            onMouseEnter={moveButton}
            onClick={handleCatch}
            style={{
              position: "absolute",
              left: `min(${pos.x}px, calc(100vw - 120px))`,
              top: `min(${pos.y}px, calc(100vh - 80px))`,
              transition: "left 0.2s, top 0.2s",
              zIndex: 10,
              minWidth: "120px",
              minHeight: "48px",
              fontSize: "1.1rem",
            }}
            className="px-4 py-2 md:px-6 md:py-3 rounded-full bg-blue-900 text-white text-lg font-bold shadow-lg hover:bg-blue-700 active:scale-95 cursor-pointer animate-pulse border-4 border-white"
          >
            Złap mnie!
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-base md:text-lg font-mono bg-black/40 px-4 py-2 rounded-xl shadow">
            Wynik: {score}
          </div>
          {/* Przycisk powrotu na stronę główną pod tekstem, glassmorphism */}
          <div className="w-full text-white flex justify-center mt-6">
            <a
              href="/"
              className="px-8 py-3 rounded-2xl font-bold text-lg text-[#ffffff] shadow-lg border border-white/40 backdrop-blur-md hover:bg-white/60 transition bg-white/30"
              style={{
                background: "rgba(255,255,255,0.25)",
                boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.18)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255,255,255,0.18)",
              }}
            >
              Strona główna
            </a>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="text-3xl font-bold text-green-400 drop-shadow">
            Brawo! Złapałeś przycisk 🎉
          </div>
          <div className="text-xl text-white">Możesz wrócić na stronę główną lub... zagrać jeszcze raz!</div>
          <button
            className="mt-2 px-6 py-2 rounded-full bg-[#00d9ff] text-black font-bold shadow hover:bg-[#00b8cc] transition"
            onClick={() => {
              setCaught(false);
              setScore(0);
              setPos(getRandomPosition());
            }}
          >
            Zagraj ponownie
          </button>
          {/* Przycisk powrotu na stronę główną pod tekstem, glassmorphism */}
          <a
            href="/"
            className="px-8 py-3 rounded-2xl font-bold text-lg text-[#0f1525] shadow-lg border border-white/40 backdrop-blur-md hover:bg-white/60 transition bg-white/30"
            style={{
              background: "rgba(255,255,255,0.25)",
              boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.18)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1.5px solid rgba(255,255,255,0.18)",
            }}
          >
            Strona główna
          </a>
        </div>
      )}
      {/* Dodatkowy przycisk powrotu na stronę główną pod gierką */}
      <style>{`
        @media (max-width: 600px) {
          h1 { font-size: 2.5rem !important; }
          p { font-size: 1.1rem !important; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s;
        }
      `}</style>
    </div>
  );
};

export default Error404;