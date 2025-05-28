export interface Reservation {
  id: string;                   // Unique ID
  firstName: string;            // First name of the person making the reservation
  lastName: string;             // Last name of the person making the reservation
  email: string;                // Email address of the person making the reservation
  phone: string;                // Phone number of the person making the reservation
  createdAt: string;            // ISO string date when the reservation was created (e.g. "2025-04-16T08:00")
  reservationDate: string;      // ISO string date of the reservation (e.g. "2025-04-16T10:00")
  service:                      // Service type
    | "Stanowisko VR"
    | "Symulator VR - 1 osoba"
    | "Symulator VR - 2 osoby";
  people: number;               // Number of people in the reservation (1-8)
  duration: number;             // Duration of the reservation in minutes (30, 60, 90, 120)
  whoCreated: string;           // Who created the reservation (e.g. "Good Game VR" or "Klient") 
  cancelled: boolean;           // Is the reservation cancelled?
}

export interface ClientGame {
  id: string;                   // Unique ID
  name: string;                 // Name of the group or client
  stations: number[];           // List of station numbers (1-8)
  players: number;              // Number of players in the group (1-8)
  duration: number;             // Duration of the game in minutes (30, 60, 90, 120)
  startTime: string;            // ISO string date when the game starts (e.g. "2025-04-16T10:00")
  paid: boolean;                // Is the game paid?
  customPrice?: number;         // Optional custom price for the game
  customStart?: boolean;        // Optional custom start time (if true, startTime is used)
  comment?: string;             // Optional comment for the game
  playedMinutes?: number;       // Optional played minutes (if the game has started)
}

//                                                      ----- TO DO LIST -----
//        -- GŁÓWNA STRONA --
// aktualizacja
//
//          -- ZARZADZANIE --
// dodanie stopera
// mozna dodac staystyki
//   - dodac kafelki z tymi opcjami i stoper jako plywajace okienko.
// dodanie powiadomien np po 15 minutach zeby zmienic gre
// komentarz dla kolejki, czas kiedy gral dla kolejki
//
//
//          -- REZERWACJE --
// historia rezerwacji
// powiadomienia dzwoneczki
// w zarzadzaniu niech tez aktualizuje na bieząco rezerwacje i ewentualnie w dzownoeczku powiadomienie
//
//
//
