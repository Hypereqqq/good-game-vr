import { atom } from "jotai";
import { Reservation } from "../types/types";

// Atom przechowujący listę rezerwacji
export const reservationsAtom = atom<Reservation[]>([]);

// Akcja do dodawania nowej rezerwacji
export const addReservationAtom = atom(
    null,
    (get, set, newReservation: Reservation) => {
      const current = get(reservationsAtom);
      set(reservationsAtom, [...current, newReservation]);
    }
  );