// Admin panel for managing reservations, clients, and updates in a VR gaming center.
// It includes real-time updates, statistics, and a detailed log of changes.

// Import necessary libraries and components
import React, { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { CalendarClock, Users, LayoutDashboard } from "lucide-react";
import { DateTime } from "luxon";
import { useAtom, useSetAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { isAdminLoggedInAtom } from "../store/auth";
import { reservationsAtom, setupReservationsPollingAtom } from "../store/store";
import { clientsAtom } from "../store/clients";

const AdminPanel: React.FC = () => {
  // State and atoms for managing admin panel functionality
  const [isLoggedIn] = useAtom(isAdminLoggedInAtom); // Atom for checking if admin is logged in
  const [reservations] = useAtom(reservationsAtom); // Atom for managing reservations data
  const navigate = useNavigate(); // React Router navigation hook

  // Setup for current time display and clients data
  const now = DateTime.now().setZone("Europe/Warsaw"); // Current time in Warsaw timezone
  const [currentTime, setCurrentTime] = useState(now.toFormat("HH:mm:ss")); // State for current time display
  const [clients] = useAtom(clientsAtom); // Atom for managing clients data
  const occupiedStations = new Set(clients.flatMap((c) => c.stations)); // Set of occupied stations based on clients data
  const setupReservationsPolling = useSetAtom(setupReservationsPollingAtom); // Function to setup polling for reservations

  // Effect to setup polling for reservations every 30 seconds
  useEffect(() => {
    // Setup polling for reservations every 30 seconds
    const stopReservationsPolling = setupReservationsPolling(30000);
    console.log("Uruchomiono polling rezerwacji w ADMIN PANEL");

    return () => {
      stopReservationsPolling();
      console.log("Zatrzymano polling rezerwacji w ADMIN PANEL");
    };
  }, [setupReservationsPolling]);

  // Effect to update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        DateTime.now().setZone("Europe/Warsaw").toFormat("HH:mm:ss")
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Effect to redirect to login page if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // Calculate the next upcoming reservation
  const upcomingReservation = reservations
    .filter((r) => DateTime.fromISO(r.reservationDate) > now)
    .sort(
      (a, b) =>
        DateTime.fromISO(a.reservationDate).toMillis() -
        DateTime.fromISO(b.reservationDate).toMillis()
    )[0];

  return (
    <section className="bg-[#0f1525] text-white px-6 py-16 min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <h1 className="text-3xl font-bold text-[#00d9ff] text-center uppercase">
          Panel Administratora
        </h1>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Closest reserbation */}
          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6">
            <p className="text-lg font-semibold text-gray-400 mb-2">
              Najbliższa rezerwacja
            </p>
            {upcomingReservation ? (
              <div className="text-sm text-gray-300 space-y-1">
                <p>
                  <span className="text-[#00d9ff] font-semibold">Data:</span>{" "}
                  {DateTime.fromISO(
                    upcomingReservation.reservationDate
                  ).toFormat("dd.MM.yyyy HH:mm")}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">
                    Imię i nazwisko:
                  </span>{" "}
                  {upcomingReservation.firstName} {upcomingReservation.lastName}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Email:</span>{" "}
                  {upcomingReservation.email}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Telefon:</span>{" "}
                  {upcomingReservation.phone}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Usługa:</span>{" "}
                  {upcomingReservation.service}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Osoby:</span>{" "}
                  {upcomingReservation.people}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Czas:</span>{" "}
                  {upcomingReservation.duration} min
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Brak nadchodzących rezerwacji
              </p>
            )}
          </div>

          {/* Hour */}
          <div className="bg-[#1e2636] rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-lg">
            <CalendarClock className="mx-auto mb-2 w-8 h-8 text-[#00d9ff]" />
            <p className="text-lg font-semibold text-gray-400">Godzina</p>
            <p className="text-4xl font-bold text-[#00d9ff]">{currentTime}</p>
          </div>

          {/* Number of active players */}
          <div className="bg-[#1e2636] rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-lg">
            <Users className="mx-auto mb-2 w-8 h-8 text-[#ffcc00]" />
            <p className="text-lg font-semibold text-gray-400">
              Aktualnie grających
            </p>
            <p className="text-5xl font-bold text-[#ffcc00] mt-1">
              {occupiedStations.size}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate("/admin/rezerwacje")}
            className="flex items-center justify-center gap-3 bg-[#00d9ff] hover:bg-[#ffcc00] text-black font-bold py-4 rounded-xl transition duration-300 uppercase"
          >
            <LayoutDashboard className="w-5 h-5" />
            Rezerwacje
          </button>
          <button
            onClick={() => navigate("/admin/vouchery")}
            className="flex items-center justify-center gap-3 bg-[#00d9ff] hover:bg-[#ffcc00] text-black font-bold py-4 rounded-xl transition duration-300 uppercase"
          >
            <LayoutDashboard className="w-5 h-5" />
            Vouchery
          </button>
          <button
            onClick={() => navigate("/admin/zarzadzanie")}
            className="flex items-center justify-center gap-3 bg-[#00d9ff] hover:bg-[#ffcc00] text-black font-bold py-4 rounded-xl transition duration-300 uppercase"
          >
            <LayoutDashboard className="w-5 h-5" />
            Zarządzanie
          </button>
        </div>

        {/* What's new? */}
        <div className="mt-10 flex flex-col gap-6">
          {/* Icons */}
          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex items-center gap-4">
            <FlaskConical className="w-12 h-12 text-[#00d9ff]" />
            <div>
              <h2 className="text-2xl font-bold text-[#00d9ff]">Co nowego?</h2>
              <p className="text-gray-400 mt-1">
                Sprawdź najnowsze zmiany i aktualizacje w systemie!
              </p>
            </div>
          </div>

          {/* Log */}

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Drobne poprawki
              <span className="text-purple-400 font-bold"> (V.1.2.5)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">25 sierpnia 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano licznik czasu do przypomnienia
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              System pauzowania i przypomnień
              <span className="text-purple-400 font-bold"> (V.1.2.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">24 sierpnia 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano opcję pauzowania gry klienta i grupy. Po wciśnięciu przycisku pauzy czas zostaje zatrzymany,
                pojawią się licznik czasu pauzy. Pozostały czas pozostaje taki sam jaki był przed wciśnięciem pauzy.
                Po wciśnięciu przycisku wznów czas gry jest kontynuowany od momentu w którym została zatrzymana.
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano opcję ustawienia przypomnień dla klienta i grupy. Po wciśnięciu przycisku pojawia się opcja wybrania ilości przypomnień,
                momentu od którego są liczone, oraz ich częstotliwości. Można wpisać również dodatkowy tekst.
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Usunięto możliwość wpisania nazwy klienta / grupy.
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Dodano oznaczenie kafelka podczas {" "}
                <span className="text-orange-500 font-bold">pauzy</span>{" "}
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano oznaczenie kafelka podczas {" "}
                <span className="text-red-400 font-bold">końca czasu gry</span>{" "}
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano oznaczenie kafelka gdy jest aktywny{" "}
                <span className="text-green-400 font-bold">komentarz</span>{" "}
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano oznaczenie kafelka gdy jest aktywne{" "}
                <span className="text-pink-400 font-bold">powiadomienie</span>{" "}
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano oznaczenie kafelka na który ma być{" "}
                <span className="text-[#00d9ff] font-bold">przeciągnięty</span>{" "} klient
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano oznaczenie kafelka z którym ma być{" "}
                <span className="text-amber-500 font-bold">zamieniony</span>{" "} klient
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              System przeciągania stanowisk i małe poprawki
              <span className="text-purple-400 font-bold"> (V.1.1.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">23 sierpnia 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano opcje przesuwania klientów za pomocą myszki. Działa
                również zamiana klientów miejscami. W celu użycia tej funkcji
                należy przytrzymać lewy przycisk myszy na kliencie przez pół
                sekundy i przeciągnąć go w wybrane miejsce. Jeśli klient nie zostanie przeciągnięty
                w ciągu 2 sekund, operacja zostanie anulowana.
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano obsługe strony bez systemu backend. System rezerwacji
                oraz logowania przyjmuje dane symulacyjne, gdy flaga backendu
                jest wyłączona.
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Poprawiono sposób wyświetlania informacji na temat ilości osób
                na symulatorze 5D na bardziej czytelny.
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Małe poprawki i aktualizacje
              <span className="text-purple-400 font-bold"> (V.1.0.5)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">14 czerwca 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Poprawiono błąd z dodawaniem rezerwacji, które miały zaczynać
                się w godzinach końca pracy, wcześniej system pozwalał na
                dodanie rezerwacji trwającą godzinę na 20:30, pomimo że
                zamknięcie było o 21:00
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano obsługe klawisza ENTER podczas logowania
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Naprawiono błąd, gdy po ponownym wyszukiwaniu rezerwacji
                przycisk WRÓĆ tracił swoją funkjonalność
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Poprawiono format sortowania wyświetlanych wyników dla
                wyszukiwania rezerwacji
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Panel admina - aktualizacja
              <span className="text-purple-400 font-bold"> (V.1.0.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">07 czerwca 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano serwis API i połączono z bazą danych (dodawanie,
                usuwanie, edytowanie rezerwacji, zmiana liczby dostępnych
                miejsc)
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Dodano automatyczne odświeżanie informacji
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Naprawiono błędy w systemie rezerwacji (np. godziny nie
                wyłączały się poprawnie, jeśli były zajęte)
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Zaktualizowano system rezerwacji dla administratora i klientów
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano opcję wyszukiwania rezerwacji
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Na stronie rezerwacji dodano moduł kalendarza z wszystkimi
                rezerwacjami
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano modal edycji rezerwacji
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano notyfikacje informujące o dodaniu, edycji lub usunięciu
                rezerwacji
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Zmieniono sposób podświetlania edytowanej grupy klientów w
                menedżerze zadań
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Poprawiono sposób liczenia czasu – jest teraz dokładniejszy
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              System rezerwacji - aktualizacja
              <span className="text-purple-400 font-bold"> (V.0.9.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">21 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano panel rezerwacji z listą wszystkich rezerwacji oraz
                szczegółami każdej rezerwacji
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Możliwość filtrowania rezerwacji po imieniu, nazwisku oraz
                rodzaju usługi
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano wybór zakresu dat – z możliwością wyboru daty od-do oraz
                podglądem rezerwacji na wybrany dzień lub tydzień
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano wykres liczby rezerwacji w wybranym zakresie dat
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Możliwość przełączania widoku: rezerwacje na dziś / rezerwacje
                na najbliższy tydzień
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano przełącznik (suwak) „Pokaż tylko przyszłe” – domyślnie
                aktywny, filtruje rezerwacje na dziś
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano szczegółowe informacje o rezerwacji w formie popupu
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano przycisk edycji rezerwacji
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano przycisk „Dodaj rezerwację”
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano modal potwierdzający usunięcie rezerwacji
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Licznik anulowanych rezerwacji aktualizuje się automatycznie po
                usunięciu rezerwacji
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Dodano kolorowy pasek po lewej stronie kafelka rezerwacji
                zależny od typu usługi (niebieski dla VR, czerwony dla
                symulatora)
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Poprawiono wyświetlanie godzin
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Zaimplementowano pełny dark mode dla kalendarza wyboru daty
                (react-datepicker) wraz z polskimi nazwami dni i miesięcy
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Małe poprawki
              <span className="text-purple-400 font-bold"> (V.0.8.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">20 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                W kolecje do płatności zmieniono czas całej rezerwacji na
                faktycznie przegrany czas
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Podczas usuwania klientów z grupy dodano infomracje o ilości
                osób w grupie
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Usuwanie osób z grupy + dodatkowe funkcjonalności
              <span className="text-purple-400 font-bold"> (V.0.7.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">19 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano możliwość usuwania osób z grupy wraz z możlwością wyboru
                sposobu usunięcia
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Dodano kolejke osób do zapłaty, które grały w danej grupie wraz
                z edycją i usuwaniem
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Dodano automatyczne obliczanie kwoty do zapłaty (lub wpisanie
                własnej)
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Dodano automatyczny komentarz dla grupy, w której usunnięto
                osobę
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Naprawiono błąd, gdy po odświeżeniu strony nie było widać
                kolejki do zapłaty
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Naprawiono błąd ze zdwojoną opcją
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Dzielenie grup{" "}
              <span className="text-purple-400 font-bold"> (V.0.6.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">18 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano podział grup na mniejsze grupy
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Dodano zabezpieczenie, aby wykrywać zdwojone stanowiska podczas
                dzielenia grup, wraz z odpowiednim komunikatem
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano możliwość wyboru ilości grup, na które ma być podzielona
                grupa
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano opcje wyboru stanowisk w każdej grupie
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano możliwość wyboru ilości osób w każdej grupie
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Poprawki i zmiany{" "}
              <span className="text-purple-400 font-bold"> (V.0.5.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">18 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano nowe przyciski do dodawania ceny
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano zabezpieczenie, aby wykrywać zdwojone stanowiska podczas
                dodawania klientów, wraz z odpowiednim komunikatem
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano automatyczne zawijanie tekstu w polu dodatkowych
                informacji w voucherze
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano automatyczną zamianę wielkości liter w kodzie vouchera
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Został naprawiony błąd, gdy admin był zalgowany i po odświeżeniu
                strony następowało wylogowanie
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Został naprawiony błąd, gdy po odświeżeniu strony nie było widać
                aktualnych klientów
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Zmieniono wygląd checkboxów
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Zmieniono wygląd przycisków odpowiedzialnych za zmianę liczby
                osób
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Zmieniono sposób wyświatlania się komunikatu o braku unikalnych
                stanowisk oraz dodano zaznaczenie, gdzie występuje błąd
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Zmieniono sposób podświetlania kafelków, które są edytowane
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Naprawiono błąd, gdy podczas edycji klienta został on usunięty -
                panel zostawał w trybie edycji
                <span className="text-[#16da9f] font-bold"> [UI]</span>
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Nowy generator voucherów
              <span className="text-purple-400 font-bold"> (V.0.4.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">17 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano nowy, przejrzysty generator voucherów z podziałem na
                sekcje
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Umożliwiono wpisanie imienia i nazwiska osoby, dla której
                wystawiany jest voucher
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano wybór czasu gry oraz liczby graczy z listy lub możliwość
                wpisania własnego tekstu
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Dodano pole na kod vouchera oraz dodatkowe informacje z
                automatycznymi podpowiedziami (np. ilość osób i przejazdów)
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Wprowadzono eksport vouchera do pliku PDF lub PNG z automatyczną
                nazwą pliku zawierającą kod vouchera, jeśli został podany
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Dodano podgląd na żywo – wygląd vouchera aktualizuje się
                natychmiast podczas edycji
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Małe poprawki i zmiany
              <span className="text-purple-400 font-bold"> (V.0.3.5)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">17 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                System liczenia pozostałego czasu został naprawiony, teraz czas
                wyświetla się poprawnie
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
              <li>
                Naprawiono błąd występujący przy edycji klienta jeśli miał już
                wcześniej ustawioną niestandardową godzinę (wtedy wówczas znów
                ustawiała się aktualna godzina zamiast pozostawienia wcześniej
                ustawionej){" "}
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>

              <li>
                Zwiększono rozmiar czcionki w podglądzie komentarza{" "}
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Naprawiono błąd w nawigacji (podkreślenie) podczas zmiany
                podstrony{" "}
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Komentarze i sortowanie
              <span className="text-purple-400 font-bold"> (V.0.3.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">16 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano sortowanie tabeli klientów według różnych kryteriów
                <span className="text-[#dd9c10] font-bold"> [UX]</span>
              </li>
              <li>
                Nowy popup potwierdzający usuwanie klienta{" "}
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Ulepszony wygląd kafelków{" "}
                <span className="text-[#16da9f] font-bold"> [UI]</span>
              </li>
              <li>
                Dodano obsługe komentarzy, ich edycję oraz pop-up po najechaniu{" "}
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>

              <li>
                Poprawienie liczenia czasu (problem z{" "}
                <span className="text-red-400 font-bold">Koniec gry</span>){" "}
                <span className="text-[#2fc5eb] font-bold"> [SYSTEM]</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Ulepszenia niestandardowej kwoty i godziny
              <span className="text-purple-400 font-bold"> (V.0.2.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">26 kwietnia 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Dodano automatyczne uzupełnianie niestandardowej kwoty</li>
              <li>
                Automatyczne wpisywanie aktualnej godziny do pola
                niestandardowej godziny
              </li>
              <li>Dodano przyciski do szybkiej zmiany godziny</li>
              <li>Zapętlanie godziny (przechodzenie przez 24h)</li>
              <li>
                Naprawiono błąd umożliwiający dodanie większej liczby osób niż
                stanowisk
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Nowe opcje i edycja
              <span className="text-purple-400 font-bold"> (V.0.1.5)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">1 kwietnia 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Dodano opcję edycji klientów</li>
              <li>Dodano opcje grupowania stanowisk</li>
              <li>Dodano opcję niestandardowej godziny i kwoty</li>
              <li>Automatyczne wpisywanie kolejnych stanowisk do systemu</li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Naprawa wyboru stanowisk
              <span className="text-purple-400 font-bold"> (V.0.1.0)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">27 marca 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Naprawiono błąd umożliwiający wielokrotny wybór tego samego
                stanowiska
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Start systemu klientów
              <span className="text-purple-400 font-bold"> (V.0.0.5)</span>
            </h3>
            <p className="text-xs text-gray-400 mb-2">17 marca 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Dodawanie klientów</li>
              <li>
                Wprowadzanie nazwy, wybór stanowiska, czas gry, status opłacenia
              </li>
              <li>Wizualizacja klientów na kafelkach</li>
              <li>Podstawowa tabela klientów</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;
