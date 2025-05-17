import React, { useState } from "react";
import { useAtom } from "jotai";
import { isAdminLoggedInAtom, setAdminLoggedInAtom } from "../store/auth";
import { useNavigate } from "react-router-dom";
import { Link, NavLink } from "react-router-dom";
import Logo from "../assets/MATERIAŁY/LOGA/GGVR - NIEBIESKO BIAŁE.png";

const Navbar: React.FC = () => {
  const [isLoggedIn] = useAtom(isAdminLoggedInAtom);
  const [, setIsLoggedIn] = useAtom(setAdminLoggedInAtom);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const baseLink =
    "px-4 py-2 rounded transition duration-200 text-[15px] tracking-wide font-bold";
  const hoverLink =
    "hover:text-[#ffcc00] hover:underline underline-offset-8 decoration-[#ffcc00] decoration-2";

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${baseLink} ${
      isActive
        ? "text-[#ffffff] underline underline-offset-8 decoration-[#00d9ff] decoration-2"
        : "text-gray-300 " + hoverLink
    }`;

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <nav className="bg-[#1e2636] sticky top-0 z-50 shadow-md border-b-2 border-[#ffffff]">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* LEWA CZĘŚĆ: LOGO */}
        <Link to="/" key="/" className="flex-shrink-0">
          <div className="flex items-center gap-7">
            <img src={Logo} alt="Logo" className="h-12 w-auto" />
          </div>
        </Link>

        {/* Hamburger (mobile only) */}
        <div className="lg:hidden flex items-center gap-5">
          {!isLoggedIn && (
            <NavLink
              to="/rezerwacja"
              className="px-4 py-2 w-fit text-[#000000] font-bold uppercase text-[15px] tracking-wide bg-[#00d9ff] hover:bg-[#ffcc00] hover:text-[#000000] hover:scale-105 rounded transition duration-200"
            >
              Rezerwacja
            </NavLink>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white text-2xl focus:outline-none"
          >
            ☰
          </button>
        </div>

        {/* DESKTOP NAV */}
        {isLoggedIn ? (
          <div className="hidden lg:flex items-center justify-between w-full">
            {/* ŚRODEK - Wyśrodkowane linki admina */}
            <div className="flex-1 flex justify-center">
              <ul className="flex gap-5 text-sm uppercase">
                <li>
                  <NavLink to="/admin" end className={getLinkClass}>
                    Strona główna
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/rezerwacje" className={getLinkClass}>
                    Rezerwacje
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/vouchery" className={getLinkClass}>
                    Vouchery
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/zarzadzanie" className={getLinkClass}>
                    Zarządzanie
                  </NavLink>
                </li>
              </ul>
            </div>

            {/* PRAWA - przycisk wyloguj */}
            <div className="ml-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-[#000000] font-bold uppercase text-[15px] tracking-wide bg-[#00d9ff] hover:bg-[#ffcc00] hover:text-[#000000] hover:scale-105 rounded transition duration-200"
              >
                Wyloguj
              </button>
            </div>
          </div>
        ) : (
          <>
            <ul className="hidden lg:flex gap-5 items-center text-sm uppercase">
              <li>
                <NavLink to="/" end className={getLinkClass}>
                  O nas
                </NavLink>
              </li>
              <li>
                <NavLink to="/gry-vr" className={getLinkClass}>
                  Gry VR
                </NavLink>
              </li>
              <li
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <NavLink to="/imprezy" className={getLinkClass}>
                  Imprezy
                </NavLink>
                {dropdownOpen && (
                  <ul className="absolute top-full left-0 mt-1 w-48 bg-[#1d212a] shadow-xl rounded z-50 flex flex-col">
                    {[
                      { to: "/imprezy-dla-dzieci", label: "Dla dzieci" },
                      {
                        to: "/imprezy-dla-mlodziezy",
                        label: "Dla młodzieży",
                      },
                      {
                        to: "/imprezy-dla-doroslych",
                        label: "Dla dorosłych",
                      },
                      { to: "/imprezy-dla-firm", label: "Dla firm" },
                    ].map(({ to, label }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          className={({ isActive }) =>
                            `${baseLink} ${
                              isActive
                                ? "bg-[#171f2e] text-[#00d9ff]"
                                : "text-gray-300 " + hoverLink
                            } block w-full`
                          }
                        >
                          {label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              <li>
                <NavLink to="/cennik" className={getLinkClass}>
                  Cennik
                </NavLink>
              </li>
              <li>
                <NavLink to="/promocje" className={getLinkClass}>
                  Promocje
                </NavLink>
              </li>
              <li>
                <NavLink to="/galeria" className={getLinkClass}>
                  Galeria
                </NavLink>
              </li>
              <li>
                <NavLink to="/aktualnosci" className={getLinkClass}>
                  Aktualności
                </NavLink>
              </li>
              <li>
                <NavLink to="/kontakt" className={getLinkClass}>
                  Kontakt
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/rezerwacja"
                  className="px-4 py-2 ml-4 text-[#000000] font-bold uppercase text-[15px] tracking-wide bg-[#00d9ff] hover:bg-[#ffcc00] hover:text-[#000000] hover:scale-105 rounded transition duration-200"
                >
                  Rezerwacja
                </NavLink>
              </li>
            </ul>
          </>
        )}
      </div>

      {/* MOBILE NAV */}
      {menuOpen && (
        <div className="fixed top-16 left-0 w-full bg-[#1e2636] px-6 pb-4 z-40 shadow-lg lg:hidden">
          <ul className="flex flex-col gap-3 text-sm uppercase mt-4">
            {isLoggedIn ? (
              <>
                <li className="text-xs text-gray-400">— PANEL ADMINA —</li>
                <li>
                  <NavLink
                    to="/admin"
                    end
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Strona główna
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/rezerwacje"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Rezerwacje
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/vouchery"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Vouchery
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/admin/zarzadzanie"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Zarządzanie
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="text-left w-full px-4 py-2 text-red-400 hover:text-red-500 font-bold"
                  >
                    Wyloguj
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink
                    to="/"
                    end
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    O nas
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/gry-vr"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Gry VR
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/imprezy"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Imprezy
                  </NavLink>
                </li>
                <li className="ml-3 text-xs text-gray-400">— PODKATEGORIE —</li>
                <li>
                  <NavLink
                    to="/imprezy-dla-dzieci"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dla dzieci
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/imprezy-dla-mlodziezy"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dla młodzieży
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/imprezy-dla-doroslych"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dla dorosłych
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/imprezy-dla-firm"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Dla firm
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/cennik"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Cennik
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/promocje"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Promocje
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/galeria"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Galeria
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/aktualnosci"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Aktualności
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/kontakt"
                    className={getLinkClass}
                    onClick={() => setMenuOpen(false)}
                  >
                    Kontakt
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
