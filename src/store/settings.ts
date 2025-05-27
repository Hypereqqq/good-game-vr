import { atom } from "jotai";
import { settingsService } from "../services/api";

export interface Settings {
  stations: number; // liczba działających stanowisk VR
  seats: number;    // liczba działających siedzeń (symulatorów)
}

const defaultSettings: Settings = {
  stations: 8,
  seats: 2,
};

// Podstawowy atom przechowujący ustawienia
export const settingsAtom = atom<Settings>(defaultSettings);

// Atom do pobierania ustawień z API
export const fetchSettingsAtom = atom(
  null,
  async (get, set) => {
    try {
      const settings = await settingsService.getSettings();
      // Ustaw wartości atomu
      set(settingsAtom, { 
        stations: settings.stations, 
        seats: settings.seats 
      });
      // Pobierz aktualną wartość po aktualizacji 
      const currentSettings = get(settingsAtom);
      console.log("Pobrano ustawienia STORE:", settings);
      console.log("Aktualne ustawienia po aktualizacji STORE:", currentSettings);
    } catch (error) {
      console.error("Błąd podczas pobierania ustawień:", error);
      // W przypadku błędu pozostawiamy domyślne ustawienia
    }
  }
);

// Atom do automatycznego odświeżania ustawień co zadany interval w ms
export const setupSettingsPollingAtom = atom(
  null,
  (get, set, interval: number = 60000) => { // domyślnie co minutę
    console.log(`Uruchomiono polling ustawień co ${interval/1000} sekund`);
    
    // Natychmiast pobierz ustawienia
    set(fetchSettingsAtom);
    
    // Sprawdź czy dane zostały rzeczywiście zaktualizowane
    const initialSettings = get(settingsAtom);
    console.log("Aktualne ustawienia po pierwszym pobraniu STORE:", initialSettings);
    
    // Ustaw interval odświeżający dane
    const intervalId = setInterval(() => {
      set(fetchSettingsAtom);
      const updatedSettings = get(settingsAtom);
      console.log("Odświeżono ustawienia przez polling STORE:", updatedSettings);
    }, interval);
    
    // Zwróć funkcję czyszczącą
    return () => {
      console.log("Zatrzymano polling ustawień");
      clearInterval(intervalId);
    };
  }
);

// Atom do aktualizacji ustawień przez API
export const updateSettingsAtom = atom(
  null,
  async (get, set, settings: Settings) => {
    try {
      // Wysyłamy aktualizację do API
      await settingsService.updateSettings(settings);
      console.log("Wysłano aktualizację ustawień do API STORE:", settings);
      
      // Po aktualizacji pobieramy wszystkie ustawienia na nowo
      const updatedSettings = await settingsService.getSettings();
      
      // Aktualizujemy lokalny atom z nowymi danymi
      set(settingsAtom, { 
        stations: updatedSettings.stations, 
        seats: updatedSettings.seats 
      });
      
      // Sprawdź wartość po aktualizacji
      const currentSettings = get(settingsAtom);
      console.log("Zaktualizowano ustawienia w store, nowe wartości STORE:", currentSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error("Błąd podczas aktualizacji ustawień:", error);
      throw error;
    }
  }
);