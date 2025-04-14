import React from "react";
import { Link } from "react-router-dom";

const PartyMid: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto bg-[#1e2636] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-[#00d9ff] uppercase mb-6 text-center">
          Imprezy dla młodzieży
        </h1>

        <p className="text-gray-300 mb-6 text-lg">
          Chcesz zorganizować wyjątkową imprezę urodzinową, spotkanie klasowe albo wieczór z ekipą? 🎮
          U nas znajdziesz <span className="text-[#ffcc00] font-bold">pełne emocji gry VR</span>, tryby rywalizacji i
          zabawy zespołowe idealne dla młodzieży!
        </p>

        <p className="text-gray-300 mb-6 text-lg">
          Oferujemy <span className="text-[#00d9ff] font-semibold">pakiety turniejowe</span> w takich grach jak Beat Saber,
          Elven Assassin, Pavlov i wiele więcej. Możesz połączyć strefę VR z przejazdami w
          <span className="text-[#00d9ff] font-semibold"> symulatorze VR</span> i stworzyć imprezę pełną adrenaliny.
        </p>

        <p className="text-gray-300 mb-8 text-lg">
          Zapewniamy miejsce do odpoczynku, profesjonalną obsługę oraz opiekę nad uczestnikami przez cały czas trwania imprezy.
        </p>

        <div className="bg-[#0f1525] border-l-4 border-[#00d9ff] pl-4 py-3 mb-6">
          <p className="text-md font-semibold text-white">
            Napisz do nas i ustal szczegóły – dopasujemy wydarzenie do Twoich potrzeb!
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            to="/kontakt"
            className="bg-[#00d9ff] hover:bg-[#ffcc00] hover:text-black text-black font-bold py-3 px-6 rounded transition duration-300 uppercase"
          >
            Skontaktuj się z nami
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PartyMid;
