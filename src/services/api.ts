import axios from "axios";
import { Reservation } from "../types/types.ts";

// Basic URL API
const API_URL = "http://127.0.0.1:8000";

// Axios instance for API requests
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interface for AppConfig
export interface AppConfig {
  id: number;
  stations: number;
  seats: number;
}

// Service for managing reservations
export const reservationService = {
  // Get all reservations
  getAll: async (): Promise<Reservation[]> => {
    const response = await api.get('/reservations');
    return response.data;
  },

  // Add a new reservation
  create: async (reservation: Omit<Reservation, 'id'>): Promise<Reservation> => {
    const response = await api.post('/reservations', reservation);
    return response.data;
  },

  // Update an existing reservation
  update: async (id: string, reservation: Partial<Reservation>): Promise<Reservation> => {
    const response = await api.put(`/reservations/${id}`, reservation);
    return response.data;
  },

  // Delete a reservation
  delete: async (id: string): Promise<void> => {
    await api.delete(`/reservations/${id}`);
  },
};

// Service for managing application settings
export const settingsService = {
  // Get application settings
  getSettings: async (): Promise<AppConfig> => {
    const response = await api.get('/config');
    // Ponieważ endpoint zwraca listę, ale wiemy że zawsze będzie tylko jeden element
    return response.data[0];
  },

  // Update application settings
  updateSettings: async (settings: Omit<AppConfig, 'id'>): Promise<AppConfig> => {
    // Zawsze aktualizujemy rekord z ID=1
    const response = await api.put(`/config/1`, settings);
    return response.data;
  },
};

// Interfejs dla danych logowania
export interface LoginCredentials {
  email_or_username: string;
  password: string;
}

// Serwis do obsługi logowania
export const authService = {
  // Logowanie użytkownika
  login: async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await api.post('/login', credentials);
      return response.data === true;
    } catch (error) {
      console.error("Błąd logowania:", error);
      return false;
    }
  },
};