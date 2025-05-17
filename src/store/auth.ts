import { atom } from "jotai";

const localStorageKey = "isAdminLoggedIn";

export const isAdminLoggedInAtom = atom(
  !!localStorage.getItem(localStorageKey)
);

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