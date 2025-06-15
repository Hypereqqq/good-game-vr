// This file contains the AdminLogin component for the administration panel
// It handles user authentication and redirects to the admin panel when logged in
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { isAdminLoggedInAtom, loginAdminAtom } from "../store/auth";
import { useNavigate } from "react-router-dom";

// AdminLogin functional component
// Responsible for rendering the login form and handling authentication
const AdminLogin: React.FC = () => {
  // State for form inputs and UI control
  const [username, setUsername] = useState(""); // Username input state
  const [password, setPassword] = useState(""); // Password input state
  const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility
  const [isLoading, setIsLoading] = useState(false); // Loading state during authentication
  const [error, setError] = useState<string | null>(null); // Error message state
  
  // Authentication state from Jotai atoms
  const [isLoggedIn] = useAtom(isAdminLoggedInAtom); // Current login status
  const [, login] = useAtom(loginAdminAtom); // Function to login with API
  
  const navigate = useNavigate(); // React Router navigation hook

  // Automatyczne przekierowanie, jeśli już jesteś zalogowany
  // Effect to automatically redirect to admin panel if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/admin");
    }
  }, [isLoggedIn, navigate]);
  // Login handler function
  // Validates form inputs and performs the login action using API
  const handleLogin = async () => {
    // Form data validation
    if (!username || !password) {
      setError("Wprowadź nazwę użytkownika i hasło");
      return;
    }

    // Set loading state and clear previous errors
    setIsLoading(true);
    setError(null);

    try {
      // Call the login atom with credentials
      const result = await login({
        email_or_username: username,
        password: password
      });

      if (result.success) {
        // Redirect to admin panel on successful login
        navigate("/admin");
      } else {
        // Display error message from the server
        setError(result.message);
      }
    } catch (err) {
      // Handle unexpected errors
      console.error("Błąd logowania:", err);
      setError("Wystąpił nieoczekiwany błąd podczas logowania");
    } finally {
      // Reset loading state regardless of outcome
      setIsLoading(false);
    }
  };

  // Funkcja obsługująca naciśnięcie klawisza Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  // Component UI rendering
  return (
    // Main container with dark background
    <section className="bg-[#0f1525] text-white px-6 py-16 min-h-screen flex items-center justify-center">
      {/* Login form card with darker background */}
      <div className="bg-[#1e2636] p-8 rounded-lg shadow-lg w-full max-w-md ">
        {/* Page title */}
        <h1 className="text-2xl font-bold text-[#00d9ff] mb-6 text-center uppercase">
          Panel administracyjny
        </h1>

        {/* Form inputs container */}
        <div className="flex flex-col gap-4">          {/* Username input field */}
          <input
            type="text"
            placeholder="Nazwa użytkownika"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            className="p-3 rounded bg-[#0f1525] border border-gray-600 text-white"
          />
          {/* Password input container with show/hide button */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="p-3 rounded bg-[#0f1525] border border-gray-600 text-white w-full"
            />
            {/* Toggle button for password visibility */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-[#00d9ff]"
            >
              {showPassword ? "Ukryj" : "Pokaż"}
            </button>
          </div>          {/* Error message display */}
          {error && (
            <div className="bg-red-600 text-white p-3 rounded mb-4 text-sm font-bold">
              {error}
            </div>
          )}

          {/* Login button with loading state */}
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
                {/* Loading spinner */}
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
