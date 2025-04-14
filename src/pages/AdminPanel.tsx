import React from "react";
import { useAtom } from "jotai";
import { isAdminLoggedInAtom } from "../store/auth";
import { useNavigate } from "react-router-dom";

const AdminPanel: React.FC = () => {
  const [isLoggedIn] = useAtom(isAdminLoggedInAtom);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  return (
    <section className="bg-[#0f1525] text-white px-6 py-16 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#00d9ff] mb-6 text-center uppercase">
          Panel admina
        </h1>
        <p className="text-center text-gray-400">Zawartość panelu będzie tutaj.</p>
      </div>
    </section>
  );
};

export default AdminPanel;