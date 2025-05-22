import { atom } from "jotai";

export interface Settings {
  stations: number; // liczba działających stanowisk VR
  seats: number;    // liczba działających siedzeń (symulatorów)
}

const defaultSettings: Settings = {
  stations: 8,
  seats: 2,
};

export const settingsAtom = atom<Settings>(defaultSettings);