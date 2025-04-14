import React from "react";

import voucher from "../assets/MATERIAŁY/VOUCHER/ŚRODEK.png"

const Price: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white py-16 px-6 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-[#00d9ff] uppercase mb-12">
        Cennik
      </h1>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 ">
        {/* BOX VR */}
        <div className="bg-[#1e2636] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300">
          <h2 className="text-2xl font-bold text-[#00d9ff] mb-4">Box VR</h2>
          <p className="mb-2">Ceny za 1 stanowisko (1 osoba):</p>

          <ul className="list-disc list-inside text-sm space-y-2">
            <li>
              <span className="text-white">Poniedziałek – Czwartek:</span>{" "}
              <span className="text-[#ffcc00] font-bold">39 zł / 30 min</span>
            </li>
            <li>
              <span className="text-white">Piątek – Niedziela:</span>{" "}
              <span className="text-[#ffcc00] font-bold">45 zł / 30 min</span>
            </li>
          </ul>
        </div>

        {/* SYMULATOR VR */}
        <div className="bg-[#1e2636] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300">
          <h2 className="text-2xl font-bold text-[#00d9ff] mb-4">Symulator VR</h2>
          <p className="mb-3 font-semibold">1 osoba:</p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Pierwszy przejazd – <span className="text-[#ffcc00] font-bold">20 zł</span></li>
            <li>Drugi przejazd – <span className="text-[#ffcc00] font-bold">10 zł</span></li>
            <li>Trzeci przejazd – <span className="text-green-400 font-bold">GRATIS</span></li>
          </ul>

          <p className="mt-6 mb-3 font-semibold">2 osoby:</p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Pierwszy przejazd – <span className="text-[#ffcc00] font-bold">30 zł</span></li>
            <li>Drugi przejazd – <span className="text-[#ffcc00] font-bold">20 zł</span></li>
            <li>Trzeci przejazd – <span className="text-green-400 font-bold">GRATIS</span></li>
          </ul>
        </div>
      </div>

      {/* VOUCHERY */}
<div className="bg-[#1e2636] p-6 rounded-lg shadow-lg mt-10 max-w-5xl mx-auto hover:scale-102 transition-transform duration-300">
  <h2 className="text-2xl font-bold text-[#00d9ff] mb-4">Voucher prezentowy</h2>

  <div className="flex flex-col lg:flex-col gap-6 items-center">
    {/* Obrazek vouchera */}
    <img
      src={voucher}
      alt="Voucher Good Game VR"
      className="lg:max-w-4xl md:max-w-2xl rounded-lg shadow-md object-cover"
    />

    {/* Tekst informacyjny */}
    <div className="text-sm">
      <p className="mb-4">
        🎁 Vouchery można zakupić <span className="text-[#00d9ff] font-semibold">online</span> lub{" "}
        <span className="text-[#00d9ff] font-semibold">bezpośrednio w salonie</span>.
        Przy zakupie na miejscu – otrzymasz elegancką kopertę 🎀
      </p>
      <p className="mb-4">
        📍 Voucher można rozdzielić między kilka osób, a jego realizacja może odbywać się w różnych terminach.
      </p>
      <p className="mb-4">
        ⏳ <span className="text-[#ffcc00] font-semibold">Ważność:</span>{" "}
        6 miesięcy od daty zakupu.
      </p>
      <p className="mt-4">
        💰 <span className="text-[#ffcc00] font-bold">Cena:</span>{" "}
        45 zł za <span className="font-bold text-white">30 minut</span> gry.
      </p>
    </div>
  </div>
</div>
    </div>
  );
};

export default Price;
