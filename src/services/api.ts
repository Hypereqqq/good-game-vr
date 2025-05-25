import axios from "axios";
import { Reservation } from "../types/types.ts";

// Bazowy URL API - w trybie developerskim
const API_URL = "http://127.0.0.1:8000";

// Instancja axios z konfiguracją
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Funkcje do komunikacji z API
export const reservationService = {
  // Pobierz wszystkie rezerwacje
  getAll: async (): Promise<Reservation[]> => {
    const response = await api.get('/reservations');
    return response.data;
  },

  // Dodaj nową rezerwację
  create: async (reservation: Omit<Reservation, 'id'>): Promise<Reservation> => {
    const response = await api.post('/reservations', reservation);
    return response.data;
  },

  // Zaktualizuj istniejącą rezerwację
  update: async (id: string, reservation: Partial<Reservation>): Promise<Reservation> => {
    const response = await api.put(`/reservations/${id}`, reservation);
    return response.data;
  },

  // Usuń rezerwację
  delete: async (id: string): Promise<void> => {
    await api.delete(`/reservations/${id}`);
  },
};
