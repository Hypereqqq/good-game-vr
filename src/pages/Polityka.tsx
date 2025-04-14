import React from "react";

const Polityka: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white py-16 px-6 min-h-screen">
      <div className="max-w-4xl mx-auto bg-[#1e2636] p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-[#00d9ff] mb-6 text-center uppercase">
          Polityka prywatności
        </h1>

        <p className="text-gray-300 mb-6 text-sm">
          Niniejsza polityka prywatności określa zasady przetwarzania i ochrony danych osobowych
          użytkowników korzystających ze strony internetowej Good Game VR.
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">1. Administrator danych</h2>
        <p className="text-gray-300 mb-4 text-sm">
          Administratorem danych jest Good Game VR z siedzibą w Centrum Handlowym Avenida w Poznaniu,
          ul. Matyi 2, 61-586 Poznań.
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">2. Zakres zbieranych danych</h2>
        <p className="text-gray-300 mb-4 text-sm">
          Gromadzimy dane kontaktowe (np. imię, adres e-mail, numer telefonu), przesyłane dobrowolnie przez formularze
          kontaktowe oraz informacje techniczne (adres IP, typ przeglądarki, czas odwiedzin).
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">3. Cel przetwarzania danych</h2>
        <p className="text-gray-300 mb-4 text-sm">
          Dane osobowe przetwarzane są w celu odpowiedzi na zapytania, realizacji usług, rezerwacji, obsługi klienta
          oraz w celach statystycznych i analitycznych.
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">4. Udostępnianie danych</h2>
        <p className="text-gray-300 mb-4 text-sm">
          Dane nie są sprzedawane osobom trzecim. Mogą być udostępniane partnerom technologicznym wyłącznie w celu
          świadczenia usług (np. hosting, system rezerwacji).
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">5. Prawa użytkownika</h2>
        <p className="text-gray-300 mb-4 text-sm">
          Każdy użytkownik ma prawo do wglądu w swoje dane, ich poprawiania, usunięcia oraz ograniczenia przetwarzania.
          W tym celu należy skontaktować się z nami przez formularz kontaktowy lub e-mail.
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">6. Pliki cookies</h2>
        <p className="text-gray-300 mb-4 text-sm">
          Strona wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania, analizy statystyk oraz
          personalizacji treści. Użytkownik może samodzielnie zarządzać cookies w ustawieniach przeglądarki.
        </p>

        <h2 className="text-xl font-bold text-[#00d9ff] mb-2">7. Zmiany w polityce</h2>
        <p className="text-gray-300 mb-4 text-sm">
          Zastrzegamy sobie prawo do wprowadzania zmian w polityce prywatności. Zmiany publikowane będą na tej stronie.
        </p>

        <p className="text-gray-400 text-xs text-center mt-8">
          Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL")}
        </p>
      </div>
    </div>
  );
};

export default Polityka;
