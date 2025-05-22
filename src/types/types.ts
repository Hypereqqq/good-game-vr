export interface Reservation {
    id: string; // Unikalne ID rezerwacji, np. UUID
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string; // ISO string daty dokonania rezerwacji
    reservationDate: string; // ISO string daty, na którą jest rezerwacja (np. "2025-04-16T09:00")
    service: "Stanowisko VR" | "Symulator VR - 1 osoba" | "Symulator VR - 2 osoby";
    people: number;
    duration: number; // w minutach: 30, 60, 90, 120
    whoCreated: string; // kto stworzył rezerwację (admin, klient)
    cancelled: boolean; // czy rezerwacja została anulowana
  }

  export interface ClientGame {
    id: string; // unikalne ID
    name: string; // nazwa grupy / osoby
    stations: number[]; // lista zajętych stanowisk (np. [1, 2])
    players: number; // liczba graczy
    duration: number; // czas gry w minutach
    startTime: string; // czas rozpoczęcia (ISO string)
    paid: boolean; // czy opłacone
    customPrice?: number
    customStart?: boolean;
    comment?: string;
    playedMinutes?: number;
  }
  


  // TO DO
  // dodanie stopera
  // dodanie powiadomien np po 15 minutach zeby zmienic gre
  // mozna dodac staystyki
  // komentarz dla kolejki, czas kiedy gral dla kolejki

  // szukaj rezerwacji
  // dodaj rezerwacje i edytuj rezerwacje
  // ilosc miejsc
  // powiadomienia dzwoneczki
  // popupy np usuniecie itp

