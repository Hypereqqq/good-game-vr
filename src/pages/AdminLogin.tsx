// This file contains the AdminLogin component for the administration panel
// It handles user authentication and redirects to the admin panel when logged in
import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { isAdminLoggedInAtom, setAdminLoggedInAtom } from "../store/auth";
import { useNavigate } from "react-router-dom";

// AdminLogin functional component
// Responsible for rendering the login form and handling authentication
const AdminLogin: React.FC = () => {

  // State for form inputs and UI control
  const [username, setUsername] = useState(""); // Username input state
  const [password, setPassword] = useState(""); // Password input state
  const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility
  
  // Authentication state from Jotai atoms
  const [isLoggedIn] = useAtom(isAdminLoggedInAtom); // Current login status
  const [, setIsLoggedIn] = useAtom(setAdminLoggedInAtom); // Function to update login status
  
  const navigate = useNavigate(); // React Router navigation hook

  // Automatyczne przekierowanie, jeśli już jesteś zalogowany
  // Effect to automatically redirect to admin panel if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/admin");
    }
  }, [isLoggedIn, navigate]);

  // Login handler function
  // Validates form inputs and performs the login action
  const handleLogin = () => {
    if (username && password) {
      setIsLoggedIn(true);
      navigate("/admin");
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
        <div className="flex flex-col gap-4">
          {/* Username input field */}
          <input
            type="text"
            placeholder="Nazwa użytkownika"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 rounded bg-[#0f1525] border border-gray-600 text-white"
          />
          {/* Password input container with show/hide button */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          </div>
          {/* Login button with color transition effect */}
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
