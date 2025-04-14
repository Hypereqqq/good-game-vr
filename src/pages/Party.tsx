import React from "react";
import { Link } from "react-router-dom";

const imprezy = [
  {
    title: "Imprezy dla dzieci",
    image: "https://placehold.co/600x400?text=Dzieci",
    path: "/imprezy-dla-dzieci",
  },
  {
    title: "Imprezy dla młodzieży",
    image: "https://placehold.co/600x400?text=Mlodziez",
    path: "/imprezy-dla-mlodziezy",
  },
  {
    title: "Imprezy dla dorosłych",
    image: "https://placehold.co/600x400?text=Dorosli",
    path: "/imprezy-dla-doroslych",
  },
  {
    title: "Imprezy firmowe",
    image: "https://placehold.co/600x400?text=Firmy",
    path: "/imprezy-dla-firm",
  },
];

const Party: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white min-h-screen py-16 px-6">
      <h1 className="text-4xl font-bold text-center text-[#00d9ff] uppercase mb-6">
        Imprezy 
      </h1>

      <p className="text-center max-w-3xl mx-auto text-gray-300 mb-12 text-lg">
        Organizujemy niezapomniane wydarzenia dla każdej grupy wiekowej – od dzieci po dorosłych.
        Wybierz odpowiednią kategorię i sprawdź, co przygotowaliśmy!
      </p>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {imprezy.map((imp) => (
          <Link to={imp.path} key={imp.path}>
            <div className="bg-[#1e2636] rounded-lg overflow-hidden shadow-lg hover:scale-[1.03] transition duration-300 cursor-pointer">
              <img src={imp.image} alt={imp.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h2 className="text-xl font-bold text-[#00d9ff]">{imp.title}</h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Party;
