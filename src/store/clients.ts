import { atom } from "jotai";
import { ClientGame } from "../types/types";

export const clientsAtom = atom<ClientGame[]>([]);