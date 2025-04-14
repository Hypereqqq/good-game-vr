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