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
  stations: number[];           // List of station numbers (1-8)
  players: number;              // Number of players in the group (1-8)
  duration: number;             // Duration of the game in minutes (30, 60, 90, 120)
  startTime: string;            // ISO string date when the game starts (e.g. "2025-04-16T10:00")
  paid: boolean;                // Is the game paid?
  customPrice?: number;         // Optional custom price for the game
  customStart?: boolean;        // Optional custom start time (if true, startTime is used)
  comment?: string;             // Optional comment for the game
  playedMinutes?: number;       // Optional played minutes (if the game has started)
  isPaused?: boolean;           // Optional flag indicating if game is paused
  pauseStartTime?: string;      // Optional ISO string date when the game was paused
  pauseHistory?: Array<{startTime: string, endTime?: string}>; // Historia pauz dla dokładnych obliczeń czasu
  reminder?: boolean;           // Optional flag indicating if game has a reminder
  reminderTimes?: number[];     // Optional array of times (minutes) for reminders
  reminderMode?: 'before' | 'every'; // Optional mode for reminders: before end or periodic
  reminderText?: string;        // Optional text for reminder
  reminderStartMode?: 'from_now' | 'from_start'; // Optional mode for reminder start time: from now or from game start
  reminderSetTime?: string;     // Optional ISO string date when the reminder was set
  lastEveryTriggeredMinute?: number; // Optional: minute index of last acknowledged 'every' reminder
}

