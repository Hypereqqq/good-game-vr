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
  }
  


  // TO DO
  // mozliwosc rozdzielenia grupy na wybrany rozmiar ze np grupe 4 osobowa podzielic na 2 grupy po 2 osoby!!!!!!!
  // mozliwosc zmiany liczby graczy w przypadku grup - ze np w trakcie kogos usunac i dodac do kolejki zeby zaplacil za tyle ile gral
  // opcja dodania komentarza WAZNE
  // mozna dodac staystyki
  // sortowanie tabeli po czasie do konca
  // mozliwosc kolorowania?
  // bugi naprawione