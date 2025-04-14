import React from "react";
import mc from "../assets/foodcourt/mc.svg";
import kfc from "../assets/foodcourt/kfc.svg";
import ph from "../assets/foodcourt/ph.svg";
import dominos from "../assets/foodcourt/dominos.svg";
import { Link } from "react-router-dom";

const PartyKids: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto bg-[#1e2636] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-[#00d9ff] uppercase mb-6 text-center">
          Imprezy dla dzieci
        </h1>

        <p className="text-gray-300 mb-6 text-lg">
          Organizujesz urodziny lub wyjątkowe wydarzenie dla najmłodszych? 🎉
          W naszym salonie znajdziesz <span className="text-[#ffcc00] font-bold">8 stanowisk VR</span> i <span className="text-[#ffcc00] font-bold">2 miejsca na symulatorze 5D</span>,
          które zapewnią dzieciom niezapomnianą zabawę! Filmy w symulatorze wybierane są spośród aż 17 dostępnych tytułów.
        </p>

        <p className="text-gray-300 mb-6 text-lg">
          Dysponujemy grami dostosowanymi do wieku dzieci. W przypadku większej liczby uczestników możliwa jest ich <span className="text-[#00d9ff] font-semibold">rotacja</span>.
        </p>

        <p className="text-gray-300 mb-6 text-lg">
          Na miejscu znajdują się <span className="text-[#00d9ff] font-semibold">kanapy i stoliki</span> – bez problemu można przynieść własne napoje, jedzenie czy tort.
        </p>

        <p className="text-gray-300 mb-6 text-lg">
          Możemy również zająć się cateringiem, korzystając z lokali na terenie Avenidy:
        </p>

        <div className="flex gap-6 items-center justify-center py-4 flex-col md:flex-row">
          <img src={mc} alt="McDonald's" className="h-10" />
          <img src={kfc} alt="KFC" className="h-10" />
          <img src={ph} alt="Pizza Hut" className="h-10" />
          <img src={dominos} alt="Domino's" className="h-10" />
        </div>

        <h2 className="text-2xl text-center font-bold text-[#00d9ff] mt-10 uppercase">
          Gotowe pakiety urodzinowe
        </h2>

        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm text-left border border-[#1e2636]">
            <thead className="bg-[#1e2636] text-[#00d9ff]">
              <tr>
                <th className="p-3 border-2 border-[#2c3e50]">Dzień</th>
                <th className="p-3 border-2 border-[#2c3e50]">Czas</th>
                <th className="p-3 border-2 border-[#2c3e50]">Cena za osobę (do 8 osób)</th>
                <th className="p-3 border-2 border-[#2c3e50]">Dodatkowa osoba</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#1e2636]">
                <td className="p-3 border-2 border-[#2c3e50]">Pon - Czw</td>
                <td className="p-3 border-2 border-[#2c3e50]">1h</td>
                <td className="p-3 border-2 border-[#2c3e50] font-bold">105 zł</td>
                <td className="p-3 border-2 border-[#2c3e50]">50 zł</td>
              </tr>
              <tr className="bg-[#1e2636]">
                <td className="p-3 border-2 border-[#2c3e50]">Pon - Czw</td>
                <td className="p-3 border-2 border-[#2c3e50]">2h lub więcej</td>
                <td className="p-3 border-2 border-[#2c3e50] font-bold">200 zł</td>
                <td className="p-3 border-2 border-[#2c3e50]">100 zł</td>
              </tr>
              <tr className="bg-[#1e2636]">
                <td className="p-3 border-2 border-[#2c3e50]">Pt - Niedz</td>
                <td className="p-3 border-2 border-[#2c3e50]">1h</td>
                <td className="p-3 border-2 border-[#2c3e50] font-bold">125 zł</td>
                <td className="p-3 border-2 border-[#2c3e50]">60 zł</td>
              </tr>
              <tr className="bg-[#1e2636]">
                <td className="p-3 border-2 border-[#2c3e50]">Pt - Niedz</td>
                <td className="p-3 border-2 border-[#2c3e50]">2h lub więcej</td>
                <td className="p-3 border-2 border-[#2c3e50] font-bold">220 zł</td>
                <td className="p-3 border-2 border-[#2c3e50]">110 zł</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-[#0f1525] border-l-4 border-[#00d9ff] pl-4 py-3 mt-8">
          <p className="text-md font-semibold text-white">
            W przypadku niestandardowych wydarzeń – zapraszamy do kontaktu!
          </p>
        </div>

        <div className="flex justify-center mt-6">
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

export default PartyKids;
