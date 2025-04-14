export interface Reservation {
    id: string; // Unikalne ID rezerwacji, np. UUID
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string; // ISO string daty dokonania rezerwacji
    reservationDate: string; // ISO string daty, na którą jest rezerwacja (np. "2025-04-16T09:00")
    service: "Stanowisko VR" | "Symulator VR - 1 osoba" | "Symulator VR - 2 osoby";
    people: number;
    duration: number; // w minutach: 30, 60, 90, 120
  }

  export interface ClientGame {
    id: string; // unikalne ID
    name: string; // nazwa grupy / osoby
    stations: number[]; // lista zajętych stanowisk (np. [1, 2])
    players: number; // liczba graczy
    duration: number; // czas gry w minutach
    startTime: string; // czas rozpoczęcia (ISO string)
    paid: boolean; // czy opłacone
  }
  


  // TO DO
  // - walidacja dodawnia klienta do gry
  // - mozliwosc wpisania wlasnej kwoty do oplaty
  // - ogarniecie informacji na kafelki to znaczy: kto gra, na jaki czas, kiedy zaczal - kiedy konczy, za ile koniec, czy oplacone, jak nie to jaka kwota
  // - dodanie opcji edytowania klienta, zmiana stanowiska, zmiana czasu gry, zmiana liczby graczy, zmiana statusu oplacenia
  // - dodanie opcji usuwania klienta

  // dodanie tabelki pod spodem w ktorej wlasnie mozna edytowac i usuwac klienta i zmieniac oplaty itp, ale usuwac tez mozna z poziomu kafelka
  // moze jakby sie dalo to przenoszenie za pomoca przeciagniecia
  // jak jest 10 minut do konca to napis sie robi zoltawy, a jak 5 minut to czerwony
  // dodanie samemu godziny rozpoczecia
  // klikniecie w kafelek otwiera edycje
  // opcja dodania komentarza
  // pooprawna kolejnosc w selecie
  // nie pokazuje w selecie tych ktore sa zajete
  // dodanie opcji zmiany stanowiska w trakcie gry