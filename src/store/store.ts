import { atom } from "jotai";
import { Reservation } from "../types/types";

const localStorageKey = "reservations";

// 1. Ładowanie danych z localStorage przy starcie
const loadInitialReservations = (): Reservation[] => {
  const stored = localStorage.getItem(localStorageKey);
  return stored ? JSON.parse(stored) : [];
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