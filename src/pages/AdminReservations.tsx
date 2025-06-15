// Reservation management page for admin users
// This page allows admin users to manage reservations, view statistics, and configure settings.
// It includes features like adding, editing, deleting reservations, and viewing them in a calendar format.
// It also provides a chart to visualize reservation data over time.

// Import necessary libraries and components
import React, { useEffect, useState, useRef, useImperativeHandle } from "react";
import { DateTime } from "luxon";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
  reservationsAtom,
  addReservationAtom,
  updateReservationAtom,
  deleteReservationAtom,
  setupReservationsPollingAtom,
} from "../store/store";
import {
  settingsAtom,
  setupSettingsPollingAtom,
  updateSettingsAtom,
} from "../store/settings";
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

type SubpageType = "main" | "calendar" | "settings" | "add" | "edit" | "search";

const AdminReservations: React.FC = () => {
  const settings = useAtomValue(settingsAtom); // Get current settings from the atom
  const [editSettings, setEditSettings] = useState(false); // State to toggle settings edit mode
  const [tempSettings, setTempSettings] = useState(settings); // Temporary settings for editing
  const [subpage, setSubpage] = useState<SubpageType>("main"); // Current subpage state
  const [previousSubpage, setPreviousSubpage] = useState<SubpageType>("main"); // Previous subpage for navigation
  const [reservations] = useAtom(reservationsAtom); // Get reservations from the atom
  const [tab, setTab] = useState<"today" | "week">("today"); // Current tab state for reservations view
  const [search, setSearch] = useState(""); // Search term for filtering reservations
  const [headerSearch, setHeaderSearch] = useState(""); // Search term for header search input
  const [searchResults, setSearchResults] = useState<any[]>([]); // Search results for header search
  const [serviceFilter, setServiceFilter] = useState<string>(""); // Filter for services in reservations
  const [dateFrom, setDateFrom] = useState(DateTime.now().startOf("day")); // Start date for filtering reservations
  const [dateTo, setDateTo] = useState(
    DateTime.now().plus({ days: 6 }).endOf("day")
  ); // End date for filtering reservations
  const [selectedWeekDay, setSelectedWeekDay] = useState(
    DateTime.now().plus({ days: 1 }).toISODate()
  ); // Selected day for week view
  const [infoModal, setInfoModal] = useState<null | any>(null); // Modal state for reservation info
  const [cancelledCount, setCancelledCount] = useState(0); // Count of cancelled reservations, initialized to 0 for demo purposes
  const [deleteModal, setDeleteModal] = useState<{ id: string } | null>(null); // Modal state for deleting reservations
  const [showFuture, setShowFuture] = useState(true); // State to show future reservations in the today tab

  const [chartType, setChartType] = useState<"general" | "reservations">(
    "reservations"
  ); // Type of chart to display, either general or reservations
  const [chartDetail, setChartDetail] = useState<string>("all"); // Detail level for reservations chart, can be 'all', 'vr', 'sim1', or 'sim2'

  const today_2 = DateTime.now(); // Current date and time using Luxon
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(
    today_2.startOf("month").toJSDate()
  ); // State for the currently displayed month in the calendar

  const [dayModal, setDayModal] = useState<null | { date: string }>(null); // Modal state for displaying reservations on a specific day
  const [modalServiceFilter, setModalServiceFilter] = useState(""); // Filter for services in the day modal
  const [hideFree, setHideFree] = useState(false); // State to hide free slots in the day modal
  const [editReservation, setEditReservation] = useState<any | null>(null); // State for editing a reservation

  // --- ATOMY CRUD ---
  const setUpdateReservation = useSetAtom(updateReservationAtom); // Atom to update a reservation
  const setDeleteReservation = useSetAtom(deleteReservationAtom); // Atom to delete a reservation
  const setupReservationsPolling = useSetAtom(setupReservationsPollingAtom); // Atom to set up polling for reservations
  const setupSettingsPolling = useSetAtom(setupSettingsPollingAtom); // Atom to set up polling for settings
  const setUpdateSettings = useSetAtom(updateSettingsAtom); // Atom to update settings

  // --- POPUP's ---
  type PopupType = "add" | "delete" | "edit";
  const [popup, setPopup] = useState<{
    type: PopupType;
    message: string;
  } | null>(null);

  // FUnction to show popup messages
  function showPopup(type: PopupType) {
    if (type === "add") setPopup({ type, message: "Dodano rezerwację!" });
    if (type === "delete") setPopup({ type, message: "Usunięto rezerwację!" });
    if (type === "edit") setPopup({ type, message: "Zedytowano rezerwację!" });
    setTimeout(() => setPopup(null), 3000);
  }

  // --- Pooling settings ---
  useEffect(() => {
    // Setup polling for reservations every 30 seconds
    const stopReservationsPolling = setupReservationsPolling(30000);
    console.log("Uruchomiono polling rezerwacji w ADMIN RESERVATIONS");

    // Setup polling for settings every 60 seconds
    const stopSettingsPolling = setupSettingsPolling(60000);
    console.log("Uruchomiono polling ustawień w ADMIN RESERVATIONS");

    return () => {
      // Cleanup polling on component unmount
      stopReservationsPolling();
      stopSettingsPolling();
      console.log("Zatrzymano polling rezerwacji w ADMIN RESERVATIONS");
      console.log("Zatrzymano polling ustawień w ADMIN RESERVATIONS");
    };
  }, [setupReservationsPolling, setupSettingsPolling]);

  // Define a function to handle reservation deletion
  useEffect(() => {
    if (!editSettings) setTempSettings(settings);
  }, [settings, editSettings]);

  // Reserbations for the day modal
  const modalReservationsAll = dayModal
    ? reservations.filter(
        (r) => DateTime.fromISO(r.reservationDate).toISODate() === dayModal.date
      )
    : [];

  // Filter reservations by service in the day modal
  const modalReservations = modalServiceFilter
    ? modalReservationsAll.filter((r) => r.service === modalServiceFilter)
    : modalReservationsAll;

  // Statistics for the day modal
  const dayStats = {
    people: modalReservationsAll.reduce((sum, r) => sum + (r.people || 0), 0),
    count: modalReservationsAll.length,
  };

  // Get time slots for the day modal
  let modalTimeSlots: string[] = [];
  if (dayModal) {
    const date = DateTime.fromISO(dayModal.date);
    const isSunday = date.weekday === 7;
    const isSimulator =
      modalServiceFilter === "Symulator VR - 1 osoba" ||
      modalServiceFilter === "Symulator VR - 2 osoby";

    if (isSimulator) {
      // Simulator slots: 15 minutes, 10:00-19:45 on Sunday, 9:00-20:45 on other days
      const startHour = isSunday ? 10 : 9;
      const endHour = isSunday ? 19 : 20;
      const endMinute = 45;
      let t = date.set({ hour: startHour, minute: 0 });
      const end = date.set({ hour: endHour, minute: endMinute });
      while (t <= end) {
        modalTimeSlots.push(t.toFormat("HH:mm"));
        t = t.plus({ minutes: 15 });
      }
    } else {
      // VR station slots: 30 minutes, 10:00-19:30 on Sunday, 9:00-20:30 on other days
      // add 15-minute slots if there is a simulator at that time
      const startHour = isSunday ? 10 : 9;
      const endHour = isSunday ? 19 : 20;
      const endMinute = isSunday ? 30 : 30;
      let t = date.set({ hour: startHour, minute: 0 });
      const end = date.set({ hour: endHour, minute: endMinute });

      // Get all simulator times for the day
      const simTimes = modalReservationsAll
        .filter((r) => r.service.startsWith("Symulator"))
        .map((r) => DateTime.fromISO(r.reservationDate).toFormat("HH:mm"));

      while (t <= end) {
        modalTimeSlots.push(t.toFormat("HH:mm"));
        // Add 15-minute slot if it matches a simulator time
        const next15 = t.plus({ minutes: 15 }).toFormat("HH:mm");
        if (simTimes.includes(next15) && !modalTimeSlots.includes(next15)) {
          modalTimeSlots.push(next15);
        }
        t = t.plus({ minutes: 30 });
      }
      // Sort and remove duplicates
      modalTimeSlots = Array.from(new Set(modalTimeSlots)).sort();
    }
  }

  // Get the current month and year for the calendar
  const calendarMonth = DateTime.fromJSDate(calendarMonthDate).month;
  const calendarYear = DateTime.fromJSDate(calendarMonthDate).year;

  // Get days to show in the calendar
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

  // Filter reservations based on search and service filter
  const filteredCalendarReservations = serviceFilter
    ? reservations.filter((r) => r.service === serviceFilter)
    : reservations;

  // Reservations mapped by day for the calendar
  const reservationsByDay: Record<string, typeof reservations> = {};
  filteredCalendarReservations.forEach((r) => {
    const day = DateTime.fromISO(r.reservationDate).toISODate();
    if (day) {
      if (!reservationsByDay[day]) reservationsByDay[day] = [];
      reservationsByDay[day].push(r);
    }
  });

  // Filter reservations based on search and service filter
  const filtered = reservations.filter((r) => {
    const matchesSearch = `${r.firstName} ${r.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesService = serviceFilter ? r.service === serviceFilter : true;
    return matchesSearch && matchesService;
  });

  // Count cancelled reservations
  const filteredForStats = reservations.filter((r) => {
    const dt = DateTime.fromISO(r.reservationDate);
    const inRange = dt >= dateFrom && dt <= dateTo;
    return inRange;
  });
  const statAll = filteredForStats.length;
  const statAccepted = filteredForStats.length - cancelledCount;
  const statCancelled = cancelledCount;
  const statNewClients = new Set(
    filteredForStats.map(
      (r) =>
        `${(r.firstName || "").trim().toLowerCase()}|${(r.lastName || "")
          .trim()
          .toLowerCase()}`
    )
  ).size;

  // Prepare data for the chart
  const daysInRange = [];
  let dt = dateFrom.startOf("day");
  while (dt <= dateTo.endOf("day")) {
    daysInRange.push(dt);
    dt = dt.plus({ days: 1 });
  }

  // Data for the chart, filtered by date range
  const chartFiltered = reservations.filter((r) => {
    const dt = DateTime.fromISO(r.reservationDate);
    return dt >= dateFrom && dt <= dateTo;
  });

  // Process chart datasets based on selected type and detail
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

  // Prepare chart data object
  const chartData = {
    labels: daysInRange.map((d) => d.toFormat("yyyy-LL-dd")),
    datasets: chartDatasets,
  };

  // Reservations for today
  const today = DateTime.now().toISODate();
  const now = DateTime.now();
  const todayReservations = filtered.filter(
    (r) =>
      DateTime.fromISO(r.reservationDate).toISODate() === today &&
      (!showFuture || DateTime.fromISO(r.reservationDate) >= now)
  );

  const getWeekDates = (start: DateTime) =>
    Array.from({ length: 7 }, (_, i) => start.plus({ days: i }));

  // Reservations for the week view
  const weekStart = DateTime.now().plus({ days: 1 }).startOf("day");
  const weekDates = getWeekDates(weekStart);

  const weekReservations = (dateISO: string) =>
    filtered.filter(
      (r) => DateTime.fromISO(r.reservationDate).toISODate() === dateISO
    );

  // Deleting a reservation using api
  const handleDelete = async (id: string) => {
    await setDeleteReservation(id);
    setCancelledCount((prev) => prev + 1);
    showPopup("delete");
  };

  // Color of the bar in the chart based on service type
  const getBarColor = (service: string) => {
    if (service === "Stanowisko VR") return "bg-[#00d9ff]";
    if (service.startsWith("Symulator")) return "bg-red-600";
    return "bg-gray-400";
  };

  // Function to handle going to the add reservation page
  const handleGoToAdd = () => {
    setPreviousSubpage(subpage);
    setSubpage("add");
  };

  // Function to handle going back from the add reservation page
  const handleBackFromAdd = () => {
    setSubpage(previousSubpage);
  };
  // Function to handle search from the header
  const handleHeaderSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Filter reservations based on the header search input
      const results = reservations.filter((r) => {
        const searchTerm = headerSearch.toLowerCase().trim();
        if (!searchTerm) return false;

        // Check if any of the fields contain the search term
        return (
          (r.firstName?.toLowerCase() || "").includes(searchTerm) ||
          (r.lastName?.toLowerCase() || "").includes(searchTerm) ||
          (r.email?.toLowerCase() || "").includes(searchTerm) ||
          (r.phone?.toLowerCase() || "").includes(searchTerm) ||
          (r.whoCreated?.toLowerCase() || "").includes(searchTerm)
        );
      });

      // Set the search results
      setSearchResults(results);

      // Save the current subpage to return later, but only if we're not already on the search page
      if (subpage !== "search") {
        setPreviousSubpage(subpage);
      }

      // Go to the search subpage
      setSubpage("search");
    }
  };

  // Add a reference for the add reservation form
  const addFormRef = useRef<null | { submitForm: () => void }>(null);

  // --- MAIN NAVIGATION PANEL ---
  return (
    <section className="bg-[#0f1525] text-white px-2 py-8 min-h-screen">
      {/* NAV */}
      <div className="max-w-6xl mx-auto flex flex-col gap-4 mb-6">
        {/* ICONS SEARCH ADD */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          {/* SUBPAGE ICONS ON LEFT */}
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
          {/* SEARCH IN THE MIDDLE */}
          <div className="flex flex-1 justify-center w-full max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Wyszukaj rezerwacje..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={handleHeaderSearch}
                className="w-full p-2 pl-10 rounded bg-[#0f1525] border border-gray-600 text-white"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {/* ADD RESERVATION ON RIGHT */}
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

      {/* SUBPAGES */}

      {/* ADD */}
      {subpage === "add" && (
        <div className="max-w-6xl mx-auto bg-[#1e2636] rounded-lg shadow p-8 mt-4">
          <h2 className="text-2xl font-bold mb-6 text-white">
            Dodaj rezerwację
          </h2>
          <AdminAddReservationFormWithRef
            ref={addFormRef}
            onSuccess={() => {
              handleBackFromAdd();
              showPopup("add");
            }}
            onCancel={handleBackFromAdd}
          />
        </div>
      )}

      {/* EDIT */}
      {subpage === "edit" && editReservation && (
        <div className="max-w-6xl mx-auto bg-[#1e2636] rounded-lg shadow p-8 mt-4">
          <h2 className="text-2xl font-bold mb-6 text-white">
            Edytuj rezerwację
          </h2>
          <AdminEditReservationForm
            reservation={editReservation}
            onCancel={() => {
              setSubpage(previousSubpage);
              setEditReservation(null);
            }}
            onSave={(updated) => {
              // Update the reservation atom with the edited reservation
              setUpdateReservation({ id: updated.id, reservation: updated });
              setSubpage(previousSubpage);
              setEditReservation(null);
              showPopup("edit");
            }}
          />
        </div>
      )}

      {/* MAIN */}
      {subpage === "main" && (
        <>
          {/* Title and datapicker */}
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
          {/* chart + tiles */}
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
                {/* Type of chart select */}
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
                {/* Details selection */}
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

          {/* Switch view */}
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

          {/* Filters */}
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

          {/* Reservations for today */}
          {tab === "today" && (
            <div className="max-w-6xl mx-auto bg-[#1e2636] rounded-lg shadow p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Rezerwacje na dziś</h2>
                {/* Previous reservation toggle */}
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
                todayReservations
                  .slice()
                  .sort(
                    (a, b) =>
                      DateTime.fromISO(a.reservationDate).toMillis() -
                      DateTime.fromISO(b.reservationDate).toMillis()
                  )
                  .map((r) => {
                    const dt = DateTime.fromISO(r.reservationDate);
                    const end = dt.plus({ minutes: r.duration });
                    return (
                      <div
                        key={r.id}
                        className="flex flex-col md:flex-row items-center border-y border-gray-700 py-4 gap-4 relative pl-4"
                      >
                        {/* Color */}
                        <div
                          className={`absolute left-0 top-0 h-full w-1 rounded-l ${getBarColor(
                            r.service
                          )}`}
                        ></div>
                        {/* Hours */}
                        <div className="flex flex-col items-center min-w-[110px]">
                          <span className="text-base">
                            {dt.toFormat("HH:mm")} - {end.toFormat("HH:mm")}
                          </span>
                        </div>
                        {/* First, Lastname, contact */}
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
                        {/* Date and time */}
                        <div className="flex flex-col items-center justify-center min-w-[180px] lg:mr-20">
                          <span className="text-gray-300 text-center">
                            {dt.setLocale("pl").toFormat("cccc, d LLLL yyyy")}
                          </span>
                          <span className="text-gray-400 text-sm text-center">
                            ({r.duration} min)
                          </span>
                        </div>
                        {/* Service */}
                        <div className=" min-w-[120px] text-right lg:mr-20">
                          {r.service}
                        </div>
                        {/* Actions */}
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

          {/* Reservation for the week */}
          {tab === "week" && (
            <div className="max-w-6xl mx-auto bg-[#1e2636] rounded-lg shadow p-6 mt-4">
              <h2 className="text-xl font-bold mb-4">
                Rezerwacje na najbliższy tydzień
              </h2>
              {/* Dates */}
              <div className="flex gap-2 mb-4 overflow-x-auto">
                {weekDates.map((d) => (
                  <button
                    key={d.toISODate()}
                    className={`px-4 py-2 rounded ${
                      selectedWeekDay === d.toISODate()
                        ? "bg-[#00d9ff] text-black font-bold"
                        : "bg-[#181f2c] text-gray-400 hover:bg-[#454d5a]"
                    }`}
                    onClick={() => setSelectedWeekDay(d.toISODate() ?? "")}
                  >
                    {d.setLocale("pl").toFormat("cccc, dd.LL")}
                  </button>
                ))}
              </div>
              {/* List of reservations for the choosen date */}
              {weekReservations(selectedWeekDay).length === 0 ? (
                <div className="text-gray-400">
                  Brak rezerwacji na ten dzień...
                </div>
              ) : (
                weekReservations(selectedWeekDay)
                  .slice()
                  .sort(
                    (a, b) =>
                      DateTime.fromISO(a.reservationDate).toMillis() -
                      DateTime.fromISO(b.reservationDate).toMillis()
                  )
                  .map((r) => {
                    const dt = DateTime.fromISO(r.reservationDate);
                    const end = dt.plus({ minutes: r.duration });
                    return (
                      <div
                        key={r.id}
                        className="flex flex-col md:flex-row items-center justify-between border-b border-gray-700 py-4 gap-4 relative pl-4"
                      >
                        {/* Color */}
                        <div
                          className={`absolute left-0 top-0 h-full w-1 rounded-l ${getBarColor(
                            r.service
                          )}`}
                        ></div>
                        {/* Hours */}
                        <div className="flex flex-col items-center min-w-[110px]">
                          <span className="text-base">
                            {dt.toFormat("HH:mm")} - {end.toFormat("HH:mm")}
                          </span>
                        </div>
                        {/* First, Last name and contact */}
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
                        {/* Date and time */}
                        <div className="flex flex-col items-center justify-center min-w-[180px] lg:mr-20">
                          <span className="text-gray-300 text-center">
                            {dt.setLocale("pl").toFormat("cccc, d LLLL yyyy")}
                          </span>
                          <span className="text-gray-400 text-sm text-center">
                            ({r.duration} min)
                          </span>
                        </div>
                        {/* Service */}
                        <div className="min-w-[120px] text-right lg:mr-20">
                          {r.service}
                        </div>
                        {/* Actions */}
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

      {/* CALENDAR */}
      {subpage === "calendar" && (
        <>
          {/* Selecting month and day */}
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

          {/* Calendar grid */}
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
          {/* quick change of the month */}
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

      {/* SETTINGS */}
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
                  {" "}
                  <button
                    className="bg-[#00d9ff] text-black font-bold px-6 py-2 rounded shadow hover:bg-[#ffcc00] transition"
                    onClick={async () => {
                      try {
                        await setUpdateSettings(tempSettings);
                        setEditSettings(false);
                        // Show success popup
                        showPopup("edit");
                      } catch (error) {
                        console.error(
                          "Błąd podczas aktualizacji ustawień:",
                          error
                        );
                        alert(
                          "Nie udało się zaktualizować ustawień. Spróbuj ponownie."
                        );
                      }
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

      {/* SEARCH RESULT*/}
      {subpage === "search" && (
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Wyniki wyszukiwania: "{headerSearch}"
            </h2>
            <span className="text-gray-400">
              Znaleziono {searchResults.length} rezerwacji
            </span>
          </div>

          <div className="bg-[#1e2636] rounded-lg shadow p-6 mt-4">
            {searchResults.length === 0 ? (
              <div className="text-gray-400">
                Nie znaleziono pasujących rezerwacji...
              </div>
            ) : (
              searchResults
                .slice()
                .sort(
                  (a, b) =>
                    DateTime.fromISO(b.reservationDate).toMillis() -
                    DateTime.fromISO(a.reservationDate).toMillis()
                )
                .map((r) => {
                  const dt = DateTime.fromISO(r.reservationDate);
                  const end = dt.plus({ minutes: r.duration });
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col md:flex-row items-center border-y border-gray-700 py-4 gap-4 relative pl-4"
                    >
                      {/* Color */}
                      <div
                        className={`absolute left-0 top-0 h-full w-1 rounded-l ${getBarColor(
                          r.service
                        )}`}
                      ></div>
                      {/* Hours */}
                      <div className="flex flex-col items-center min-w-[110px]">
                        <span className="text-base">
                          {dt.toFormat("HH:mm")} - {end.toFormat("HH:mm")}
                        </span>
                      </div>
                      {/* First, Last Name and contact */}
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
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-[#08172c] text-s text-white opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                              {r.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Date and time */}
                      <div className="flex flex-col items-center justify-center min-w-[180px] lg:mr-20">
                        <span className="text-gray-300 text-center">
                          {dt.setLocale("pl").toFormat("cccc, d LLLL yyyy")}
                        </span>
                        <span className="text-gray-400 text-sm text-center">
                          ({r.duration} min)
                        </span>
                      </div>
                      {/* Service */}
                      <div className="min-w-[120px] text-right lg:mr-20">
                        {r.service}
                      </div>
                      {/* Actions */}
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

            {/* Return button */}
            <div className="flex justify-center mt-8">
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-2 rounded shadow transition"
                onClick={() => {
                  setSubpage(previousSubpage);
                  setHeaderSearch(""); // Czyszczenie pola wyszukiwania
                }}
              >
                Wróć
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* INFORMATION MODAL */}
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
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
                onClick={() => {
                  setInfoModal(null);
                  setDeleteModal(null);
                  setDayModal(null);
                  setEditReservation(infoModal);
                  setPreviousSubpage(subpage);
                  setSubpage("edit");
                }}
              >
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

      {/* AOOROVE DELETION MODAL */}
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

      {/* DAY MODAL */}
      {dayModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDayModal(null)}
        >
          <div
            className="bg-[#1e2636] rounded-lg p-6 shadow-lg min-w-[350px] max-w-[98vw] w-4xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nav */}
            <div className="flex justify-between items-center mb-4">
              {/* LEFT: DATE and arrows */}
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
              {/* RIGHT: STATISTICS AND TOGGLE */}
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
            {/* FILTER OF TYPES */}
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
            {/* MAIN GRID FOR HOURS */}
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              {modalTimeSlots.map((slot) => {
                const slotReservations = modalReservations.filter(
                  (r) =>
                    DateTime.fromISO(r.reservationDate).toFormat("HH:mm") ===
                    slot
                );

                const slotTime = DateTime.fromISO(
                  `${dayModal.date}T${slot}`
                ).startOf("minute");
                const ongoing = modalReservations.filter((r) => {
                  const start = DateTime.fromISO(r.reservationDate).startOf(
                    "minute"
                  );
                  const end = start
                    .plus({ minutes: r.duration })
                    .startOf("minute");
                  return start < slotTime && slotTime < end;
                });
                const ongoingCount = ongoing.length;
                const ongoingPeople = ongoing.reduce(
                  (sum, r) => sum + (r.people || 0),
                  0
                );
                // if you hide "wolne", and there is no reservations -> skip this slot
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
                              className="flex bg-[#1e2636] flex-col md:flex-row  items-center border-y border-gray-700 py-2 gap-2 relative pl-2 mr-2 pr-2 text-sm"
                              style={{ fontSize: "0.92em" }}
                            >
                              {/* Color */}
                              <div
                                className={`absolute left-0 top-0 h-full w-0.5 rounded-l ${getBarColor(
                                  r.service
                                )}`}
                              ></div>
                              {/* Hours */}
                              <div className="flex flex-col items-center min-w-[110px]">
                                <span className="text-base">
                                  {dt.toFormat("HH:mm")} -{" "}
                                  {end.toFormat("HH:mm")}
                                </span>
                              </div>

                              <div className="flex lg:flex-row flex-col justify-between  mr-1 items-center w-full">
                                {/* Firs, LastName and contact */}
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
                                {/* Date and time */}
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
                                {/* Service */}
                                <div className="min-w-[90px] text-right">
                                  {r.service}
                                </div>
                              </div>

                              {/* Actions */}
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
            {/* Close */}
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

      {/* NOTIFICATION POPUP */}
      {popup && (
        <>
          <div
            className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[200] px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 text-white text-lg font-bold animate-popup-in-out ${
              popup.type === "add"
                ? "bg-green-600"
                : popup.type === "delete"
                ? "bg-red-700"
                : "bg-orange-500"
            }`}
            style={{
              minWidth: 260,
              transition: "all 0.4s cubic-bezier(.4,2,.6,1)",
            }}
          >
            {popup.type === "add" && (
              <FaCheckCircle className="text-xl text-white" />
            )}
            {popup.type === "delete" && (
              <FaTrash className="text-xl text-white" />
            )}
            {popup.type === "edit" && (
              <FaSlidersH className="text-xl text-white" />
            )}
            <span>{popup.message}</span>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminReservations;

type AdminAddReservationFormHandle = { submitForm: () => void };

// desribe: Adding a reservation form for admin with forwardRef
// --- FORWARD REF FOR FORM ---
const AdminAddReservationForm = (
  { onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void },
  ref: React.Ref<AdminAddReservationFormHandle>
) => {
  const [firstName, setFirstName] = React.useState(""); // First name
  const [lastName, setLastName] = React.useState(""); // Last name
  const [email, setEmail] = React.useState(""); // Email
  const [phone, setPhone] = React.useState(""); // Phone number
  const [countryCode, setCountryCode] = React.useState("+48"); // Default country code
  const [service, setService] = React.useState("Stanowisko VR"); // Default service
  const [duration, setDuration] = React.useState("30"); // Default duration
  const [people, setPeople] = React.useState(1); // Default number of people
  const [selectedDate, setSelectedDate] = React.useState(new Date()); // Default selected date
  const [selectedHour, setSelectedHour] = React.useState<string | null>(null); // Selected hour
  const [error, setError] = React.useState<string | null>(null); // Error message
  const [touched, setTouched] = React.useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  }); // Track touched fields
  const reservations = useAtomValue(reservationsAtom); // Get reservations from atom
  const setAddReservation = useSetAtom(addReservationAtom); // Function to add reservation

  // --- Validation ---
  function validateEmail(email: string) {
    if (!email) return true; // for admin form, email is optional
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex
    return regex.test(email);
  }

  // --- Handle form submission ---
  function validateForm() {
    return (
      firstName.trim() &&
      lastName.trim() &&
      validateEmail(email) &&
      phone.trim() &&
      selectedDate &&
      selectedHour
    );
  }

  // --- Handle form submission ---
  React.useEffect(() => {
    if (service === "Symulator VR - 1 osoba") {
      setPeople(1);
      setDuration("15");
    } else if (service === "Symulator VR - 2 osoby") {
      setPeople(2);
      setDuration("15");
    } else {
      setDuration("30");
    }
  }, [service]);

  // --- Generate hour slots based on selected date and service ---
  function generateHourSlots() {
    const date = DateTime.fromJSDate(selectedDate).setZone("Europe/Warsaw");
    const isSunday = date.weekday === 7;
    const isSimulator = service.includes("Symulator");
    const step = isSimulator ? 15 : 30;
    const slots: string[] = [];
    const startHour = isSunday ? (isSimulator ? 10 : 10) : 9;
    const endHour = isSunday ? (isSimulator ? 19 : 19) : 20;
    const endMinute = isSimulator ? 45 : 30;
    let t = date.set({ hour: startHour, minute: 0 });
    const end = date.set({ hour: endHour, minute: endMinute });
    while (t <= end) {
      slots.push(t.toFormat("HH:mm"));
      t = t.plus({ minutes: step });
    }
    return slots;
  }

  // --- Check if selected hour is available ---
  // Get reservations and settings from atoms
  const settings = useAtomValue(settingsAtom);
  function isHourAvailable(hour: string) {
    const dateISO = DateTime.fromJSDate(selectedDate).toISODate();
    const stations = settings.stations;
    const seats = settings.seats;
    // Choose the correct duration based on service, round to minutes
    const slotStart = DateTime.fromJSDate(selectedDate)
      .set({
        hour: Number(hour.split(":")[0]),
        minute: Number(hour.split(":")[1]),
        second: 0,
        millisecond: 0,
      })
      .startOf("minute");

    // Calculate the end of the slot based on duration
    const slotEnd = slotStart
      .plus({ minutes: parseInt(duration) })
      .startOf("minute");

    // Check if the slot is in the future
    const now = DateTime.now().setZone("Europe/Warsaw");
    if (slotStart < now) {
      return false;
    }

    // Check if the reservation fits within opening hours
    const isSunday = DateTime.fromJSDate(selectedDate).weekday === 7;
    const closingHour = isSunday ? 20 : 21; // Close at 8PM on Sunday, 9PM on other days
    const closingTime = DateTime.fromJSDate(selectedDate).set({
      hour: closingHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });

    // If slot ends after closing time, it's not available
    if (slotEnd > closingTime) {
      return false;
    }

    // Get all reservations for the selected date
    const dayReservations = reservations.filter((r: any) =>
      r.reservationDate.startsWith(dateISO)
    );
    if (service === "Stanowisko VR") {
      // Sum of people for all VR stations
      const totalPeople = dayReservations
        .filter((r: any) => r.service === "Stanowisko VR")
        .filter((r: any) => {
          const resStart = DateTime.fromISO(r.reservationDate).startOf(
            "minute"
          );
          const resEnd = resStart
            .plus({ minutes: r.duration })
            .startOf("minute");
          return resStart < slotEnd && slotStart < resEnd;
        })
        .reduce((sum: number, r: any) => sum + (r.people || 0), 0);
      return totalPeople + people <= stations;
    } else if (
      service === "Symulator VR - 1 osoba" ||
      service === "Symulator VR - 2 osoby"
    ) {
      // When the service is a simulator, we need to check the number of seats
      // if there are no seats, return false
      if (seats === 0) {
        return false;
      }

      // For 2 person simulator, we need at least 2 seats
      if (service === "Symulator VR - 2 osoby" && seats < 2) {
        return false;
      }

      // IF the service is a simulator, we need to check if there are any reservations that overlap with the selected slot
      const anySimulator = dayReservations.some((r: any) => {
        if (
          r.service !== "Symulator VR - 1 osoba" &&
          r.service !== "Symulator VR - 2 osoby"
        ) {
          return false;
        }
        const resStart = DateTime.fromISO(r.reservationDate).startOf("minute");
        const resEnd = resStart.plus({ minutes: r.duration }).startOf("minute");
        return resStart < slotEnd && slotStart < resEnd;
      });
      return !anySimulator;
    }
    return true;
  }
  // --- Submit handler ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    if (!validateForm()) {
      setError("Uzupełnij poprawnie wszystkie wymagane pola!");
      return;
    }
    if (!isHourAvailable(selectedHour!)) {
      setError("Wybrana godzina jest już zajęta!");
      return;
    }
    const createdAt = DateTime.now().setZone("Europe/Warsaw").toISO() || "";
    const reservationDateTime =
      DateTime.fromJSDate(selectedDate)
        .set({
          hour: Number(selectedHour!.split(":")[0]),
          minute: Number(selectedHour!.split(":")[1]),
        })
        .toISO() || "";
    const newReservation = {
      // Delete the id field, it will be generated by the backend
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || "salon@goodgamevr.pl",
      phone: `${countryCode}${phone.trim()}`,
      createdAt,
      reservationDate: reservationDateTime,
      service: service as
        | "Stanowisko VR"
        | "Symulator VR - 1 osoba"
        | "Symulator VR - 2 osoby",
      people,
      duration: parseInt(duration),
      whoCreated: "Good Game VR",
      cancelled: false,
    };

    try {
      // Add the new reservation to the atom
      await setAddReservation(newReservation);
      onSuccess();
    } catch (error) {
      setError("Wystąpił błąd podczas dodawania rezerwacji!");
    }
  }

  // --- UI ---
  // Add forwardRef to the component
  const formRef = React.useRef<HTMLFormElement>(null);
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      if (formRef.current) {
        formRef.current.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    },
  }));

  return (
    <form
      ref={formRef}
      className="flex flex-col lg:flex-row gap-6"
      onSubmit={handleSubmit}
    >
      {/* LEFT COLUMN: personal data, service, clients */}
      <div className="flex-1 flex flex-col gap-4 min-w-[260px]">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">
              Imię <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Jan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
              className={`w-full p-2 text-base rounded bg-[#0f1525] border ${
                touched.firstName && !firstName
                  ? "border-red-500"
                  : "border-gray-600"
              } text-white`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">
              Nazwisko <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Kowalski"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
              className={`w-full p-2 text-base rounded bg-[#0f1525] border ${
                touched.lastName && !lastName
                  ? "border-red-500"
                  : "border-gray-600"
              } text-white`}
            />
          </div>
        </div>
        <div className="flex-row">
          <label className="block text-sm font-semibold mb-1">
            Adres email <span className="text-gray-400">(opcjonalnie)</span>
          </label>
          <input
            type="email"
            placeholder="Adres email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={`w-full p-2 text-base rounded bg-[#0f1525] border ${
              touched.email && email && !validateEmail(email)
                ? "border-red-500"
                : "border-gray-600"
            } text-white`}
          />
        </div>
        {touched.email && email && !validateEmail(email) && (
          <p className="text-red-500 text-xs">Wprowadź poprawny adres email</p>
        )}
        <div className="">
          <label className="block text-sm font-semibold mb-1">
            Numer telefonu<span className="text-red-500"> *</span>
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="p-2 text-base rounded bg-[#0f1525] border border-gray-600 text-white w-24"
            >
              <option value="+48">🇵🇱 +48</option>
              <option value="+49">🇩🇪 +49</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+1">🇺🇸 +1</option>
            </select>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Numer telefonu"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              className={`flex-1 p-2 text-base rounded bg-[#0f1525] border ${
                touched.phone && !phone ? "border-red-500" : "border-gray-600"
              } text-white`}
            />
          </div>
        </div>
        {/* Service, time, people */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Wybierz usługę<span className="text-red-500"> *</span>
          </label>
          <select
            className="w-full p-2 text-base rounded bg-[#0f1525] border border-gray-600 text-white"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option>Stanowisko VR</option>
            <option>Symulator VR - 1 osoba</option>
            <option>Symulator VR - 2 osoby</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            Czas trwania<span className="text-red-500"> *</span>
          </label>
          {service === "Stanowisko VR" ? (
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2 text-base rounded bg-[#0f1525] border border-gray-600 text-white"
            >
              <option value="30">
                30 min - 39 zł za osobę (Pon. - Czw.) | 45 zł za osobę (Pt. -
                Niedz.)
              </option>
              <option value="60">
                60 min - 78 zł za osobę (Pon. - Czw.) | 90 zł za osobę (Pt. -
                Niedz.)
              </option>
              <option value="90">
                90 min - 117 zł za osobę (Pon. - Czw.) | 135 zł za osobę (Pt. -
                Niedz.)
              </option>
              <option value="120">
                120 min - 156 zł za osobę (Pon. - Czw.) | 180 zł za osobę (Pt. -
                Niedz.)
              </option>
            </select>
          ) : (
            <input
              type="text"
              disabled
              value="15 min"
              className="w-full p-2 text-base rounded bg-[#1a1a1a] border border-gray-600 text-white"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 mt-1">
            Liczba osób<span className="text-red-500"> *</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPeople((prev: number) => {
                  if (service === "Symulator VR - 1 osoba") return 1;
                  if (service === "Symulator VR - 2 osoby") return 2;
                  return Math.max(1, prev - 1);
                })
              }
              className="bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-2 py-1 rounded text-xs hover:bg-[#1a1a1a]"
              disabled={service !== "Stanowisko VR"}
            >
              –
            </button>
            <span className="text-lg">{people}</span>
            <button
              type="button"
              onClick={() =>
                setPeople((prev: number) => {
                  if (service === "Symulator VR - 1 osoba") return 1;
                  if (service === "Symulator VR - 2 osoby") return 2;
                  return Math.min(8, prev + 1);
                })
              }
              className="bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-2 py-1 rounded text-xs hover:bg-[#1a1a1a]"
              disabled={service !== "Stanowisko VR"}
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {service === "Stanowisko VR" &&
              `Preferowana liczba osób: 1 - ${settings.stations}`}
            {service === "Symulator VR - 1 osoba" &&
              `Preferowana liczba osób: 1 | Dostępne: ${settings.seats}`}
            {service === "Symulator VR - 2 osoby" &&
              `Preferowana liczba osób: 2 | Dostępne: ${settings.seats}`}
          </p>
        </div>
      </div>
      {/* RIGHT COLUMN: date and time */}
      <div className="flex-1 flex flex-col gap-4 min-w-[260px]">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">
              Data rezerwacji<span className="text-red-500"> *</span>
            </label>
            <DatePicker
              locale={pl}
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date!);
                setSelectedHour(null);
              }}
              dateFormat="yyyy-MM-dd"
              className="p-2 text-base rounded bg-[#0f1525] border border-gray-600 text-white w-full"
              calendarClassName="bg-[#1e2636] text-white border border-[#00d9ff]"
            />
          </div>
          {/* Summary */}
          {selectedHour && (
            <div className="flex-1 text-center">
              <div className="bg-[#0f1525] border border-gray-600 rounded p-2.5 text-sm font-semibold text-[#00d9ff]">
                {DateTime.fromJSDate(selectedDate)
                  .setLocale("pl")
                  .toFormat("cccc, d LLLL")}
                , godz. {selectedHour}
              </div>
            </div>
          )}
        </div>
        <div className="">
          <label className="block text-sm font-semibold mb-1">
            Wybierz godzinę<span className="text-red-500"> *</span>
          </label>
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
            {generateHourSlots().map((hour) => {
              const available = isHourAvailable(hour);
              const selected = selectedHour === hour;
              return (
                <button
                  type="button"
                  key={hour}
                  onClick={() => available && setSelectedHour(hour)}
                  className={`flex items-center mr-2 gap-2 px-4 py-2 rounded transition text-left text-base font-medium
              ${
                !available
                  ? "bg-[#1a1a1a] text-gray-600 border border-[rgb(26,26,26)] cursor-not-allowed"
                  : selected
                  ? "bg-[#00d9ff] text-black border border-[#00d9ff]"
                  : "bg-[#0f1525] border border-gray-600 text-white hover:bg-[#00d9ff] hover:text-black"
              }`}
                  disabled={!available}
                >
                  <span className="flex-1">{hour}</span>
                  {selected ? (
                    <FaCheckCircle className="text-black" />
                  ) : (
                    <span className="text-xs">Wybierz</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Actions and error */}
        <div className="flex flex-row gap-2 mt-4 justify-end items-center">
          {error && (
            <div className="bg-red-700 text-white rounded p-3 text-xs font-bold text-center animate-fade-in mr-auto">
              {error}
            </div>
          )}
          <button
            type="button"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded shadow transition text-base"
            onClick={onCancel}
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="bg-[#00d9ff] text-black font-bold px-4 py-2 rounded shadow hover:bg-[#ffcc00] transition text-base"
          >
            Dodaj
          </button>
        </div>
      </div>
    </form>
  );
};

const AdminAddReservationFormWithRef = React.forwardRef(
  AdminAddReservationForm
);

// --- EDIT ---
// Editing a reservation form for admin
const AdminEditReservationForm: React.FC<{
  reservation: any;
  onCancel: () => void;
  onSave: (r: any) => void;
}> = ({ reservation, onCancel, onSave }) => {
  const [firstName, setFirstName] = React.useState(reservation.firstName || ""); // First name
  const [lastName, setLastName] = React.useState(reservation.lastName || ""); // Last name
  const [email, setEmail] = React.useState(reservation.email || ""); // Email
  const [phone, setPhone] = React.useState(() => {
    // If phone is provided, extract the number without the country code
    if (reservation.phone) {
      const match = reservation.phone.match(/^(\+\d{1,3})(.*)$/);
      if (match) {
        return match[2] || "";
      }
      return reservation.phone;
    }
    return "";
  }); // Phone number
  const [countryCode, setCountryCode] = React.useState(() => {
    if (reservation.phone) {
      const match = reservation.phone.match(/^(\+\d{1,3})/);
      if (match) return match[1];
    }
    return "+48";
  }); // Default country code
  const [service, setService] = React.useState(
    reservation.service || "Stanowisko VR"
  ); // Default service
  const [duration, setDuration] = React.useState(
    String(reservation.duration || 30)
  ); // Default duration
  const [people, setPeople] = React.useState(reservation.people || 1); // Default number of people
  const [selectedDate, setSelectedDate] = React.useState(
    reservation.reservationDate
      ? new Date(reservation.reservationDate)
      : new Date()
  ); // Default selected date
  const [selectedHour, setSelectedHour] = React.useState(
    reservation.reservationDate
      ? DateTime.fromISO(reservation.reservationDate).toFormat("HH:mm")
      : null
  ); // Selected hour
  const [error, setError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  }); // Track touched fields
  const reservations = useAtomValue(reservationsAtom); // Get reservations from atom
  const settings = useAtomValue(settingsAtom); // Get settings from atom

  // --- Validation ---
  React.useEffect(() => {
    if (service === "Symulator VR - 1 osoba") {
      setPeople(1);
      setDuration("15");
    } else if (service === "Symulator VR - 2 osoby") {
      setPeople(2);
      setDuration("15");
    } else {
      setDuration("30");
    }
  }, [service]);

  // Validate email format
  function validateEmail(email: string) {
    if (!email) return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex
    return regex.test(email);
  }
  // Validate form fields
  function validateForm() {
    return (
      firstName.trim() &&
      lastName.trim() &&
      validateEmail(email) &&
      phone.trim() &&
      selectedDate &&
      selectedHour
    );
  }
  // Generate available hour slots based on selected date and service
  function generateHourSlots() {
    const date = DateTime.fromJSDate(selectedDate).setZone("Europe/Warsaw");
    const isSunday = date.weekday === 7;
    const isSimulator = service.includes("Symulator");
    const step = isSimulator ? 15 : 30;
    const slots: string[] = [];
    const startHour = isSunday ? (isSimulator ? 10 : 10) : 9;
    const endHour = isSunday ? (isSimulator ? 19 : 19) : 20;
    const endMinute = isSimulator ? 45 : 30;
    let t = date.set({ hour: startHour, minute: 0 });
    const end = date.set({ hour: endHour, minute: endMinute });
    while (t <= end) {
      slots.push(t.toFormat("HH:mm"));
      t = t.plus({ minutes: step });
    }
    return slots;
  }
  // Check if selected hour is available
  function isHourAvailable(hour: string) {
    const dateISO = DateTime.fromJSDate(selectedDate).toISODate();
    const stations = settings?.stations;
    const seats = settings?.seats;
    const slotStart = DateTime.fromJSDate(selectedDate)
      .set({
        hour: Number(hour.split(":")[0]),
        minute: Number(hour.split(":")[1]),
        second: 0,
        millisecond: 0,
      })
      .startOf("minute");
    const slotEnd = slotStart
      .plus({ minutes: parseInt(duration) })
      .startOf("minute");

    // --- Check if the slot is in the future ---
    const now = DateTime.now().setZone("Europe/Warsaw");
    if (slotStart < now) {
      return false;
    }

    // --- Get all reservations for the selected date ---
    const dayReservations = reservations.filter(
      (r: any) =>
        r.reservationDate.startsWith(dateISO) && r.id !== reservation.id
    );
    if (service === "Stanowisko VR") {
      const totalPeople = dayReservations
        .filter((r: any) => r.service === "Stanowisko VR")
        .filter((r: any) => {
          const resStart = DateTime.fromISO(r.reservationDate).startOf(
            "minute"
          );
          const resEnd = resStart
            .plus({ minutes: r.duration })
            .startOf("minute");
          return resStart < slotEnd && slotStart < resEnd;
        })
        .reduce((sum: number, r: any) => sum + (r.people || 0), 0);
      return totalPeople + people <= stations;
    } else if (
      service === "Symulator VR - 1 osoba" ||
      service === "Symulator VR - 2 osoby"
    ) {
      // If the service is a simulator, we need to check the number of seats
      // If there are no seats, return false
      if (seats === 0) {
        return false;
      }

      // For 2 person simulator, we need at least 2 seats
      if (service === "Symulator VR - 2 osoby" && seats < 2) {
        return false;
      }

      // If the service is a simulator, we need to check if there are any reservations that overlap with the selected slot
      const anySimulator = dayReservations.some((r: any) => {
        if (
          r.service !== "Symulator VR - 1 osoba" &&
          r.service !== "Symulator VR - 2 osoby"
        )
          return false;
        const resStart = DateTime.fromISO(r.reservationDate).startOf("minute");
        const resEnd = resStart.plus({ minutes: r.duration }).startOf("minute");
        return resStart < slotEnd && slotStart < resEnd;
      });
      return !anySimulator;
    }
    return true;
  }

  // --- Handle form submission ---
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    if (!validateForm()) {
      setError("Uzupełnij poprawnie wszystkie wymagane pola!");
      return;
    }
    if (!isHourAvailable(selectedHour!)) {
      setError("Wybrana godzina jest już zajęta!");
      return;
    }
    const reservationDateTime =
      DateTime.fromJSDate(selectedDate)
        .set({
          hour: Number(selectedHour!.split(":")[0]),
          minute: Number(selectedHour!.split(":")[1]),
        })
        .toISO() || "";
    const updated = {
      ...reservation,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || "salon@goodgamevr.pl",
      phone: `${countryCode}${phone.trim()}`,
      reservationDate: reservationDateTime,
      service: service as
        | "Stanowisko VR"
        | "Symulator VR - 1 osoba"
        | "Symulator VR - 2 osoby",
      people,
      duration: parseInt(duration),
    };
    onSave(updated);
  }
  return (
    <form className="flex flex-col lg:flex-row gap-6" onSubmit={handleSubmit}>
      {/* LEFT COLUMN: personal data, time, clients */}
      <div className="flex-1 flex flex-col gap-4 min-w-[260px]">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">
              Imię <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Jan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
              className={`w-full p-2 text-base rounded bg-[#0f1525] border ${
                touched.firstName && !firstName
                  ? "border-red-500"
                  : "border-gray-600"
              } text-white`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">
              Nazwisko <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Kowalski"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
              className={`w-full p-2 text-base rounded bg-[#0f1525] border ${
                touched.lastName && !lastName
                  ? "border-red-500"
                  : "border-gray-600"
              } text-white`}
            />
          </div>
        </div>
        <div className="flex-row">
          <label className="block text-sm font-semibold mb-1">
            Adres email <span className="text-gray-400">(opcjonalnie)</span>
          </label>
          <input
            type="email"
            placeholder="Adres email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            className={`w-full p-2 text-base rounded bg-[#0f1525] border ${
              touched.email && email && !validateEmail(email)
                ? "border-red-500"
                : "border-gray-600"
            } text-white`}
          />
        </div>
        {touched.email && email && !validateEmail(email) && (
          <p className="text-red-500 text-xs">Wprowadź poprawny adres email</p>
        )}
        <div className="">
          <label className="block text-sm font-semibold mb-1">
            Numer telefonu<span className="text-red-500"> *</span>
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="p-2 text-base rounded bg-[#0f1525] border border-gray-600 text-white w-24"
            >
              <option value="+48">🇵🇱 +48</option>
              <option value="+49">🇩🇪 +49</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+1">🇺🇸 +1</option>
            </select>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Numer telefonu"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              className={`flex-1 p-2 text-base rounded bg-[#0f1525] border ${
                touched.phone && !phone ? "border-red-500" : "border-gray-600"
              } text-white`}
            />
          </div>
        </div>
        {/* Service, date and time, persons */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Wybierz usługę<span className="text-red-500"> *</span>
          </label>
          <select
            className="w-full p-2 text-base rounded bg-[#0f1525] border border-gray-600 text-white"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option>Stanowisko VR</option>
            <option>Symulator VR - 1 osoba</option>
            <option>Symulator VR - 2 osoby</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">
            Czas trwania<span className="text-red-500"> *</span>
          </label>
          {service === "Stanowisko VR" ? (
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2 text-base rounded bg-[#0f1525] border border-gray-600 text-white"
            >
              <option value="30">
                30 min - 39 zł za osobę (Pon. - Czw.) | 45 zł za osobę (Pt. -
                Niedz.)
              </option>
              <option value="60">
                60 min - 78 zł za osobę (Pon. - Czw.) | 90 zł za osobę (Pt. -
                Niedz.)
              </option>
              <option value="90">
                90 min - 117 zł za osobę (Pon. - Czw.) | 135 zł za osobę (Pt. -
                Niedz.)
              </option>
              <option value="120">
                120 min - 156 zł za osobę (Pon. - Czw.) | 180 zł za osobę (Pt. -
                Niedz.)
              </option>
            </select>
          ) : (
            <input
              type="text"
              disabled
              value="15 min"
              className="w-full p-2 text-base rounded bg-[#1a1a1a] border border-gray-600 text-white"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 mt-1">
            Liczba osób<span className="text-red-500"> *</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPeople((prev: number) => {
                  if (service === "Symulator VR - 1 osoba") return 1;
                  if (service === "Symulator VR - 2 osoby") return 2;
                  return Math.max(1, prev - 1);
                })
              }
              className="bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-2 py-1 rounded text-xs hover:bg-[#1a1a1a]"
              disabled={service !== "Stanowisko VR"}
            >
              –
            </button>
            <span className="text-lg">{people}</span>
            <button
              type="button"
              onClick={() =>
                setPeople((prev: number) => {
                  if (service === "Symulator VR - 1 osoba") return 1;
                  if (service === "Symulator VR - 2 osoby") return 2;
                  return Math.min(8, prev + 1);
                })
              }
              className="bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-2 py-1 rounded text-xs hover:bg-[#1a1a1a]"
              disabled={service !== "Stanowisko VR"}
            >
              +
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {service === "Stanowisko VR" &&
              `Preferowana liczba osób: 1 - ${settings?.stations || 8}`}
            {service === "Symulator VR - 1 osoba" &&
              "Preferowana liczba osób: 1"}
            {service === "Symulator VR - 2 osoby" &&
              "Preferowana liczba osób: 2"}
          </p>
        </div>
      </div>
      {/* RIGHT COLUMN: DATE AND TIME */}
      <div className="flex-1 flex flex-col gap-4 min-w-[260px]">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">
              Data rezerwacji<span className="text-red-500"> *</span>
            </label>
            <DatePicker
              locale={pl}
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date!);
                setSelectedHour(null);
              }}
              dateFormat="yyyy-MM-dd"
              className="p-2 text-base rounded bg-[#0f1525] border border-gray-600 text-white w-full"
              calendarClassName="bg-[#1e2636] text-white border border-[#00d9ff]"
            />
          </div>
          {/* Summary */}
          {selectedHour && (
            <div className="flex-1 text-center">
              <div className="bg-[#0f1525] border border-gray-600 rounded p-2.5 text-sm font-semibold text-[#00d9ff]">
                {DateTime.fromJSDate(selectedDate)
                  .setLocale("pl")
                  .toFormat("cccc, d LLLL")}
                , godz. {selectedHour}
              </div>
            </div>
          )}
        </div>
        <div className="">
          <label className="block text-sm font-semibold mb-1">
            Wybierz godzinę<span className="text-red-500"> *</span>
          </label>
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
            {generateHourSlots().map((hour) => {
              const available = isHourAvailable(hour);
              const selected = selectedHour === hour;
              return (
                <button
                  type="button"
                  key={hour}
                  onClick={() => available && setSelectedHour(hour)}
                  className={`flex items-center mr-2 gap-2 px-4 py-2 rounded transition text-left text-base font-medium
              ${
                !available
                  ? "bg-[#1a1a1a] text-gray-600 border border-[rgb(26,26,26)] cursor-not-allowed"
                  : selected
                  ? "bg-[#00d9ff] text-black border border-[#00d9ff]"
                  : "bg-[#0f1525] border border-gray-600 text-white hover:bg-[#00d9ff] hover:text-black"
              }`}
                  disabled={!available}
                >
                  <span className="flex-1">{hour}</span>
                  {selected ? (
                    <FaCheckCircle className="text-black" />
                  ) : (
                    <span className="text-xs">Wybierz</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Actions and errors */}
        <div className="flex flex-row gap-2 mt-4 justify-end items-center">
          {error && (
            <div className="bg-red-700 text-white rounded p-3 text-xs font-bold text-center animate-fade-in mr-auto">
              {error}
            </div>
          )}
          <button
            type="button"
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded shadow transition text-base"
            onClick={onCancel}
          >
            Anuluj
          </button>
          <button
            type="submit"
            className="bg-[#00d9ff] text-black font-bold px-4 py-2 rounded shadow hover:bg-[#ffcc00] transition text-base"
          >
            Zapisz
          </button>
        </div>
      </div>
    </form>
  );
};
