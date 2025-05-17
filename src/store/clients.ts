import { atom } from "jotai";
import { ClientGame } from "../types/types";

const LOCAL_STORAGE_KEY = "ggvr_clients";

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

export const clientsAtom = atom<ClientGame[]>(getInitialClients());
