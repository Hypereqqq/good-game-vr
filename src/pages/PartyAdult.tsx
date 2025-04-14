import React from "react";
import { Link } from "react-router-dom";

const PartyAdult: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto bg-[#1e2636] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-[#00d9ff] uppercase mb-6 text-center">
          Imprezy dla dorosłych
        </h1>

        <p className="text-gray-300 mb-6 text-lg">
          Szukasz pomysłu na <span className="text-[#ffcc00] font-bold">niebanalny wieczór kawalerski</span>,
          <span className="text-[#ffcc00] font-bold"> panieński</span> albo po prostu oryginalne urodziny dla znajomych?
          W Good Game VR organizujemy wydarzenia dla dorosłych w klimacie rywalizacji, zabawy i nowych doświadczeń.
        </p>

        <p className="text-gray-300 mb-6 text-lg">
          Zaskocz swoich przyjaciół i zorganizuj im <span className="text-[#00d9ff] font-semibold">pełen emocji wieczór</span>
          w naszej strefie VR. Możesz też połączyć go z przejazdami w symulatorze, zarezerwować cały salon lub wybrać indywidualny pakiet.
        </p>

        <p className="text-gray-300 mb-8 text-lg">
          Idealne dla grup znajomych, urodzin 18+, integracji czy luźnego spotkania po pracy.
          Gwarantujemy wyjątkową atmosferę, sprzęt najwyższej jakości i wrażenia, o których się długo nie zapomina! 🎉
        </p>

        <div className="bg-[#0f1525] border-l-4 border-[#00d9ff] pl-4 py-3 mb-6">
          <p className="text-md font-semibold text-white">
            Skontaktuj się z nami – dopasujemy ofertę do Waszych oczekiwań!
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

export default PartyAdult;
