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