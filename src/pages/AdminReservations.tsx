import React, { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { useAtom } from "jotai";
import { reservationsAtom } from "../store/store";
import { settingsAtom } from "../store/settings";
import {
  FaUserFriends,
  FaPhone,
  FaEnvelope,
  FaTrash,
  FaInfoCircle,
  FaHome,
  FaCalendarAlt,
  FaSlidersH,
  FaSearch,
  FaCheckCircle,
} from "react-icons/fa";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import DatePicker from "react-datepicker";
import { pl } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
registerLocale("pl", pl);

type SubpageType = "main" | "calendar" | "settings" | "add";

const AdminReservations: React.FC = () => {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [editSettings, setEditSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [subpage, setSubpage] = useState<SubpageType>("main");
  const [previousSubpage, setPreviousSubpage] = useState<SubpageType>("main");
  const [reservations, setReservations] = useAtom(reservationsAtom);
  const [tab, setTab] = useState<"today" | "week">("today");
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState(DateTime.now().startOf("day"));
  const [dateTo, setDateTo] = useState(
    DateTime.now().plus({ days: 6 }).endOf("day")
  );
  const [selectedWeekDay, setSelectedWeekDay] = useState(
    DateTime.now().plus({ days: 1 }).toISODate()
  );
  const [infoModal, setInfoModal] = useState<null | any>(null);
  const [cancelledCount, setCancelledCount] = useState(2);
  const [deleteModal, setDeleteModal] = useState<{ id: string } | null>(null);
  const [showFuture, setShowFuture] = useState(true);

  // Wybór typu wykresu i szczegółów
  const [chartType, setChartType] = useState<"general" | "reservations">(
    "reservations"
  );
  const [chartDetail, setChartDetail] = useState<string>("all");

  // KALENDARZ: wybór miesiąca przez DatePicker (tylko miesiąc/rok)
  const today_2 = DateTime.now();
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(
    today_2.startOf("month").toJSDate()
  );

  const [dayModal, setDayModal] = useState<null | { date: string }>(null);
  const [modalServiceFilter, setModalServiceFilter] = useState("");
  const [hideFree, setHideFree] = useState(false);

  useEffect(() => {
    if (!editSettings) setTempSettings(settings);
  }, [settings, editSettings]);

  // Rezerwacje na wybrany dzień do modala
  const modalReservationsAll = dayModal
    ? reservations.filter(
        (r) => DateTime.fromISO(r.reservationDate).toISODate() === dayModal.date
      )
    : [];

  const modalReservations = modalServiceFilter
    ? modalReservationsAll.filter((r) => r.service === modalServiceFilter)
    : modalReservationsAll;

  // Statystyki do nagłówka modala
  const dayStats = {
    people: modalReservationsAll.reduce((sum, r) => sum + (r.people || 0), 0),
    count: modalReservationsAll.length,
  };

  // Wyznacz sloty czasowe
  let modalTimeSlots: string[] = [];
  if (dayModal) {
    if (
      modalServiceFilter === "Symulator VR - 1 osoba" ||
      modalServiceFilter === "Symulator VR - 2 osoby"
    ) {
      // co 15 min
      let t = DateTime.fromISO(dayModal.date).set({ hour: 10, minute: 0 });
      const end = t.set({ hour: 22, minute: 0 });
      while (t <= end) {
        modalTimeSlots.push(t.toFormat("HH:mm"));
        t = t.plus({ minutes: 15 });
      }
    } else {
      // co 30 min, ale jeśli są symulatory, dodaj sloty 15-minutowe dla symulatorów
      let t = DateTime.fromISO(dayModal.date).set({ hour: 10, minute: 0 });
      const end = t.set({ hour: 22, minute: 0 });
      const simTimes = modalReservationsAll
        .filter((r) => r.service.startsWith("Symulator"))
        .map((r) => DateTime.fromISO(r.reservationDate).toFormat("HH:mm"));
      while (t <= end) {
        modalTimeSlots.push(t.toFormat("HH:mm"));
        // Dodaj slot 15-minutowy jeśli jest symulator w tym dniu na ten czas
        const next15 = t.plus({ minutes: 15 }).toFormat("HH:mm");
        if (simTimes.includes(next15) && !modalTimeSlots.includes(next15)) {
          modalTimeSlots.push(next15);
        }
        t = t.plus({ minutes: 30 });
      }
      // Posortuj sloty rosnąco
      modalTimeSlots = Array.from(new Set(modalTimeSlots)).sort();
    }
  }

  // Wyciągnij miesiąc i rok z wybranej daty
  const calendarMonth = DateTime.fromJSDate(calendarMonthDate).month;
  const calendarYear = DateTime.fromJSDate(calendarMonthDate).year;

  // Wylicz dni do wyświetlenia w siatce kalendarza
  const monthStart = DateTime.local(calendarYear, calendarMonth, 1);
  const monthEnd = monthStart.endOf("month");
  const start = monthStart.startOf("week");
  const end = monthEnd.endOf("week");

  const days: DateTime[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = d.plus({ days: 1 });
  }

  const filteredCalendarReservations = serviceFilter
    ? reservations.filter((r) => r.service === serviceFilter)
    : reservations;

  // Mapowanie rezerwacji po dacie
  const reservationsByDay: Record<string, typeof reservations> = {};
  filteredCalendarReservations.forEach((r) => {
    const day = DateTime.fromISO(r.reservationDate).toISODate();
    if (day) {
      if (!reservationsByDay[day]) reservationsByDay[day] = [];
      reservationsByDay[day].push(r);
    }
  });

  // Filtrowanie tylko po search i usłudze (daty tylko do wykresu)
  const filtered = reservations.filter((r) => {
    const matchesSearch = `${r.firstName} ${r.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesService = serviceFilter ? r.service === serviceFilter : true;
    return matchesSearch && matchesService;
  });

  // Statystyki dla zakresu (na podstawie wykresu)
  const filteredForStats = reservations.filter((r) => {
    const dt = DateTime.fromISO(r.reservationDate);
    const inRange = dt >= dateFrom && dt <= dateTo;
    return inRange;
  });
  const statAll = filteredForStats.length;
  const statAccepted = filteredForStats.length - cancelledCount;
  const statCancelled = cancelledCount;
  const statNewClients = 0; // przykładowo

  // Wykres - dane tylko po dacie i wybranych selectach
  const daysInRange = [];
  let dt = dateFrom.startOf("day");
  while (dt <= dateTo.endOf("day")) {
    daysInRange.push(dt);
    dt = dt.plus({ days: 1 });
  }

  // Dane do wykresu - NIE filtruj po search/serviceFilter, tylko po dacie
  const chartFiltered = reservations.filter((r) => {
    const dt = DateTime.fromISO(r.reservationDate);
    return dt >= dateFrom && dt <= dateTo;
  });

  // Przetwarzanie danych do wykresu na podstawie wyborów selectów
  let chartDatasets: any[] = [];

  if (chartType === "general") {
    chartDatasets = [
      {
        label: "Wszystkie",
        data: daysInRange.map(
          (d) =>
            chartFiltered.filter(
              (r) =>
                DateTime.fromISO(r.reservationDate).toISODate() ===
                d.toISODate()
            ).length
        ),
        fill: true,
        backgroundColor: "rgba(12,74,150,0.10)",
        borderColor: "#0c4a96",
        tension: 0.3,
      },
      {
        label: "Zaakceptowane",
        data: daysInRange.map(
          (d) =>
            chartFiltered.filter(
              (r) =>
                DateTime.fromISO(r.reservationDate).toISODate() ===
                  d.toISODate() && !r.cancelled
            ).length
        ),
        fill: true,
        backgroundColor: "rgba(8,167,30,0.10)",
        borderColor: "#08a71e",
        tension: 0.3,
      },
      {
        label: "Anulowane",
        data: daysInRange.map(
          (d) =>
            chartFiltered.filter(
              (r) =>
                DateTime.fromISO(r.reservationDate).toISODate() ===
                  d.toISODate() && r.cancelled
            ).length
        ),
        fill: true,
        backgroundColor: "rgba(175,101,16,0.10)",
        borderColor: "#af6510",
        tension: 0.3,
      },
    ];
  } else if (chartType === "reservations") {
    if (chartDetail === "all") {
      chartDatasets = [
        {
          label: "Stanowisko VR",
          data: daysInRange.map(
            (d) =>
              chartFiltered.filter(
                (r) =>
                  DateTime.fromISO(r.reservationDate).toISODate() ===
                    d.toISODate() && r.service === "Stanowisko VR"
              ).length
          ),
          fill: true,
          backgroundColor: "rgba(0,217,255,0.10)",
          borderColor: "#00d9ff",
          tension: 0.3,
        },
        {
          label: "Symulator VR",
          data: daysInRange.map(
            (d) =>
              chartFiltered.filter(
                (r) =>
                  DateTime.fromISO(r.reservationDate).toISODate() ===
                    d.toISODate() &&
                  (r.service === "Symulator VR - 1 osoba" ||
                    r.service === "Symulator VR - 2 osoby")
              ).length
          ),
          fill: true,
          backgroundColor: "rgba(227,52,47,0.10)",
          borderColor: "#e3342f",
          tension: 0.3,
        },
      ];
    } else if (chartDetail === "vr") {
      chartDatasets = [
        {
          label: "Stanowisko VR",
          data: daysInRange.map(
            (d) =>
              chartFiltered.filter(
                (r) =>
                  DateTime.fromISO(r.reservationDate).toISODate() ===
                    d.toISODate() && r.service === "Stanowisko VR"
              ).length
          ),
          fill: true,
          backgroundColor: "rgba(0,217,255,0.10)",
          borderColor: "#00d9ff",
          tension: 0.3,
        },
      ];
    } else if (chartDetail === "sim1") {
      chartDatasets = [
        {
          label: "Symulator 1 os",
          data: daysInRange.map(
            (d) =>
              chartFiltered.filter(
                (r) =>
                  DateTime.fromISO(r.reservationDate).toISODate() ===
                    d.toISODate() && r.service === "Symulator VR - 1 osoba"
              ).length
          ),
          fill: true,
          backgroundColor: "rgba(227,52,47,0.10)",
          borderColor: "#e3342f",
          tension: 0.3,
        },
      ];
    } else if (chartDetail === "sim2") {
      chartDatasets = [
        {
          label: "Symulator 2 os",
          data: daysInRange.map(
            (d) =>
              chartFiltered.filter(
                (r) =>
                  DateTime.fromISO(r.reservationDate).toISODate() ===
                    d.toISODate() && r.service === "Symulator VR - 2 osoby"
              ).length
          ),
          fill: true,
          backgroundColor: "rgba(227,52,47,0.10)",
          borderColor: "#e3342f",
          tension: 0.3,
        },
      ];
    }
  }

  const chartData = {
    labels: daysInRange.map((d) => d.toFormat("yyyy-LL-dd")),
    datasets: chartDatasets,
  };

  // Rezerwacje na dziś
  const today = DateTime.now().toISODate();
  const now = DateTime.now();
  const todayReservations = filtered.filter(
    (r) =>
      DateTime.fromISO(r.reservationDate).toISODate() === today &&
      (!showFuture || DateTime.fromISO(r.reservationDate) >= now)
  );

  const getWeekDates = (start: DateTime) =>
    Array.from({ length: 7 }, (_, i) => start.plus({ days: i }));

  // Rezerwacje na tydzień
  const weekStart = DateTime.now().plus({ days: 1 }).startOf("day");
  const weekDates = getWeekDates(weekStart);

  const weekReservations = (dateISO: string) =>
    filtered.filter(
      (r) => DateTime.fromISO(r.reservationDate).toISODate() === dateISO
    );

  // Usuwanie rezerwacji
  const handleDelete = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    setCancelledCount((prev) => prev + 1);
  };

  // Kolor paska po lewej stronie
  const getBarColor = (service: string) => {
    if (service === "Stanowisko VR") return "bg-[#00d9ff]";
    if (service.startsWith("Symulator")) return "bg-red-600";
    return "bg-gray-400";
  };

  // Funkcja obsługująca przejście do dodawania rezerwacji
  const handleGoToAdd = () => {
    setPreviousSubpage(subpage);
    setSubpage("add");
  };

  // Funkcja obsługująca powrót
  const handleBackFromAdd = () => {
    setSubpage(previousSubpage);
  };

  // --- GŁÓWNY PANEL NAWIGACYJNY ---
  return (
    <section className="bg-[#0f1525] text-white px-2 py-8 min-h-screen">
      {/* Pasek nawigacyjny */}
      <div className="max-w-6xl mx-auto flex flex-col gap-4 mb-6">
        {/* Pasek z ikonami, wyszukiwaniem i przyciskiem dodaj */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          {/* Ikony podstron na lewo */}
          <div className="flex flex-1 gap-2 justify-start">
            <button
              className={`p-2 rounded flex items-center justify-center transition ${
                subpage === "main"
                  ? "bg-[#00d9ff] text-black shadow"
                  : "bg-[#222b3a] text-gray-400 hover:bg-[#454d5a]"
              }`}
              title="Strona główna"
              onClick={() => setSubpage("main")}
            >
              <FaHome size={20} />
            </button>
            <button
              className={`p-2 rounded flex items-center justify-center transition ${
                subpage === "calendar"
                  ? "bg-[#00d9ff] text-black shadow"
                  : "bg-[#222b3a] text-gray-400 hover:bg-[#454d5a]"
              }`}
              title="Kalendarz realizacji"
              onClick={() => setSubpage("calendar")}
            >
              <FaCalendarAlt size={20} />
            </button>
            <button
              className={`p-2 rounded flex items-center justify-center transition ${
                subpage === "settings"
                  ? "bg-[#00d9ff] text-black shadow"
                  : "bg-[#222b3a] text-gray-400 hover:bg-[#454d5a]"
              }`}
              title="Ustawienia"
              onClick={() => setSubpage("settings")}
            >
              <FaSlidersH size={20} />
            </button>
          </div>
          {/* Wyszukiwarka na środku */}
          <div className="flex flex-1 justify-center w-full max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Wyszukaj rezerwacje..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 pl-10 rounded bg-[#0f1525] border border-gray-600 text-white"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {/* Dodaj rezerwację na prawo */}
          <div className="flex flex-1 justify-end w-full ">
            {subpage !== "add" ? (
              <button
                className="bg-[#00d9ff] text-black font-bold  px-4 py-2 rounded shadow hover:bg-[#ffcc00] transition w-full sm:w-auto"
                onClick={handleGoToAdd}
              >
                DODAJ REZERWACJĘ
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="bg-[#00d9ff] text-black font-bold px-4 py-2 rounded shadow hover:bg-[#ffcc00] transition"
                  // onClick={handleAddReservation} // Dodasz obsługę później
                >
                  Dodaj
                </button>
                <button
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded shadow transition"
                  onClick={handleBackFromAdd}
                >
                  Wróć
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZAWARTOŚĆ PODSTRON */}

      {subpage === "add" && (
        <div className="max-w-3xl mx-auto bg-[#1e2636] rounded-lg shadow p-8 mt-4">
          {/* Tutaj wstawisz formularz dodawania rezerwacji */}
          <h2 className="text-2xl font-bold mb-6 text-[#00d9ff]">
            Dodaj rezerwację
          </h2>
          {/* ...formularz...robmiy to od nowa, zrob ten modal dokladnie tak samo jak zostlao to zrobione w reservation.tsx, przy czym pozbadzmy sie drugiego kroku i przeniesmy do na poczatek (mam na mysli podaniewanie imenia i nazwisko emaila i numeru telefonu, selecta z usluga zostawmy dokladnie takiego samego), zmienmy tez wybor daty, w adminie ma nie byc takiego kalendarza jak tam, tylko bazowo ma byc wybrany dzisiejszy dzien i od razu maja sie pokazywac godziny w takim styl w jakim ci pisalem wyzej czyli pod soba, nad godzinai ma byc dostepny datapicker do zmiany dnia, zachowaj walidacje i wgl wszystko z tamtego pliku, dodwaj rezerwacje za pomoca atomu  */}
        </div>
      )}

      {subpage === "main" && (
        <>
          {/* Tytuł i  DatePicker */}
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              Panel zarządzania rezerwacjami
            </h1>
            {subpage === "main" && (
              <div className="flex mt-2 sm:mt-0 items-center  sm:w-auto">
                <DatePicker
                  locale={pl}
                  selected={dateFrom.toJSDate()}
                  onChange={(date) => {
                    const dt = date
                      ? DateTime.fromJSDate(date).startOf("day")
                      : null;
                    if (dt && dt.isValid)
                      setDateFrom(dt as typeof dt & { isValid: true });
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="p-2 rounded bg-[#0f1525] border border-gray-600 text-white focus:ring-[#00d9ff] w-[120px]"
                  calendarClassName="bg-[#1e2636] text-white border border-[#00d9ff]"
                />
                <span className="mx-2 flex items-center h-full text-xl">-</span>
                <DatePicker
                  locale={pl}
                  selected={dateTo.toJSDate()}
                  onChange={(date) => {
                    const dt = date
                      ? DateTime.fromJSDate(date).endOf("day")
                      : null;
                    if (dt && dt.isValid)
                      setDateTo(dt as typeof dt & { isValid: true });
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="p-2 rounded bg-[#0f1525] border border-gray-600 text-white focus:ring-[#00d9ff] w-[120px]"
                  calendarClassName="bg-[#1e2636] text-white border border-[#00d9ff]"
                />
              </div>
            )}
          </div>
          {/* Kafelki + wykres */}
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 mb-8">
            <div className="grid grid-cols-2 gap-6 flex-1">
              <div className="bg-[#0c4a96] rounded-lg p-5 shadow flex flex-col">
                <span className="text-lg font-bold">REZERWACJE</span>
                <span className="text-3xl font-bold mt-2">{statAll}</span>
              </div>
              <div className="bg-[#08a71e] rounded-lg p-5 shadow flex flex-col">
                <span className="text-lg font-bold">ZAAKCEPTOWANE</span>
                <span className="text-3xl font-bold mt-2">{statAccepted}</span>
              </div>
              <div className="bg-[#af6510] rounded-lg p-5 shadow flex flex-col">
                <span className="text-lg font-bold">ANULOWANE</span>
                <span className="text-3xl font-bold mt-2">{statCancelled}</span>
              </div>
              <div className="bg-[#5e17a1] rounded-lg p-5 shadow flex flex-col">
                <span className="text-lg font-bold">NOWI KLIENCI</span>
                <span className="text-3xl font-bold mt-2">
                  {statNewClients}
                </span>
              </div>
            </div>
            <div className="bg-[#1e2636] rounded-lg p-6 shadow flex-1 min-w-[320px]">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-lg font-bold text-[#00d9ff]">
                  Wykres rezerwacji
                </span>
                {/* Select typ wykresu */}
                <select
                  value={chartType}
                  onChange={(e) => {
                    setChartType(e.target.value as "general" | "reservations");
                    setChartDetail("all");
                  }}
                  className="bg-[#0f1525] border border-gray-600 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="general">Ogólne</option>
                  <option value="reservations">Rezerwacje</option>
                </select>
                {/* Select szczegółów */}
                {chartType === "general" ? null : (
                  <select
                    value={chartDetail}
                    onChange={(e) => setChartDetail(e.target.value)}
                    className="bg-[#0f1525] border border-gray-600 text-white rounded px-2 py-1 text-sm"
                  >
                    <option value="all">Wszystkie</option>
                    <option value="vr">Stanowisko VR</option>
                    <option value="sim1">Symulator 1 os</option>
                    <option value="sim2">Symulator 2os</option>
                  </select>
                )}
              </div>
              <Line
                data={chartData}
                options={{
                  plugins: { legend: { labels: { color: "#00d9ff" } } },
                  scales: {
                    x: {
                      ticks: { color: "#00d9ff" },
                      grid: { color: "#223a5f" },
                    },
                    y: {
                      ticks: { color: "#00d9ff" },
                      grid: { color: "#223a5f" },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Przełącznik widoku */}
          <div className="max-w-6xl mx-auto flex gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded-t-lg font-bold transition ${
                tab === "today"
                  ? "bg-[#222b3a] text-[#00d9ff]"
                  : "bg-[#0a101a] text-gray-400"
              }`}
              onClick={() => setTab("today")}
            >
              Rezerwacje na dziś
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg font-bold transition ${
                tab === "week"
                  ? "bg-[#1e2636] text-[#00d9ff]"
                  : "bg-[#0a101a] text-gray-400"
              }`}
              onClick={() => setTab("week")}
            >
              Rezerwacje na najbliższy tydzień
            </button>
          </div>

          {/* Filtry */}
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center mb-6">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Wyszukaj klientów..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              />
            </div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
            >
              <option value="">Wszystkie usługi</option>
              <option value="Stanowisko VR">Stanowisko VR</option>
              <option value="Symulator VR - 1 osoba">
                Symulator VR - 1 osoba
              </option>
              <option value="Symulator VR - 2 osoby">
                Symulator VR - 2 osoby
              </option>
            </select>
            <button
              className="p-2 rounded bg-pink-800 text-white font-bold hover:bg-pink-600"
              onClick={() => {
                setSearch("");
                setServiceFilter("");
              }}
            >
              Wyczyść filtry
            </button>
          </div>

          {/* Widok rezerwacji na dziś */}
          {tab === "today" && (
            <div className="max-w-6xl mx-auto bg-[#1e2636] rounded-lg shadow p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Rezerwacje na dziś</h2>
                {/* Suwak widoczności przyszłych rezerwacji */}
                <label className="flex items-center cursor-pointer select-none">
                  <span className="mr-2 text-sm text-gray-300">
                    Pokaż tylko przyszłe
                  </span>
                  <span className="relative">
                    <input
                      type="checkbox"
                      checked={showFuture}
                      onChange={() => setShowFuture((v) => !v)}
                      className="sr-only peer"
                    />
                    <span className="w-10 h-6 bg-gray-600 rounded-full shadow-inner peer-checked:bg-green-500 transition-colors block"></span>
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></span>
                  </span>
                </label>
              </div>
              {todayReservations.length === 0 ? (
                <div className="text-gray-400">
                  Brak nadchodzących rezerwacji...
                </div>
              ) : (
                todayReservations.map((r) => {
                  const dt = DateTime.fromISO(r.reservationDate);
                  const end = dt.plus({ minutes: r.duration });
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col md:flex-row items-center border-y border-gray-700 py-4 gap-4 relative pl-4"
                    >
                      {/* Pasek kolorowy */}
                      <div
                        className={`absolute left-0 top-0 h-full w-1 rounded-l ${getBarColor(
                          r.service
                        )}`}
                      ></div>
                      {/* Godziny */}
                      <div className="flex flex-col items-center min-w-[110px]">
                        <span className="text-base">
                          {dt.toFormat("HH:mm")} - {end.toFormat("HH:mm")}
                        </span>
                      </div>
                      {/* Imię i nazwisko + kontakt */}
                      <div className="flex-1 flex flex-col">
                        <span className="font-bold">
                          {r.firstName} {r.lastName}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-gray-300">
                          <FaUserFriends /> {r.people}
                          <div className="relative group">
                            <FaPhone className="cursor-pointer" />
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-[#08172c] text-s text-white opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                              {r.phone}
                            </span>
                          </div>
                          <div className="relative group">
                            <FaEnvelope className="cursor-pointer" />
                            <span className="absolute  left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-[#08172c] text-s text-white opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                              {r.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Data i czas */}
                      <div className="flex flex-col items-center justify-center min-w-[180px] lg:mr-20">
                        <span className="text-gray-300 text-center">
                          {dt.setLocale("pl").toFormat("cccc, d LLLL yyyy")}
                        </span>
                        <span className="text-gray-400 text-sm text-center">
                          ({r.duration} min)
                        </span>
                      </div>
                      {/* Usługa */}
                      <div className=" min-w-[120px] text-right lg:mr-20">
                        {r.service}
                      </div>
                      {/* Akcje */}
                      <div className="flex gap-2">
                        <button
                          className="bg-red-800 hover:bg-red-600 text-white p-2 rounded"
                          title="Usuń rezerwację"
                          onClick={() => setDeleteModal({ id: r.id })}
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                          title="Informacje"
                          onClick={() => setInfoModal(r)}
                        >
                          <FaInfoCircle />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Widok rezerwacji na tydzień */}
          {tab === "week" && (
            <div className="max-w-6xl mx-auto bg-[#1e2636] rounded-lg shadow p-6 mt-4">
              <h2 className="text-xl font-bold mb-4">
                Rezerwacje na najbliższy tydzień
              </h2>
              {/* Pasek z datami */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {weekDates.map((d) => (
                  <button
                    key={d.toISODate()}
                    className={`px-4 py-2 rounded ${
                      selectedWeekDay === d.toISODate()
                        ? "bg-[#00d9ff] text-black font-bold"
                        : "bg-[#223a5f] text-white"
                    }`}
                    onClick={() => setSelectedWeekDay(d.toISODate() ?? "")}
                  >
                    {d.setLocale("pl").toFormat("cccc, dd.LL")}
                  </button>
                ))}
              </div>
              {/* Lista rezerwacji na wybrany dzień */}
              {weekReservations(selectedWeekDay).length === 0 ? (
                <div className="text-gray-400">
                  Brak rezerwacji na ten dzień...
                </div>
              ) : (
                weekReservations(selectedWeekDay).map((r) => {
                  const dt = DateTime.fromISO(r.reservationDate);
                  const end = dt.plus({ minutes: r.duration });
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col md:flex-row items-center justify-between border-b border-gray-700 py-4 gap-4 relative pl-4"
                    >
                      {/* Pasek kolorowy */}
                      <div
                        className={`absolute left-0 top-0 h-full w-1 rounded-l ${getBarColor(
                          r.service
                        )}`}
                      ></div>
                      {/* Godziny */}
                      <div className="flex flex-col items-center min-w-[110px]">
                        <span className="text-base">
                          {dt.toFormat("HH:mm")} - {end.toFormat("HH:mm")}
                        </span>
                      </div>
                      {/* Imię i nazwisko + kontakt */}
                      <div className="flex-1 flex flex-col">
                        <span className="font-bold">
                          {r.firstName} {r.lastName}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-gray-300">
                          <FaUserFriends /> {r.people}
                          <div className="relative group">
                            <FaPhone className="cursor-pointer" />
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-[#223a5f] text-xs text-white opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                              {r.phone}
                            </span>
                          </div>
                          <div className="relative group">
                            <FaEnvelope className="cursor-pointer" />
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-[#223a5f] text-xs text-white opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                              {r.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Data i czas */}
                      <div className="flex flex-col items-center justify-center min-w-[180px] lg:mr-20">
                        <span className="text-gray-300 text-center">
                          {dt.setLocale("pl").toFormat("cccc, d LLLL yyyy")}
                        </span>
                        <span className="text-gray-400 text-sm text-center">
                          ({r.duration} min)
                        </span>
                      </div>
                      {/* Usługa */}
                      <div className="min-w-[120px] text-right lg:mr-20">
                        {r.service}
                      </div>
                      {/* Akcje */}
                      <div className="flex gap-2">
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                          title="Usuń rezerwację"
                          onClick={() => setDeleteModal({ id: r.id })}
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                          title="Informacje"
                          onClick={() => setInfoModal(r)}
                        >
                          <FaInfoCircle />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {subpage === "calendar" && (
        <>
          {/* Pasek wyboru miesiąca i roku */}
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0 ">
              Kalendarz rezerwacji
            </h1>

            <div className="flex items-center">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-[#0f1525] text-white rounded mr-4 px-2 py-1 border border-gray-600 focus:ring-[#00d9ff] ml-2"
              >
                <option value="">Wszystkie</option>
                <option value="Stanowisko VR">Stanowisko VR</option>
                <option value="Symulator VR - 1 osoba">Symulator 1 os</option>
                <option value="Symulator VR - 2 osoby">Symulator 2 os</option>
              </select>
              <DatePicker
                locale={pl}
                selected={calendarMonthDate}
                onChange={(date) => {
                  if (date)
                    setCalendarMonthDate(
                      DateTime.fromJSDate(date).startOf("month").toJSDate()
                    );
                }}
                dateFormat="MMM yyyy"
                showMonthYearPicker
                showFullMonthYearPicker
                showFourColumnMonthYearPicker
                className="bg-[#0f1525] text-white rounded px-2 py-1  text-center border border-gray-600 focus:ring-[#00d9ff] w-[200px]"
                calendarClassName="bg-[#1e2636] text-white border border-[#00d9ff]"
              />
            </div>
          </div>

          {/* Siatka kalendarza */}
          <div className="max-w-6xl mx-auto bg-[#1e2636] rounded-lg shadow  mb-4 overflow-x-auto border-2 border-gray-700">
            <div className="grid grid-cols-7 gap-px bg-[#454d5a]">
              {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"].map((d, i) => (
                <div
                  key={i}
                  className="bg-[#0f1525] text-center py-2 font-bold text-[#00d9ff]"
                >
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const dayISO = day.toISODate();
                const dayReservations = dayISO
                  ? reservationsByDay[dayISO] || []
                  : [];
                const totalPeople = dayReservations.reduce(
                  (sum, r) => sum + (r.people || 0),
                  0
                );
                return (
                  <div
                    onClick={() => dayISO && setDayModal({ date: dayISO })}
                    key={dayISO ?? day.toString()}
                    className={`bg-[#0f1525] min-h-[70px] p-2 border border-[#454d5a]  flex flex-col items-left justify-start transition
                    ${day.month !== calendarMonth ? "opacity-30" : ""}
                    ${
                      dayISO === today_2.toISODate()
                        ? "ring-2 z-10 rounded ring-[#00d9ff]"
                        : ""
                    }
                    hover:bg-[#222b3a] cursor-pointer
                  `}
                  >
                    <div className="font-bold ml-1">{day.day}</div>
                    <div className="flex flex-col items-left ml-1 mt-1 gap-1">
                      <span className="text-s text-[#00d9ff] font-semibold flex items-center gap-1">
                        <FaUserFriends className="inline-block text-gray-400" />{" "}
                        {totalPeople}
                      </span>
                      <span className="text-s text-green-400 font-semibold flex items-center gap-1">
                        <FaCheckCircle className="inline-block text-gray-400" />{" "}
                        {dayReservations.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Szybka zmiana miesiąca */}
          <div className="max-w-6xl mx-auto flex justify-center mb-4 gap-4">
            <button
              className="px-4 py-2 rounded bg-[#222b3a] text-gray-400 font-bold hover:bg-[#00d9ff] hover:text-black transition"
              onClick={() =>
                setCalendarMonthDate(
                  DateTime.fromJSDate(calendarMonthDate)
                    .minus({ months: 1 })
                    .startOf("month")
                    .toJSDate()
                )
              }
            >
              Poprzedni miesiąc
            </button>
            <button
              className="px-4 py-2 rounded bg-[#222b3a] text-gray-400 font-bold hover:bg-[#00d9ff] hover:text-black transition"
              onClick={() =>
                setCalendarMonthDate(
                  DateTime.fromJSDate(calendarMonthDate)
                    .plus({ months: 1 })
                    .startOf("month")
                    .toJSDate()
                )
              }
            >
              Następny miesiąc
            </button>
          </div>
        </>
      )}

      {subpage === "settings" && (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <h1 className="text-2xl font-bold mb-2">Ustawienia rezerwacji</h1>
          <div className="bg-[#1e2636] rounded-lg shadow p-6 flex flex-col gap-6 max-w-md mx-auto">
            <div>
              <label className="font-semibold block mb-1">
                Liczba działających stanowisk VR
              </label>
              <input
                type="number"
                min={0}
                max={8}
                value={editSettings ? tempSettings.stations : settings.stations}
                disabled={!editSettings}
                onChange={(e) =>
                  setTempSettings((s) => ({
                    ...s,
                    stations: Number(e.target.value),
                  }))
                }
                className="p-2 rounded bg-[#0f1525] border border-gray-600 text-white w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">
                Liczba działających siedzeń (symulatorów)
              </label>
              <input
                type="number"
                min={0}
                max={2}
                value={editSettings ? tempSettings.seats : settings.seats}
                disabled={!editSettings}
                onChange={(e) =>
                  setTempSettings((s) => ({
                    ...s,
                    seats: Number(e.target.value),
                  }))
                }
                className="p-2 rounded bg-[#0f1525] border border-gray-600 text-white w-full"
              />
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {!editSettings ? (
                <button
                  className="bg-[#00d9ff] text-black font-bold px-6 py-2 rounded shadow hover:bg-[#ffcc00] transition"
                  onClick={() => {
                    setEditSettings(true);
                    setTempSettings(settings);
                  }}
                >
                  Edytuj
                </button>
              ) : (
                <>
                  <button
                    className="bg-[#00d9ff] text-black font-bold px-6 py-2 rounded shadow hover:bg-[#ffcc00] transition"
                    onClick={() => {
                      setSettings(tempSettings);
                      setEditSettings(false);
                    }}
                  >
                    Zapisz
                  </button>
                  <button
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-2 rounded shadow transition"
                    onClick={() => setEditSettings(false)}
                  >
                    Wróć
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE */}
      {/* MODAL INFORMACJI */}
      {infoModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setInfoModal(null)}
        >
          <div
            className="bg-[#1e2636] rounded-lg p-8 shadow-lg min-w-[350px] max-w-[95vw] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">
              Szczegóły rezerwacji{" "}
              <span className="text-[#00d9ff]">#{infoModal.id}</span>
            </h2>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Status:</span>{" "}
              <span className="text-green-400">Zaakceptowana</span>
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Termin:</span>{" "}
              {DateTime.fromISO(infoModal.reservationDate)
                .setLocale("pl")
                .toFormat("cccc, d LLLL yyyy")}
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Godzina:</span>{" "}
              {DateTime.fromISO(infoModal.reservationDate).toFormat("HH:mm")} -{" "}
              {DateTime.fromISO(infoModal.reservationDate)
                .plus({ minutes: infoModal.duration })
                .toFormat("HH:mm")}
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Czas trwania:</span>{" "}
              {infoModal.duration} min
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Rezerwujący:</span>{" "}
              {infoModal.firstName} {infoModal.lastName}
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Telefon:</span> {infoModal.phone}
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">E-mail:</span> {infoModal.email}
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Liczba osób:</span> {infoModal.people}
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Data utworzenia:</span>{" "}
              {DateTime.fromISO(infoModal.createdAt).toFormat(
                "yyyy-LL-dd HH:mm:ss"
              )}
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Kto stworzył:</span>{" "}
              {infoModal.whoCreated}
            </div>
            <div className="mb-2 border-b border-gray-700 pb-2">
              <span className="font-bold">Usługa:</span> {infoModal.service}
            </div>
            <div className="flex gap-4 mt-6">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold">
                Edytuj
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold"
                onClick={() => setInfoModal(null)}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL POTWIERDZENIA USUWANIA */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="bg-[#1e2636] border-1 border-red-500 rounded-lg p-8 shadow-lg min-w-[320px] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">
              Czy na pewno chcesz usunąć tę rezerwację?
            </h2>
            <div className="flex gap-4 justify-end">
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                onClick={() => setDeleteModal(null)}
              >
                Anuluj
              </button>
              <button
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded font-bold"
                onClick={() => {
                  handleDelete(deleteModal.id);
                  setDeleteModal(null);
                }}
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      {dayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDayModal(null)}
        >
          <div
            className="bg-[#1e2636] rounded-lg p-6 shadow-lg min-w-[350px] max-w-[98vw] w-4xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pasek nagłówka */}
            <div className="flex justify-between items-center mb-4">
              {/* Lewa: data + strzałki */}
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded bg-gray-600 text-white hover:bg-[#00d9ff] hover:text-black"
                  onClick={() =>
                    setDayModal({
                      ...dayModal,
                      date:
                        DateTime.fromISO(dayModal.date || "")
                          .minus({ days: 1 })
                          .toISODate() || "",
                    })
                  }
                >
                  {"<"}
                </button>
                <span className="text-xl font-bold">
                  {DateTime.fromISO(dayModal.date)
                    .setLocale("pl")
                    .toFormat("cccc, d LLLL yyyy")}
                </span>
                <button
                  className="p-2 mr-4 lg:mr-0 rounded bg-gray-600 text-white hover:bg-[#00d9ff] hover:text-black"
                  onClick={() =>
                    setDayModal({
                      ...dayModal,
                      date:
                        DateTime.fromISO(dayModal.date || "")
                          .plus({ days: 1 })
                          .toISODate() || "",
                    })
                  }
                >
                  {">"}
                </button>
              </div>
              {/* Prawa: statystyki + suwak */}
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-[#00d9ff] font-bold">
                  <FaUserFriends /> {dayStats.people}
                </span>
                <span className="flex items-center gap-1 text-green-400 font-bold">
                  <FaCheckCircle /> {dayStats.count}
                </span>
                <label className="flex items-center cursor-pointer select-none ml-2">
                  <span className="mr-2 text-sm text-gray-300">
                    Ukryj wolne
                  </span>
                  <span className="relative">
                    <input
                      type="checkbox"
                      checked={hideFree}
                      onChange={() => setHideFree((v) => !v)}
                      className="sr-only peer"
                    />
                    <span className="w-10 h-6 bg-gray-600 rounded-full shadow-inner peer-checked:bg-green-500 transition-colors block"></span>
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></span>
                  </span>
                </label>
              </div>
            </div>
            {/* Filtr typów */}
            <div className="flex items-center gap-2 mb-4">
              <select
                value={modalServiceFilter}
                onChange={(e) => setModalServiceFilter(e.target.value)}
                className="bg-[#0f1525] text-white rounded px-2 py-1 border border-gray-600 focus:ring-[#00d9ff]"
              >
                <option value="">Wszystkie</option>
                <option value="Stanowisko VR">Stanowisko VR</option>
                <option value="Symulator VR - 1 osoba">Symulator 1 os</option>
                <option value="Symulator VR - 2 osoby">Symulator 2 os</option>
              </select>
              <button
                className="px-3 py-1 rounded bg-pink-800 text-white font-bold hover:bg-pink-600"
                onClick={() => setModalServiceFilter("")}
              >
                Wyczyść filtry
              </button>
            </div>
            {/* Główna siatka godzin */}
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              {modalTimeSlots.map((slot) => {
                const slotReservations = modalReservations.filter(
                  (r) =>
                    DateTime.fromISO(r.reservationDate).toFormat("HH:mm") ===
                    slot
                );

                const slotTime = DateTime.fromISO(`${dayModal.date}T${slot}`);
                const ongoing = modalReservations.filter((r) => {
                  const start = DateTime.fromISO(r.reservationDate);
                  const end = start.plus({ minutes: r.duration });
                  return start < slotTime && end > slotTime;
                });
                const ongoingCount = ongoing.length;
                const ongoingPeople = ongoing.reduce(
                  (sum, r) => sum + (r.people || 0),
                  0
                );
                // Jeśli ukrywasz wolne i nie ma rezerwacji, pomiń
                if (hideFree && slotReservations.length === 0) return null;
                return (
                  <div
                    key={slot}
                    className={`flex items-start gap-4 border-b border-gray-700 py-2
                      ${ongoingCount > 0 ? "bg-[#2a3a4d]" : ""}`}
                  >
                    <div className="min-w-[60px] text-right text-[#00d9ff] font-bold">
                      {slot}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      {slotReservations.length === 0 ? (
                        <span className="text-gray-500 italic">wolne</span>
                      ) : (
                        slotReservations.map((r) => {
                          const dt = DateTime.fromISO(r.reservationDate);
                          const end = dt.plus({ minutes: r.duration });
                          return (
                            <div
                              key={r.id}
                              className="flex flex-col md:flex-row mr-2 items-center border-y border-gray-700 py-2 gap-2 relative pl-2 text-sm"
                              style={{ fontSize: "0.92em" }}
                            >
                              {/* Pasek kolorowy */}
                              <div
                                className={`absolute left-0 top-0 h-full w-0.5 rounded-l ${getBarColor(
                                  r.service
                                )}`}
                              ></div>
                              {/* Godziny */}
                              <div className="flex flex-col items-center min-w-[110px]">
                                <span className="text-base">
                                  {dt.toFormat("HH:mm")} -{" "}
                                  {end.toFormat("HH:mm")}
                                </span>
                              </div>

                              <div className="flex lg:flex-row flex-col justify-between  mr-1 items-center w-full">
                                {/* Imię i nazwisko + kontakt */}
                                <div className=" flex flex-col">
                                  <span className="font-bold">
                                    {r.firstName} {r.lastName}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1 lg:justify-start justify-center text-gray-300">
                                    <FaUserFriends /> {r.people}
                                    <div className="relative group">
                                      <FaPhone className="cursor-pointer" />
                                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-[#08172c] text-s text-white opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                        {r.phone}
                                      </span>
                                    </div>
                                    <div className="relative group">
                                      <FaEnvelope className="cursor-pointer" />
                                      <span className="absolute  left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-[#08172c] text-s text-white opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                        {r.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {/* Data i czas */}
                                <div className="flex flex-col items-center justify-center ">
                                  <span className="text-gray-300 text-center">
                                    {dt
                                      .setLocale("pl")
                                      .toFormat("cccc, d LLLL yyyy")}
                                  </span>
                                  <span className="text-gray-400 text-xs text-center">
                                    ({r.duration} min)
                                  </span>
                                </div>
                                {/* Usługa */}
                                <div className="min-w-[90px] text-right">
                                  {r.service}
                                </div>
                              </div>

                              {/* Akcje */}
                              <div className="flex gap-2">
                                <button
                                  className="bg-red-800 hover:bg-red-600 text-white p-2 rounded"
                                  title="Usuń rezerwację"
                                  onClick={() => setDeleteModal({ id: r.id })}
                                >
                                  <FaTrash />
                                </button>
                                <button
                                  className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded"
                                  title="Informacje"
                                  onClick={() => setInfoModal(r)}
                                >
                                  <FaInfoCircle />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                      {ongoingCount > 0 && (
                        <div className="mt-2 text-xs text-center text-yellow-400 font-semibold">
                          {ongoingCount} trwająca rezerwacja na {ongoingPeople}{" "}
                          {ongoingPeople === 1 ? "osobę" : "osoby"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Zamknij */}
            <div className="flex justify-end mt-4">
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold"
                onClick={() => setDayModal(null)}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminReservations;
