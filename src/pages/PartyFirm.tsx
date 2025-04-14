import React from "react";
import { Link } from "react-router-dom";

const PartyFirm: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto bg-[#1e2636] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-[#00d9ff] uppercase mb-6 text-center">
          Imprezy firmowe
        </h1>

        <p className="text-gray-300 mb-6 text-lg">
          Szukasz pomysłu na nietypową integrację, wieczór firmowy lub motywującą nagrodę dla zespołu? 🕹️
          Organizujemy <span className="text-[#ffcc00] font-bold">imprezy VR dla firm</span> w naszym salonie – z grami kooperacyjnymi, rywalizacją,
          symulatorem oraz możliwością rezerwacji całej przestrzeni.
        </p>

        <p className="text-gray-300 mb-6 text-lg">
          Oferujemy również opcję <span className="text-[#00d9ff] font-semibold">mobilnego salonu VR</span> – przyjeżdżamy
          do Twojego biura lub miejsca eventu z całym sprzętem i obsługą. Wirtualna rzeczywistość na wyciągnięcie ręki – bez wychodzenia z firmy!
        </p>

        <p className="text-gray-300 mb-8 text-lg">
          Wspólnie zaplanujemy przebieg wydarzenia, dobierzemy gry i dopasujemy czas oraz formułę do Twojej ekipy.
        </p>

        <div className="bg-[#0f1525] border-l-4 border-[#00d9ff] pl-4 py-3 mb-6">
          <p className="text-md font-semibold text-white">
            Skontaktuj się z nami i zaplanuj wyjątkową firmową przygodę w VR!
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

export default PartyFirm;
