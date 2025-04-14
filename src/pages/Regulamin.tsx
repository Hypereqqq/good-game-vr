import React from "react";

const Regulamin: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white py-16 px-6 min-h-screen">
      <div className="max-w-5xl mx-auto bg-[#1e2636] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-[#00d9ff] uppercase mb-6">
          Regulamin przebywania oraz korzystania z usług
        </h1>

        <p className="text-sm text-gray-300 mb-6">
          Niniejszy regulamin określa zasady przebywania oraz korzystania z usług na terenie Hali Gier VR
          (dalej: „Obiekt”), zlokalizowanej przy ul. <span className="text-[#ffcc00] font-semibold">Nad Wierzbakiem 18/3, 60-611 Poznań</span>,
          zarządzanej przez GOOD GAME VR Sp. z o.o.
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">§1 Zasady ogólne</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 mb-6">
          <li>Obowiązek zapoznania się z regulaminem i poleceniami obsługi.</li>
          <li>Wymagana płatność i szkolenie przed rozpoczęciem gry.</li>
          <li>Obowiązek bezpiecznego zachowania, czystości i odpowiedniego obuwia.</li>
          <li>Zakaz spożywania alkoholu, palenia, agresji, biegania, czołgania się itp.</li>
          <li>Obsługa ma prawo odmówić gry bez zwrotu środków w razie naruszeń.</li>
        </ul>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">§2 Odpowiedzialność</h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 mb-6">
          <li>Gracz odpowiada za sprzęt i ewentualne szkody wynikłe z nieprzestrzegania zasad.</li>
          <li>Obowiązek zgłaszania usterek i urazów.</li>
          <li>Gra może powodować kontuzje – uczestnictwo dobrowolne.</li>
          <li>Nie zostawiać wartościowych rzeczy w szatni.</li>
        </ul>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">§3 Boksy i Arena VR</h2>
        <p className="text-sm text-gray-300 mb-6">
          Szczegółowe zasady korzystania z boksów i areny VR: liczba graczy, ograniczenia czasowe, zasady użytkowania
          i opłaty naliczane za rozpoczęte jednostki czasu.
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">§4 Rezerwacje i płatności</h2>
        <p className="text-sm text-gray-300 mb-6">
          Rezerwacje możliwe online, telefonicznie i przez Facebook. Płatność przed rozpoczęciem gry.
          Brak obecności lub spóźnienie bez wcześniejszego odwołania = brak zwrotu środków.
          W razie awarii możliwy voucher na inny termin.
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">
          §5 Klauzula informacyjna – przetwarzanie danych osobowych
        </h2>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-2 mb-6">
          <li>Administratorem danych jest GOOD GAME VR Sp. z o.o. z siedzibą w Poznaniu.</li>
          <li>Dane przetwarzane są w celach realizacji usług, kontaktu i obowiązków prawnych.</li>
          <li>Masz prawo do wglądu, poprawy, usunięcia i wniesienia skargi.</li>
          <li>Dane nie są przekazywane do państw trzecich ani profilowane.</li>
        </ul>

        <p className="text-xs text-gray-400 text-center mt-10">
          Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}
        </p>
      </div>
      <div>
    </div>
    </div>
  );
};

export default Regulamin;
