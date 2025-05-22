import { atom } from "jotai";
import { Reservation } from "../types/types";

const localStorageKey = "reservations";

const mockReservations: Reservation[] = [
  {
    id: "1",
    firstName: "Jan",
    lastName: "Kowalski",
    email: "jan.kowalski@example.com",
    phone: "+48 123456789",
    createdAt: "2025-05-21T10:00:00.000+02:00",
    reservationDate: "2025-05-21T16:00:00.000+02:00",
    service: "Stanowisko VR",
    people: 2,
    duration: 30,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "2",
    firstName: "Anna",
    lastName: "Nowak",
    email: "anna.nowak@example.com",
    phone: "+48 234567890",
    createdAt: "2025-05-21T11:00:00.000+02:00",
    reservationDate: "2025-05-22T17:00:00.000+02:00",
    service: "Stanowisko VR",
    people: 1,
    duration: 60,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "3",
    firstName: "Piotr",
    lastName: "Wiśniewski",
    email: "piotr.wisniewski@example.com",
    phone: "+48 345678901",
    createdAt: "2025-05-21T12:00:00.000+02:00",
    reservationDate: "2025-05-23T15:30:00.000+02:00",
    service: "Symulator VR - 1 osoba",
    people: 1,
    duration: 15,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "4",
    firstName: "Katarzyna",
    lastName: "Zielińska",
    email: "k.zielinska@example.com",
    phone: "+48 456789012",
    createdAt: "2025-05-21T13:00:00.000+02:00",
    reservationDate: "2025-05-23T18:00:00.000+02:00",
    service: "Stanowisko VR",
    people: 3,
    duration: 90,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "5",
    firstName: "Marek",
    lastName: "Lewandowski",
    email: "marek.lewandowski@example.com",
    phone: "+48 567890123",
    createdAt: "2025-05-21T14:00:00.000+02:00",
    reservationDate: "2025-05-24T14:00:00.000+02:00",
    service: "Symulator VR - 2 osoby",
    people: 2,
    duration: 15,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "6",
    firstName: "Ewa",
    lastName: "Kaczmarek",
    email: "ewa.kaczmarek@example.com",
    phone: "+48 678901234",
    createdAt: "2025-05-21T15:00:00.000+02:00",
    reservationDate: "2025-05-24T19:00:00.000+02:00",
    service: "Stanowisko VR",
    people: 4,
    duration: 60,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "7",
    firstName: "Tomasz",
    lastName: "Mazur",
    email: "t.mazur@example.com",
    phone: "+48 789012345",
    createdAt: "2025-05-21T16:00:00.000+02:00",
    reservationDate: "2025-05-25T13:00:00.000+02:00",
    service: "Stanowisko VR",
    people: 2,
    duration: 30,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "8",
    firstName: "Agnieszka",
    lastName: "Dąbrowska",
    email: "agnieszka.dabrowska@example.com",
    phone: "+48 890123456",
    createdAt: "2025-05-21T17:00:00.000+02:00",
    reservationDate: "2025-05-25T20:00:00.000+02:00",
    service: "Symulator VR - 1 osoba",
    people: 1,
    duration: 15,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "9",
    firstName: "Paweł",
    lastName: "Wójcik",
    email: "pawel.wojcik@example.com",
    phone: "+48 901234567",
    createdAt: "2025-05-21T18:00:00.000+02:00",
    reservationDate: "2025-05-26T12:00:00.000+02:00",
    service: "Stanowisko VR",
    people: 5,
    duration: 120,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
  {
    id: "10",
    firstName: "Magdalena",
    lastName: "Król",
    email: "magdalena.krol@example.com",
    phone: "+48 012345678",
    createdAt: "2025-05-21T19:00:00.000+02:00",
    reservationDate: "2025-05-26T21:00:00.000+02:00",
    service: "Symulator VR - 2 osoby",
    people: 2,
    duration: 15,
    whoCreated: "Good Game VR",
    cancelled: false,
  },
];

const loadInitialReservations = (): Reservation[] => {
  const stored = localStorage.getItem(localStorageKey);
  const storedArr: Reservation[] = stored ? JSON.parse(stored) : [];
  // Połącz mockowe i z localStorage, unikając duplikatów po id
  const all = [...mockReservations, ...storedArr];
  const unique = all.filter(
    (res, idx, arr) => arr.findIndex((r) => r.id === res.id) === idx
  );
  return unique;
};

// 2. Główny atom z listą rezerwacji
export const reservationsAtom = atom<Reservation[]>(loadInitialReservations());

// 3. Atom do dodawania nowej rezerwacji
export const addReservationAtom = atom(
  null,
  (get, set, newReservation: Reservation) => {
    const updated = [...get(reservationsAtom), newReservation];
    localStorage.setItem(localStorageKey, JSON.stringify(updated));
    set(reservationsAtom, updated);
  }
);
