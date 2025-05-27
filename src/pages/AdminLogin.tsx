import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { isAdminLoggedInAtom, loginAdminAtom } from "../store/auth";
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn] = useAtom(isAdminLoggedInAtom);
  const [, login] = useAtom(loginAdminAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Automatyczne przekierowanie, jeśli już jesteś zalogowany
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/admin");
    }
  }, [isLoggedIn, navigate]);
  const handleLogin = async () => {
    // Walidacja danych
    if (!username || !password) {
      setError("Wprowadź nazwę użytkownika i hasło");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Wywołanie atomu logowania
      const result = await login({
        email_or_username: username,
        password: password
      });

      if (result.success) {
        // Przekierowanie do panelu administracyjnego
        navigate("/admin");
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Błąd logowania:", err);
      setError("Wystąpił nieoczekiwany błąd podczas logowania");
    } finally {
      setIsLoading(false);
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
          </div>          {error && (
            <div className="bg-red-600 text-white p-3 rounded mb-4 text-sm font-bold">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`${
              isLoading 
                ? "bg-gray-400 cursor-wait" 
                : "bg-[#00d9ff] hover:bg-[#ffcc00]"
            } text-black font-bold py-2 px-4 rounded transition duration-300 flex justify-center items-center`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logowanie...
              </>
            ) : (
              "Zaloguj"
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;
