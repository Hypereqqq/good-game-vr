import { atom } from "jotai";
import { settingsService } from "../services/api";

// Types for settings
export interface Settings {
  stations: number; // Number of active stations (VR HEADSETS)
  seats: number;    // Number of active seats (VR SEATS)
}

// Default settings
const defaultSettings: Settings = {
  stations: 8,
  seats: 2,
};

// Basic atom for settings
export const settingsAtom = atom<Settings>(defaultSettings);

// Atom for fetching settings from the API
// This atom fetches settings from the API and updates the settingsAtom
// It also logs the fetched settings and current state after update
export const fetchSettingsAtom = atom(
  null,
  async (get, set) => {
    try {
      const settings = await settingsService.getSettings();
      // Set the fetched settings to the settingsAtom
      set(settingsAtom, { 
        stations: settings.stations, 
        seats: settings.seats 
      });
      // Update the settingsAtom with fetched data 
      const currentSettings = get(settingsAtom);
      console.log("Pobrano ustawienia STORE:", settings);
      console.log("Aktualne ustawienia po aktualizacji STORE:", currentSettings);
    } catch (error) {
      console.error("Błąd podczas pobierania ustawień:", error);
      // In case of error, reset to default settings
    }
  }
);

// Atom for setting up polling to fetch settings periodically
export const setupSettingsPollingAtom = atom(
  null,
  (get, set, interval: number = 60000) => { // Default interval is 60 seconds
    console.log(`Uruchomiono polling ustawień co ${interval/1000} sekund`);
    
    // Immediately fetch settings on setup
    set(fetchSettingsAtom);
    
    // Check initial settings after first fetch
    const initialSettings = get(settingsAtom);
    console.log("Aktualne ustawienia po pierwszym pobraniu STORE:", initialSettings);
    
    // Set up polling to fetch settings periodically
    const intervalId = setInterval(() => {
      set(fetchSettingsAtom);
      const updatedSettings = get(settingsAtom);
      console.log("Odświeżono ustawienia przez polling STORE:", updatedSettings);
    }, interval);
    
    // Cleanup function to clear the interval when no longer needed
    return () => {
      console.log("Zatrzymano polling ustawień");
      clearInterval(intervalId);
    };
  }
);

// Atom for updating settings via API
// This atom allows updating settings and fetching the latest settings from the API
export const updateSettingsAtom = atom(
  null,
  async (get, set, settings: Settings) => {
    try {
      // Send the updated settings to the API
      await settingsService.updateSettings(settings);
      console.log("Wysłano aktualizację ustawień do API STORE:", settings);
      
      // After updating, fetch the latest settings from the API
      const updatedSettings = await settingsService.getSettings();
      
      // Update the settingsAtom with the new values
      set(settingsAtom, { 
        stations: updatedSettings.stations, 
        seats: updatedSettings.seats 
      });
      
      // Check the current settings in the store after update
      const currentSettings = get(settingsAtom);
      console.log("Zaktualizowano ustawienia w store, nowe wartości STORE:", currentSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error("Błąd podczas aktualizacji ustawień:", error);
      throw error;
    }
  }
);