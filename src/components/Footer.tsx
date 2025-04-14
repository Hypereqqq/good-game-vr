import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1e2636] text-gray-300 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Lewa strona */}
        <div className="text-center md:text-left">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Good Game VR. Wszelkie prawa zastrzeżone.
          </p>
        </div>

        {/* Środkowa część – Linki */}
        <div className="flex gap-6 text-sm font-medium uppercase">
          <Link to="/regulamin" className="hover:text-[#00d9ff] transition">
            Regulamin
          </Link>
          <Link to="/polityka-prywatnosci" className="hover:text-[#00d9ff] transition">
            Polityka prywatności
          </Link>
        </div>

        {/* Prawa strona – Social Media */}
        <div className="flex gap-4 text-xl">
          <a
            href="https://www.facebook.com/GoodGameVR/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00d9ff] transition"
          >
            <FaFacebook />
          </a>
          <a
            href="https://www.instagram.com/goodgame.vr/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00d9ff] transition"
          >
            <FaInstagram />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
