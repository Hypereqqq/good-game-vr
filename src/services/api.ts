import axios from "axios";
import { Reservation } from "../types/types.ts";

// Flaga określająca, czy używać backendu - możesz zmienić na false, aby wyłączyć połączenia API
export const USE_BACKEND = false;

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

// Interface for LoginCredentials
export interface LoginCredentials {
  email_or_username: string;
  password: string;
}


// Service for managing reservations
export const reservationService = {
  // Get all reservations
  getAll: async (): Promise<Reservation[]> => {
    if (!USE_BACKEND) {
      console.log("Backend wyłączony - zwracam puste rezerwacje");
      return []; // Zwróć pustą tablicę, gdy backend jest wyłączony
    }
    
    const response = await api.get('/reservations');
    return response.data;
  },

  // Add a new reservation
  create: async (reservation: Omit<Reservation, 'id'>): Promise<Reservation> => {
    if (!USE_BACKEND) {
      console.log("Backend wyłączony - symulacja tworzenia rezerwacji");
      // Zwróć sztuczną rezerwację z wygenerowanym ID
      return {
        id: `mock-${Date.now()}`,
        ...reservation
      };
    }
    
    const response = await api.post('/reservations', reservation);
    return response.data;
  },

  // Update an existing reservation
  update: async (id: string, reservation: Partial<Reservation>): Promise<Reservation> => {
    if (!USE_BACKEND) {
      console.log("Backend wyłączony - symulacja aktualizacji rezerwacji", id);
      return {
        id,
        ...(reservation as any)
      };
    }
    
    const response = await api.put(`/reservations/${id}`, reservation);
    return response.data;
  },

  // Delete a reservation
  delete: async (id: string): Promise<void> => {
    if (!USE_BACKEND) {
      console.log("Backend wyłączony - symulacja usuwania rezerwacji", id);
      return; // Po prostu zwróć void, gdy backend jest wyłączony
    }
    
    await api.delete(`/reservations/${id}`);
  },
};

// Service for managing application settings
export const settingsService = {
  // Get application settings
  getSettings: async (): Promise<AppConfig> => {
    if (!USE_BACKEND) {
      console.log("Backend wyłączony - zwracam domyślne ustawienia");
      // Zwróć domyślne ustawienia
      return {
        id: 1,
        stations: 8, // Domyślna liczba stanowisk
        seats: 2     // Domyślna liczba miejsc
      };
    }
    
    const response = await api.get('/config');
    // Assuming the response is an array with a single object
    return response.data[0];
  },

  // Update application settings
  updateSettings: async (settings: Omit<AppConfig, 'id'>): Promise<AppConfig> => {
    if (!USE_BACKEND) {
      console.log("Backend wyłączony - symulacja aktualizacji ustawień");
      return {
        id: 1,
        ...settings
      };
    }
    
    // We assume that the settings are updated by ID 1
    const response = await api.put(`/config/1`, settings);
    return response.data;
  },
};

// Service for user authentication
export const authService = {
  // User login
  login: async (credentials: LoginCredentials): Promise<boolean> => {
    // Jeśli backend jest wyłączony, symulujemy udane logowanie dla admina/admin
    if (!USE_BACKEND) {
      console.log("Backend wyłączony - symulacja logowania");
      // Sprawdź czy to są dane administratora (możesz dostosować te dane)
      if (credentials.email_or_username === "admin" && credentials.password === "admin") {
        return true;
      }
      return false;
    }
    
    try {
      const response = await api.post('/login', credentials);
      return response.data === true;
    } catch (error) {
      console.error("Błąd logowania:", error);
      return false;
    }
  },
};