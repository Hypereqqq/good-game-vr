import React, { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";

import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { isAdminLoggedInAtom } from "../store/auth";
import { reservationsAtom } from "../store/store";
import { clientsAtom } from "../store/clients";
import { DateTime } from "luxon";
import { CalendarClock, Users, LayoutDashboard } from "lucide-react";
const AdminPanel: React.FC = () => {
  const [isLoggedIn] = useAtom(isAdminLoggedInAtom);
  const [reservations] = useAtom(reservationsAtom);
  const navigate = useNavigate();

  const now = DateTime.now().setZone("Europe/Warsaw");
  const [currentTime, setCurrentTime] = useState(now.toFormat("HH:mm:ss"));
  const [clients] = useAtom(clientsAtom);
  const occupiedStations = new Set(clients.flatMap((c) => c.stations));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(
        DateTime.now().setZone("Europe/Warsaw").toFormat("HH:mm:ss")
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    console.log("Aktualne rezerwacje:", reservations);
  }, [reservations]);

  // Najbliższa rezerwacja
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

        {/* Kafelki statystyk */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Najbliższa rezerwacja */}
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

          {/* Aktualna godzina */}
          <div className="bg-[#1e2636] rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-lg">
            <CalendarClock className="mx-auto mb-2 w-8 h-8 text-[#00d9ff]" />
            <p className="text-lg font-semibold text-gray-400">Godzina</p>
            <p className="text-4xl font-bold text-[#00d9ff]">{currentTime}</p>
          </div>

          {/* Liczba grających */}
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

        {/* Kafelki nawigacji */}
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

        {/* Sekcja "Co nowego" */}
        <div className="mt-10 flex flex-col gap-6">
          {/* Kafelek z ikonką */}
          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex items-center gap-4">
            <FlaskConical className="w-12 h-12 text-[#00d9ff]" />
            <div>
              <h2 className="text-2xl font-bold text-[#00d9ff]">Co nowego?</h2>
              <p className="text-gray-400 mt-1">
                Sprawdź najnowsze zmiany i aktualizacje w systemie!
              </p>
            </div>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Wielki update boiii
            </h3>
            <p className="text-xs text-gray-400 mb-2">16 maja 2025</p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>
                Dodano sortowanie tabeli klientów według różnych kryteriów
              </li>
              <li>Nowy popup potwierdzający usuwanie klienta</li>
              <li>Ulepszony wygląd kafelków</li>
              <li>Dodano obsługe komentarzy, ich edycję oraz pop-up po najechaniu</li>
              <li>Poprawki wizualne i UX</li>
              <li>
                Poprawienie liczenia czasu (problem z{" "}
                <span className="text-red-400 font-bold">Koniec gry</span>)
              </li>
            </ul>
          </div>

          <div className="bg-[#1e2636] rounded-xl shadow-lg p-6 flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white">
              Ulepszenia niestandardowej kwoty i godziny
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
