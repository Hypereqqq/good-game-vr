import { atom } from "jotai";
import { authService, LoginCredentials } from "../services/api";

const localStorageKey = "isAdminLoggedIn";

// Podstawowy atom przechowujący stan zalogowania
export const isAdminLoggedInAtom = atom(
  !!localStorage.getItem(localStorageKey)
);

// Atom do prostego ustawienia stanu zalogowania (bez komunikacji z API)
export const setAdminLoggedInAtom = atom(
  null,
  (_get, set, value: boolean) => {
    set(isAdminLoggedInAtom, value);
    if (value) {
      localStorage.setItem(localStorageKey, "1");
    } else {
      localStorage.removeItem(localStorageKey);
    }
  }
);

// Atom do logowania używający API
export const loginAdminAtom = atom(
  null,
  async (_get, set, credentials: LoginCredentials) => {
    try {
      console.log("Próba logowania:", credentials.email_or_username);
      const success = await authService.login(credentials);
      
      if (success) {
        console.log("Logowanie udane!");
        set(isAdminLoggedInAtom, true);
        localStorage.setItem(localStorageKey, "1");
        return { success: true, message: "Zalogowano pomyślnie" };
      } else {
        console.log("Logowanie nieudane - niepoprawne dane");
        return { success: false, message: "Niepoprawna nazwa użytkownika lub hasło" };
      }
    } catch (error) {
      console.error("Błąd podczas logowania:", error);
      return { success: false, message: "Wystąpił błąd podczas logowania" };
    }
  }
);

// Atom do wylogowywania
export const logoutAdminAtom = atom(null, (_get, set) => {
  set(isAdminLoggedInAtom, false);
  localStorage.removeItem(localStorageKey);
  console.log("Wylogowano");
  return true;
});