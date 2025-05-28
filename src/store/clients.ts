import { atom } from "jotai";
import { ClientGame } from "../types/types";

// Store for managing client games
// This atom holds the list of client games and persists it in localStorage
const LOCAL_STORAGE_KEY = "ggvr_clients";

// Function to get initial clients from localStorage
const getInitialClients = (): ClientGame[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

// Atom to manage the list of client games
export const clientsAtom = atom<ClientGame[]>(getInitialClients());
