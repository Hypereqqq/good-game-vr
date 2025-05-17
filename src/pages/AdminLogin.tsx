import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { isAdminLoggedInAtom, setAdminLoggedInAtom } from "../store/auth";
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn] = useAtom(isAdminLoggedInAtom);
  const [, setIsLoggedIn] = useAtom(setAdminLoggedInAtom);
  const navigate = useNavigate();

  // Automatyczne przekierowanie, jeśli już jesteś zalogowany
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/admin");
    }
  }, [isLoggedIn, navigate]);

  const handleLogin = () => {
    // Tu można dodać walidację albo integrację z backendem
    if (username && password) {
      setIsLoggedIn(true);
      navigate("/admin");
    }
  };

  return (
    <section className="bg-[#0f1525] text-white px-6 py-16 min-h-screen flex items-center justify-center">
      <div className="bg-[#1e2636] p-8 rounded-lg shadow-lg w-full max-w-md ">
        <h1 className="text-2xl font-bold text-[#00d9ff] mb-6 text-center uppercase">
          Panel administracyjny
        </h1>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nazwa użytkownika"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 rounded bg-[#0f1525] border border-gray-600 text-white"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 rounded bg-[#0f1525] border border-gray-600 text-white w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-[#00d9ff]"
            >
              {showPassword ? "Ukryj" : "Pokaż"}
            </button>
          </div>
          <button
            onClick={handleLogin}
            className="bg-[#00d9ff] hover:bg-[#ffcc00] text-black font-bold py-2 px-4 rounded transition duration-300"
          >
            Zaloguj
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;
