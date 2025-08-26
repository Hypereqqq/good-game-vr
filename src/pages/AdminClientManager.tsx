// This code defines a React component for managing clients in a game setting, allowing for adding, editing,
// and removing clients, as well as handling various configurations like custom start times, durations, and payment options.
// It uses Jotai for state management and Luxon for date handling.

// Import necessary libraries and types
import React, { useEffect, useRef, useState } from "react";
import Chart from "react-apexcharts";
// react-apexcharts typings sometimes don't match JSX; cast to any component type
const Apex: React.ComponentType<any> = (Chart as unknown) as React.ComponentType<any>;
//import { HexColorPicker } from "react-colorful";
import { useAtom } from "jotai";
import { clientsAtom } from "../store/clients";
import { v4 as uuidv4 } from "uuid";
import { ClientGame, GameSegment } from "../types/types";
import { DateTime } from "luxon";
import {
  FaTrash,
  FaEdit,
  FaCommentDots,
  FaBell,
  FaPause,
  FaPlay,
  FaHome,
  FaClock,
  FaChartBar,
} from "react-icons/fa";

type SubpageType = "main" | "stoper" | "stats";
type StatsSubpageType =
  | "statystyki_podstawowe"
  | "wykorzystanie_stanowisk"
  | "analiza_finansowa"
  | "analiza_graczy"
  | "analiza_gier"
  | "operacyjne"
  | "wskazniki";

// This object maps station IDs to their labels for display purposes
const stanowiskoLabels: Record<number, string> = {
  1: "Zielone",
  2: "Czerwone",
  3: "Tył 3",
  4: "Tył 4",
  5: "Niebieskie",
  6: "Żółte",
  7: "Tył 2",
  8: "Tył 1",
};

// This type defines the options available when removing players from a group
type RemoveOption = {
  type: "paid" | "toPay";
  toPayOption?: "addToGroup" | "addToQueue";
};

const AdminClientManager: React.FC = () => {
  // --- Statistics in localStorage helpers ---
  const STATS_KEY = "ggvr_stats_v1";

  type StatsShape = {
    games: Record<string, number>; // total minutes per game
    revenuePerGame: Record<string, number>; // revenue aggregated per game
    sessions: Array<{
      clientId: string;
      stations: number[];
      players: number;
      startTime: string;
      endTime?: string;
      playedMinutes?: number;
      gameSegments?: GameSegment[];
      revenue?: number;
      perStationMinutes?: Record<number, number>;
      perPlayerMinutes?: number[];
      perSegmentRevenue?: Array<{
        gameType: string;
        minutes: number;
        revenue: number;
        players: number[];
      }>;
    }>;
    aggregates: {
      totalSessions: number;
      totalMinutes: number;
      totalRevenue: number;
      avgSessionMinutes: number;
      stationUsage: Record<number, { sessions: number; minutes: number }>;
    };
  };

  // Key for local storage to persist clients and queue clients
  const LOCAL_STORAGE_KEY = "ggvr_clients";
  const QUEUE_LOCAL_STORAGE_KEY = "ggvr_queueClients";

  // State management using Jotai atoms
  const [subpage, setSubpage] = useState<SubpageType>("main");
  const [statsSubPage, setStatsSubPage] = useState<StatsSubpageType>(
    "statystyki_podstawowe"
  );
  const [clients, setClients] = useAtom(clientsAtom);
  const [peopleCount, setPeopleCount] = useState(1); // Number of players in the group
  const [slots, setSlots] = useState<number[]>([1]); // Default slot for the first player
  const [duration, setDuration] = useState(30); // Default duration in minutes
  const [paid, setPaid] = useState(false); // If the game is paid
  const [editId, setEditId] = useState<string | null>(null); // ID of the client being edited
  const [customStartEnabled, setCustomStartEnabled] = useState(false); // If custom start time is enabled
  const [customHour, setCustomHour] = useState(10); // Default hour
  const [customMinute, setCustomMinute] = useState(0); // Default minute
  const [customPriceEnabled, setCustomPriceEnabled] = useState(false); // If custom price is enabled
  const [customPrice, setCustomPrice] = useState<number | null>(null); // Custom price for the game, null if not set
  const [addComment, setAddComment] = useState(false); // If comment field is enabled
  const [comment, setComment] = useState<string>(""); // Comment for the client or group
  const [addReminder, setAddReminder] = useState(false); // If reminder is enabled
  const [reminderCount, setReminderCount] = useState<number>(1); // Number of reminders
  const [reminderMode, setReminderMode] = useState<"before" | "every">(
    "before"
  ); // Mode for reminders
  const [reminderTimes, setReminderTimes] = useState<number[]>([15]); // Times for reminders in minutes
  const [reminderText, setReminderText] = useState<string>(""); // Optional text for reminder
  const [reminderStartMode, setReminderStartMode] = useState<
    "from_now" | "from_start"
  >("from_start"); // Whether reminder time is counted from now or from start time
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false); // If reminder modal is shown
  const [activeReminder, setActiveReminder] = useState<{
    client: ClientGame;
    time: number;
  } | null>(null); // Current active reminder
  const [duplicateSlots, setDuplicateSlots] = useState<number[]>([]); // Indices of duplicate slots
  const [showDuplicateError, setShowDuplicateError] = useState(false); // If there are duplicate slots
  const [splitEnabled, setSplitEnabled] = useState(false); // If split group feature is enabled
  const [splitGroupsCount, setSplitGroupsCount] = useState<number | "">(""); // Number of groups to split into, empty string if not set
  const [splitGroups, setSplitGroups] = useState<
    { players: number; stations: number[] }[]
  >([]); // Groups to split into, each with number of players and their stations
  const [splitError, setSplitError] = useState(false); // If there is an error in the split configuration

  const [removeFromGroupEnabled, setRemoveFromGroupEnabled] = useState(false); // If remove from group feature is enabled
  const [removeCount, setRemoveCount] = useState<number | "">(""); // Number of players to remove from the group, empty string if not set
  const [removeStations, setRemoveStations] = useState<number[]>([]); // Stations to remove from the group
  const [removeOptions, setRemoveOptions] = useState<RemoveOption[]>([]); // Options for removing players, each with type and optional toPayOption
  const [queueClients, setQueueClients] = useState<ClientGame[]>(() => {
    const stored = localStorage.getItem(QUEUE_LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }); // Clients in the queue, loaded from local storage
  const [removeNames, setRemoveNames] = useState<string[]>([]); // Names of players to remove from the group
  const [removePrices, setRemovePrices] = useState<(number | "")[]>([]); // Prices for players to remove from the group, empty string if not set

  const [editingQueueId, setEditingQueueId] = useState<string | null>(null); // ID of the client being edited in the queue
  const [editingQueuePrice, setEditingQueuePrice] = useState<number | "">(""); // Price of the client being edited in the queue, empty string if not set

  // Game selection states
  const [hasGameSelection, setHasGameSelection] = useState(false); // If game selection is enabled
  const [gameMode, setGameMode] = useState<"same" | "different">("same"); // Whether all players play the same game
  const [gameType, setGameType] = useState<string>(""); // Game for 'same' mode
  const [individualGames, setIndividualGames] = useState<string[]>([]); // Games for 'different' mode

  // Stoper states
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0); // czas w sekundach
  const [stopwatchStartTime, setStopwatchStartTime] = useState<number | null>(
    null
  );
  const [stopwatchPausedTime, setStopwatchPausedTime] = useState(0);
  const [measurements, setMeasurements] = useState<number[]>([]);
  const [showStopwatchBubble, setShowStopwatchBubble] = useState(false);

  // Timer states
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [showTimerBubble, setShowTimerBubble] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Bubble position states
  const [stopwatchBubblePosition, setStopwatchBubblePosition] = useState({
    x: 20,
    y: 20,
  });
  const [timerBubblePosition, setTimerBubblePosition] = useState({
    x: 300,
    y: 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeBox, setActiveBox] = useState<"stopwatch" | "timer" | null>(
    null
  );

  const [, setTick] = useState(0); // State to force re-render every second
  const [showDeleteModal, setShowDeleteModal] = useState(false); // If delete confirmation modal is shown
  const [clientToDelete, setClientToDelete] = useState<ClientGame | null>(null); // Client to delete, null if not set
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null); // Reference to the comment input field for focus management
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null }); // Configuration for sorting clients
  const [, setOriginalClients] = useState<ClientGame[]>([]); // Original list of clients for reset purposes

  // Kolory dla maksymalnie 8 grup / klientów
  const groupColors = [
    "#fff700", // yellow
    "#0cad3f", // green
    "#0356fc", // blue
    "#b01033", // red
  ];

  // Buduje mapę clientId -> kolor na podstawie kolejności w liście clients
  const buildClientColorMap = (): Record<string, string> => {
    const map: Record<string, string> = {};
    let idx = 0;
    for (const c of clients) {
      if (!map[c.id]) {
        map[c.id] = groupColors[idx % groupColors.length];
        idx++;
      }
    }
    return map;
  };

  // Load clients from local storage on initial render
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  // Load clients from local storage when the component mounts
  useEffect(() => {
    localStorage.setItem(QUEUE_LOCAL_STORAGE_KEY, JSON.stringify(queueClients));
  }, [queueClients]);

  // Load clients from local storage on initial render
  useEffect(() => {
    setOriginalClients(clients);
  }, [clients]);

  // Check for reminders every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndShowReminders();
    }, 1000);

    return () => clearInterval(interval);
  }, [clients]);

  // Reset form when editId changes or when clients change
  useEffect(() => {
    if (editId && !clients.some((c) => c.id === editId)) {
      setEditId(null);
      resetForm();
    }
  }, [clients, editId]);

  // Reset form when the component mounts
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1); // wymusza re-render
    }, 1000); // co 1 sekunda

    return () => clearInterval(interval); // czyszczenie przy unmount
  }, []);

  // Reset form when the component mounts
  useEffect(() => {
    if (editId) return;

    const usedSlots = clients.flatMap((c) => c.stations);
    const availableSlots = Object.keys(stanowiskoLabels)
      .map(Number)
      .filter((s) => !usedSlots.includes(s));

    const newSlots = Array(peopleCount)
      .fill(null)
      .map((_, i) => availableSlots[i] || availableSlots[0] || 1);

    setSlots(newSlots);
  }, [peopleCount, clients, editId]);

  // Set custom price when customPriceEnabled changes
  useEffect(() => {
    if (customPriceEnabled && customPrice === null) {
      setCustomPrice(getSinglePlayerAmount(duration, new Date().toISOString()));
    }
  }, [customPriceEnabled, duration, peopleCount]);

  // Set custom start time when customStartEnabled changes
  useEffect(() => {
    // If custom start is enabled and no editId is set, set the current time as default
    if (customStartEnabled && !editId) {
      const now = DateTime.now();
      setCustomHour(now.hour);
      setCustomMinute(now.minute);
    }
  }, [customStartEnabled, editId]);

  // Stopwatch useEffect
  useEffect(() => {
    let interval: number;
    if (stopwatchRunning && stopwatchStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - stopwatchStartTime) / 1000);
        setStopwatchTime(elapsed);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [stopwatchRunning, stopwatchStartTime]);

  // Timer useEffect
  useEffect(() => {
    let interval: number;
    if (timerRunning && timerStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - timerStartTime) / 1000);
        const totalSeconds = timerMinutes * 60 + timerSeconds;
        const remaining = totalSeconds - elapsed;

        if (remaining <= 0) {
          setTimerRemainingSeconds(0);
          setTimerRunning(false);
          setShowTimerModal(true);
        } else {
          setTimerRemainingSeconds(remaining);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerStartTime, timerMinutes, timerSeconds]);

  // Mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset.x, dragOffset.y]);

  // Update individual games array when peopleCount changes
  useEffect(() => {
    if (gameMode === "different") {
      setIndividualGames((prev) => {
        const newIndividualGames = Array(peopleCount)
          .fill("")
          .map((_, i) => prev[i] || "");
        return newIndividualGames;
      });
    }
  }, [peopleCount, gameMode]);

  // Update game segments duration in real time
  useEffect(() => {
    const interval = setInterval(() => {
      setClients((prev) =>
        prev.map((client) => {
          if (
            client.gameSegments &&
            client.gameSegments.some((seg) => !seg.endTime)
          ) {
            const updatedSegments = client.gameSegments.map((segment) => {
              if (!segment.endTime) {
                return {
                  ...segment,
                  duration: Math.floor(
                    DateTime.now().diff(
                      DateTime.fromISO(segment.startTime),
                      "minutes"
                    ).minutes
                  ),
                };
              }
              return segment;
            });
            return { ...client, gameSegments: updatedSegments };
          }
          return client;
        })
      );
    }, 60000); // co minutę

    return () => clearInterval(interval);
  }, []);

  const loadStats = (): StatsShape => {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (!raw)
        return {
          games: {},
          revenuePerGame: {},
          sessions: [],
          aggregates: {
            totalSessions: 0,
            totalMinutes: 0,
            totalRevenue: 0,
            avgSessionMinutes: 0,
            stationUsage: {},
          },
        };
      return JSON.parse(raw) as StatsShape;
    } catch (e) {
      console.error("Failed to load stats", e);
      return {
        games: {},
        revenuePerGame: {},
        sessions: [],
        aggregates: {
          totalSessions: 0,
          totalMinutes: 0,
          totalRevenue: 0,
          avgSessionMinutes: 0,
          stationUsage: {},
        },
      };
    }
  };

  const saveStats = (s: StatsShape) => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  };

  // Compute simple summaries (sessions, total minutes, avg) and hourly heatmap for given range
  const computeStatsSummary = (range: "day" | "week" | "month") => {
    const stats = loadStats();
    const now = DateTime.now();
    let start: DateTime;
    if (range === "day") start = now.minus({ days: 1 });
    else if (range === "week") start = now.minus({ weeks: 1 });
    else start = now.minus({ months: 1 });

    const sessions = (stats.sessions || []).filter((s) => {
      try {
        return DateTime.fromISO(s.startTime) >= start;
      } catch (e) {
        return false;
      }
    });

    // Count sessions per-player: each player in a session counts as one "player-session"
    const sessionsCount = sessions.reduce((acc, s) => acc + (s.players || 1), 0);

    // totalMinutes: prefer perPlayerMinutes (sum), otherwise playedMinutes * players
    const totalMinutes = sessions.reduce((acc, s) => {
      if (s.perPlayerMinutes && Array.isArray(s.perPlayerMinutes)) {
        return acc + s.perPlayerMinutes.reduce((a: number, b: number) => a + (b || 0), 0);
      }
      return acc + ((s.playedMinutes || 0) * (s.players || 1));
    }, 0);

    const avgMinutes = sessionsCount > 0 ? Math.round(totalMinutes / sessionsCount) : 0;

    const hourCounts = new Array(24).fill(0);
    sessions.forEach((s) => {
      try {
        const h = DateTime.fromISO(s.startTime).hour;
        hourCounts[h] = (hourCounts[h] || 0) + (s.players || 1);
      } catch (e) {
        // ignore
      }
    });

    return { sessionsCount, totalMinutes, avgMinutes, hourCounts };
  };

  // Helpers to build ApexCharts series/options
  const buildLineOptions = (label: string) => ({
    chart: {
      id: `chart-${label}`,
      toolbar: { show: true },
      zoom: { enabled: false },
      background: "#0f1525",
    },
    theme: { mode: "dark" },
    stroke: { curve: "smooth" },
    colors: ["#00d9ff"],
    dataLabels: { enabled: false },
    xaxis: { categories: [] as string[] },
    yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
    tooltip: { enabled: true, theme: "dark" },
    grid: { borderColor: "#1f2a3a" },
    fill: { type: "gradient", gradient: { shade: "dark", gradientToColors: ["#6a5cff"], shadeIntensity: 1, type: "vertical", opacityFrom: 0.7, opacityTo: 0.05 } },
  });

  const buildHeatmapOptions = () => ({
  chart: { toolbar: { show: false }, background: "#0f1525" },
  theme: { mode: "dark" },
  dataLabels: { enabled: false },
  colors: ["#00d9ff"],
  plotOptions: { heatmap: { shadeIntensity: 0.9, radius: 4 } },
  tooltip: { enabled: true, theme: "dark" },
  grid: { borderColor: "#1f2a3a" },
  });

  const buildDaySeries = () => {
    const stats = loadStats();
    const now = DateTime.now();
    const categories = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data = new Array(24).fill(0);
    (stats.sessions || []).forEach((s) => {
      try {
        const dt = DateTime.fromISO(s.startTime);
        if (dt >= now.startOf("day") && dt < now.endOf("day")) data[dt.hour] += 1;
      } catch (e) {}
    });
    return { series: [{ name: "Sesje", data }], options: { ...buildLineOptions("day"), xaxis: { categories } } };
  };

  const buildWeekSeries = () => {
    const stats = loadStats();
    const now = DateTime.now();
    const start = now.startOf("day").minus({ days: 6 });
    const days = Array.from({ length: 7 }, (_, i) => start.plus({ days: i }));
    const categories = days.map((d) => d.toFormat("ccc dd"));
  const data = days.map((_) => 0);
    (stats.sessions || []).forEach((s) => {
      try {
        const dt = DateTime.fromISO(s.startTime).startOf("day");
        const idx = Math.floor(dt.diff(start, "days").days);
        if (idx >= 0 && idx < 7) data[idx] += 1;
      } catch (e) {}
    });
    return { series: [{ name: "Sesje", data }], options: { ...buildLineOptions("week"), xaxis: { categories } } };
  };

  const buildMonthSeries = () => {
    const stats = loadStats();
    const now = DateTime.now();
    const start = now.startOf("day").minus({ days: 29 });
    const days = Array.from({ length: 30 }, (_, i) => start.plus({ days: i }));
    const categories = days.map((d) => d.toFormat("dd.MM"));
  const data = days.map((_) => 0);
    (stats.sessions || []).forEach((s) => {
      try {
        const dt = DateTime.fromISO(s.startTime).startOf("day");
        const idx = Math.floor(dt.diff(start, "days").days);
        if (idx >= 0 && idx < 30) data[idx] += 1;
      } catch (e) {}
    });
    return { series: [{ name: "Sesje", data }], options: { ...buildLineOptions("month"), xaxis: { categories } } };
  };

  const buildHeatmapSeries = () => {
    const stats = loadStats();
    const now = DateTime.now();
    const start = now.startOf("day").minus({ days: 6 });
    const series = [] as any[];
    for (let i = 0; i < 7; i++) {
      const day = start.plus({ days: i });
      const data = new Array(24).fill(0).map((_, h) => ({ x: `${h}:00`, y: 0 }));
      (stats.sessions || []).forEach((s) => {
        try {
          const dt = DateTime.fromISO(s.startTime);
          if (dt >= day && dt < day.plus({ days: 1 })) data[dt.hour].y += 1;
        } catch (e) {}
      });
      series.push({ name: day.toFormat("dd.MM"), data });
    }
    return { series, options: buildHeatmapOptions() };
  };

  // --- Station usage analytics ---
  const computeStationStats = () => {
    const stats = loadStats();
    const stationsCount = 8;
    const sessionsCountPer: number[] = Array(stationsCount + 1).fill(0);
    const totalMinutesPer: number[] = Array(stationsCount + 1).fill(0);
    const gamePrefs: Record<number, Record<string, number>> = {};

    // totalSessions counted per-player (each player = 1 session)
    const totalSessions = (stats.sessions || []).reduce((acc, s) => acc + (s.players || 1), 0);

    (stats.sessions || []).forEach((s) => {
      const sessStations: number[] = s.stations || [];

      // count session presence per station (each station entry corresponds to one player)
      sessStations.forEach((st) => {
        sessionsCountPer[st] = (sessionsCountPer[st] || 0) + 1;
      });

      // add minutes per station: prefer explicit perPlayerMinutes -> map them to stations,
      // otherwise if perStationMinutes present use it, else split total player-minutes equally
      if (s.perPlayerMinutes && Array.isArray(s.perPlayerMinutes) && s.stations) {
        s.perPlayerMinutes.forEach((pm: number, idx: number) => {
          const station = s.stations ? s.stations[idx] : undefined;
          if (station != null) {
            totalMinutesPer[station] = (totalMinutesPer[station] || 0) + (pm || 0);
          }
        });
      } else if (s.perStationMinutes) {
        Object.entries(s.perStationMinutes).forEach(([k, v]) => {
          const idx = Number(k);
          totalMinutesPer[idx] = (totalMinutesPer[idx] || 0) + (v || 0);
        });
      } else {
        // fallback: total player-minutes = playedMinutes * players
        const playedTotal = (s.playedMinutes || 0) * (s.players || 1);
        if (playedTotal && sessStations.length > 0) {
          const per = playedTotal / sessStations.length;
          sessStations.forEach((st) => {
            totalMinutesPer[st] = (totalMinutesPer[st] || 0) + per;
          });
        }
      }

      // infer game preferences from gameSegments when present
      if (s.gameSegments && s.stations) {
        s.gameSegments.forEach((seg: any) => {
          let minutes = seg.duration || 0;
          if (!minutes && seg.startTime && seg.endTime) {
            try {
              const start = DateTime.fromISO(seg.startTime);
              const end = DateTime.fromISO(seg.endTime);
              minutes = Math.max(0, Math.floor(end.diff(start, "minutes").minutes));
            } catch (e) {
              minutes = 0; // fallback in case of invalid date format
            }
          }

          (seg.players || []).forEach((pi: number) => {
            const station = s.stations[pi];
            if (station == null) return;
            gamePrefs[station] = gamePrefs[station] || {};
            gamePrefs[station][seg.gameType] = (gamePrefs[station][seg.gameType] || 0) + minutes;
          });
        });
      }
    });

    const percentUsage: number[] = Array(stationsCount + 1).fill(0);
    const avgMinutesPer: number[] = Array(stationsCount + 1).fill(0);
    for (let i = 1; i <= stationsCount; i++) {
      percentUsage[i] = totalSessions > 0 ? Math.round((sessionsCountPer[i] / totalSessions) * 100) : 0;
      avgMinutesPer[i] = sessionsCountPer[i] > 0 ? Math.round(totalMinutesPer[i] / sessionsCountPer[i]) : 0;
    }

    return { totalSessions, sessionsCountPer, totalMinutesPer, percentUsage, avgMinutesPer, gamePrefs };
  };

  const buildStationPercentSeries = () => {
    const s = computeStationStats();
    const categories = Array.from({ length: 8 }, (_, i) => stanowiskoLabels[i + 1] || `St ${i + 1}`);
    const data = categories.map((_, i) => s.percentUsage[i + 1] || 0);
    return { series: [{ name: "Wykorzystanie (%)", data }], options: { ...buildLineOptions("stationsPercent"), xaxis: { categories }, plotOptions: { bar: { horizontal: false } }, colors: ["#ffb86b"] } };
  };

  const buildStationAvgSeries = () => {
    const s = computeStationStats();
    const categories = Array.from({ length: 8 }, (_, i) => stanowiskoLabels[i + 1] || `St ${i + 1}`);
    const data = categories.map((_, i) => s.avgMinutesPer[i + 1] || 0);
    return { series: [{ name: "Średni czas (min)", data }], options: { ...buildLineOptions("stationsAvg"), xaxis: { categories }, colors: ["#7c4dff"] } };
  };

  const StationBlocks: React.FC<{ values: number[] }> = ({ values }) => {
    const arr = values.slice(1, 9);
    const max = Math.max(...arr, 1);
    return (
      <div className="grid grid-cols-4 gap-2 mt-3 items-center">
        {arr.map((v, i) => (
          <div key={i} className="flex flex-col items-center text-xs">
            <div className="w-12 h-12 rounded-md" style={{ background: `rgba(255,130,92, ${v / max})`, border: '1px solid rgba(255,255,255,0.04)' }} title={`${stanowiskoLabels[i+1] || i+1}: ${v} min`} />
            <div className="mt-1 text-[11px] text-gray-300">{stanowiskoLabels[i+1]}</div>
          </div>
        ))}
      </div>
    );
  };

  // Small hour blocks visualizer (24 hours)
  const HourBlocks: React.FC<{ hourCounts: number[] }> = ({ hourCounts }) => {
    const max = Math.max(...hourCounts, 1);
    return (
      <div className="flex gap-1 items-center mt-3 bg-[#0f1525] p-2 rounded">
        {hourCounts.map((c, h) => (
          <div key={h} className="flex flex-col items-center text-xs w-8">
            <div
              title={`${h}:00 — ${c} sesji`}
              className="w-6 h-6 rounded"
              style={{ background: `rgba(0,213,255, ${c / max})`, border: '1px solid rgba(255,255,255,0.03)' }}
            />
            <div className="text-[10px] text-gray-400 mt-1">{h}</div>
          </div>
        ))}
      </div>
    );
  };

  const recordClientToStats = (client: ClientGame) => {
    const stats = loadStats();
    // Ensure aggregates exist
    stats.aggregates = stats.aggregates || {
      totalSessions: 0,
      totalMinutes: 0,
      totalRevenue: 0,
      avgSessionMinutes: 0,
      stationUsage: {},
    };

    // Record sessions entry
    // Compute played minutes using pauseHistory when possible
    const now = DateTime.now();

    const computePlayedMinutes = () => {
      // If explicit playedMinutes is present, prefer it
      if (typeof client.playedMinutes === "number")
        return Math.max(0, Math.floor(client.playedMinutes));

      // If we have explicit segments, compute union of intervals (unique minutes)
      if (client.gameSegments && client.gameSegments.length > 0) {
        try {
          const intervals = client.gameSegments
            .map((s) => {
              const start = DateTime.fromISO(s.startTime).toMillis();
              const end = DateTime.fromISO(s.endTime ?? now.toISO()).toMillis();
              return { start, end };
            })
            .filter((i) => i.end > i.start)
            .sort((a, b) => a.start - b.start);

          if (intervals.length === 0) return 0;

          const merged: Array<{ start: number; end: number }> = [];
          for (const it of intervals) {
            if (merged.length === 0) merged.push({ ...it });
            else {
              const last = merged[merged.length - 1];
              if (it.start <= last.end) last.end = Math.max(last.end, it.end);
              else merged.push({ ...it });
            }
          }

          const totalMs = merged.reduce((acc, m) => acc + (m.end - m.start), 0);
          return Math.max(0, Math.floor(totalMs / 60000));
        } catch (e) {
          return Math.max(0, Math.floor(client.duration || 0));
        }
      }

      // Otherwise, derive from startTime and pauseHistory.
      let elapsedMs = now.diff(DateTime.fromISO(client.startTime)).milliseconds;
      let ongoingPauseMs = 0;
      if (client.pauseHistory && client.pauseHistory.length > 0) {
        const last = client.pauseHistory[client.pauseHistory.length - 1];
        if (last && !last.endTime) {
          try {
            ongoingPauseMs = now.diff(DateTime.fromISO(last.startTime)).milliseconds;
          } catch (e) {
            ongoingPauseMs = 0;
          }
        }
      }

      const playedMs = Math.max(0, elapsedMs - ongoingPauseMs);
      return Math.max(0, Math.floor(playedMs / 60000));
    };

    const sessionEntry: any = {
      clientId: client.id,
      stations: client.stations,
      players: client.players,
      startTime: client.startTime,
      endTime: DateTime.fromISO(client.startTime).plus({ minutes: client.duration }).toISO() || undefined,
      playedMinutes: computePlayedMinutes(),
  plannedMinutes: client.duration,
      gameSegments: client.gameSegments || [],
      paid: !!client.paid,
      customPrice: typeof (client as any).customPrice === 'number' ? (client as any).customPrice : undefined,
      wasCustomPrice: typeof (client as any).customPrice === 'number',
    };

    // We'll compute per-player minutes and attribute game minutes in player-minutes
    const perStationMinutes: Record<number, number> = {};
    const perPlayerMinutes: number[] = [];
    const perSegmentRevenue: Array<{
      gameType: string;
      minutes: number;
      revenue: number;
      players: number[];
    }> = [];
    let sessionRevenue = 0;

    if (client.gameSegments && client.gameSegments.length > 0) {
      client.gameSegments.forEach((seg) => {
        const minutes =
          seg.duration ||
          Math.max(
            0,
            Math.floor(
              DateTime.fromISO(seg.endTime ?? DateTime.now().toISO()).diff(
                DateTime.fromISO(seg.startTime),
                "minutes"
              ).minutes
            )
          );

        const playersCount = (seg.players && seg.players.length) || client.players || 1;

        // record player-minutes for this segment
        stats.games[seg.gameType] = (stats.games[seg.gameType] || 0) + minutes * playersCount;

        const revenue = getSinglePlayerAmount(minutes, seg.startTime) * playersCount;
        stats.revenuePerGame[seg.gameType] = (stats.revenuePerGame[seg.gameType] || 0) + revenue;
        sessionRevenue += revenue;

        perSegmentRevenue.push({ gameType: seg.gameType, minutes, revenue, players: seg.players });

        seg.players.forEach((pi) => {
          perPlayerMinutes[pi] = (perPlayerMinutes[pi] || 0) + minutes;
          const station = client.stations[pi];
          if (station != null) {
            perStationMinutes[station] = (perStationMinutes[station] || 0) + minutes;
            stats.aggregates.stationUsage[station] = stats.aggregates.stationUsage[station] || { sessions: 0, minutes: 0 };
            stats.aggregates.stationUsage[station].minutes += minutes;
          }
        });
      });
    } else if (client.hasGameSelection) {
      const totalMinutes = sessionEntry.playedMinutes ?? client.duration;
      if (client.gameMode === "same" && client.gameType) {
        const players = client.players || 1;
        stats.games[client.gameType] = (stats.games[client.gameType] || 0) + totalMinutes * players;
        const revenue = getPaymentAmount(client.duration, client.startTime, client.players);
        stats.revenuePerGame[client.gameType] = (stats.revenuePerGame[client.gameType] || 0) + revenue;
        sessionRevenue += revenue;

        for (let i = 0; i < (client.players || 1); i++) {
          perPlayerMinutes[i] = (perPlayerMinutes[i] || 0) + totalMinutes;
          const station = client.stations[i];
          if (station != null) {
            perStationMinutes[station] = (perStationMinutes[station] || 0) + totalMinutes;
            stats.aggregates.stationUsage[station] = stats.aggregates.stationUsage[station] || { sessions: 0, minutes: 0 };
            stats.aggregates.stationUsage[station].minutes += totalMinutes;
          }
        }
      } else if (client.gameMode === "different" && client.individualGames) {
        client.individualGames.forEach((game, idx) => {
          if (!game) return;
          stats.games[game] = (stats.games[game] || 0) + totalMinutes;
          const revenue = getSinglePlayerAmount(totalMinutes, client.startTime);
          stats.revenuePerGame[game] = (stats.revenuePerGame[game] || 0) + revenue;
          sessionRevenue += revenue;

          perPlayerMinutes[idx] = (perPlayerMinutes[idx] || 0) + totalMinutes;
          const station = client.stations[idx];
          if (station != null) {
            perStationMinutes[station] = (perStationMinutes[station] || 0) + totalMinutes;
            stats.aggregates.stationUsage[station] = stats.aggregates.stationUsage[station] || { sessions: 0, minutes: 0 };
            stats.aggregates.stationUsage[station].minutes += totalMinutes;
          }
        });
      }
    }

    sessionEntry.revenue = sessionRevenue;
    sessionEntry.perStationMinutes = perStationMinutes;
    sessionEntry.perPlayerMinutes = perPlayerMinutes;
    sessionEntry.perSegmentRevenue = perSegmentRevenue;

    // push session (group-level record) and update aggregates counted per-player
    stats.sessions.push(sessionEntry);

    // Increase totalSessions by number of players
    stats.aggregates.totalSessions = (stats.aggregates.totalSessions || 0) + (client.players || 1);

    // total minutes: sum perPlayerMinutes if present, otherwise playedMinutes * players
    const minutesThisSession = perPlayerMinutes.length > 0
      ? perPlayerMinutes.reduce((a, b) => a + (b || 0), 0)
      : ((sessionEntry.playedMinutes ?? client.duration) * (client.players || 1));

    stats.aggregates.totalMinutes = (stats.aggregates.totalMinutes || 0) + minutesThisSession;
    stats.aggregates.totalRevenue = (stats.aggregates.totalRevenue || 0) + sessionRevenue;
    stats.aggregates.avgSessionMinutes = Math.round(((stats.aggregates.totalMinutes || 0) / (stats.aggregates.totalSessions || 1)) || 0);

    saveStats(stats);
  };

  // Reset form function to clear all fields
  const resetForm = () => {
    setPeopleCount(1);
    setSlots([1]);
    setDuration(30);
    setPaid(false);
    setCustomStartEnabled(false);
    setCustomHour(10);
    setCustomMinute(0);
    setCustomPrice(null);
    setCustomPriceEnabled(false);
    setAddComment(false);
    setComment("");
    setAddReminder(false);
    setReminderCount(1);
    setReminderMode("before");
    setReminderTimes([15]);
    setReminderText("");
    setReminderStartMode("from_start");
    // Reset game fields
    setHasGameSelection(false);
    setGameMode("same");
    setGameType("");
    setIndividualGames([]);
  };

  // Function to calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: number) => {
    return DateTime.fromISO(startTime).plus({ minutes: duration });
  };

  // Function to get remaining time in a human-readable format
  const getRemainingTime = (
    startTime: string,
    duration: number,
    isPaused: boolean = false,
    pauseStartTime?: string
  ): {
    text: string;
    minutes: number;
    isOver: boolean;
    pauseDuration?: string;
  } => {
    const now = DateTime.now();
    const end = DateTime.fromISO(startTime).plus({ minutes: duration });

    // Jeśli gra jest wstrzymana, obliczamy czas trwania pauzy
    if (isPaused && pauseStartTime) {
      const pauseStart = DateTime.fromISO(pauseStartTime);

      // Obliczamy pozostały czas w momencie wstrzymania
      const diffAtPauseSeconds = Math.floor(
        end.diff(pauseStart, "seconds").seconds
      );
      const diffMinutesAtPause = Math.ceil(diffAtPauseSeconds / 60);

      // Obliczamy czas trwania pauzy do wyświetlenia
      const pauseDurationSeconds = Math.floor(
        now.diff(pauseStart, "seconds").seconds
      );
      const pauseMinutes = Math.floor(pauseDurationSeconds / 60);
      const pauseSeconds = pauseDurationSeconds % 60;

      return {
        text: `${diffMinutesAtPause} min`,
        minutes: diffMinutesAtPause,
        isOver: false,
        pauseDuration: `${pauseMinutes}:${
          pauseSeconds < 10 ? "0" : ""
        }${pauseSeconds}`,
      };
    }

    // Standardowa kalkulacja czasu pozostałego
    const diffSeconds = Math.floor(end.diff(now, "seconds").seconds);

    if (diffSeconds <= 0) {
      return {
        text: "Koniec gry",
        minutes: 0,
        isOver: true,
      };
    }

    const diffMinutes = Math.ceil(diffSeconds / 60);

    return {
      text: `${diffMinutes} min`,
      minutes: diffMinutes,
      isOver: false,
    };
  };

  // Format seconds to MM:SS
  const formatMMSS = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    const paddedMM = String(mm).padStart(2, "0");
    const paddedSS = String(ss).padStart(2, "0");
    return `${paddedMM}:${paddedSS}`;
  };

  // Calculate time remaining until the next reminder for a client (in MM:SS).
  // Returns null if no countdown is applicable.
  const getReminderCountdown = (client: ClientGame): string | null => {
    if (
      !client.reminder ||
      !client.reminderTimes ||
      client.reminderTimes.length === 0
    )
      return null;

    // When paused, freeze countdown at the moment of pause (use pauseStartTime as reference)
    const nowRef =
      client.isPaused && client.pauseStartTime
        ? DateTime.fromISO(client.pauseStartTime)
        : DateTime.now();

    if (client.reminderMode === "before") {
      if (client.reminderStartMode === "from_start") {
        const start = DateTime.fromISO(client.startTime);
        const elapsedSeconds = Math.floor(
          nowRef.diff(start, "seconds").seconds
        );

        // For each configured reminder (minutes), compute seconds remaining and pick the smallest positive
        const remainingCandidates = client.reminderTimes.map(
          (m) => m * 60 - elapsedSeconds
        );
        const positive = remainingCandidates.filter((r) => r > 0);
        const nextSec =
          positive.length > 0
            ? Math.min(...positive)
            : Math.min(...remainingCandidates);
        if (nextSec === undefined) return null;
        return formatMMSS(nextSec <= 0 ? 0 : nextSec);
      } else {
        // from_now
        if (!client.reminderSetTime) return null;
        const set = DateTime.fromISO(client.reminderSetTime);
        const elapsedSeconds = Math.floor(nowRef.diff(set, "seconds").seconds);
        const remainingCandidates = client.reminderTimes.map(
          (m) => m * 60 - elapsedSeconds
        );
        const positive = remainingCandidates.filter((r) => r > 0);
        const nextSec =
          positive.length > 0
            ? Math.min(...positive)
            : Math.min(...remainingCandidates);
        if (nextSec === undefined) return null;
        return formatMMSS(nextSec <= 0 ? 0 : nextSec);
      }
    } else if (client.reminderMode === "every") {
      const interval = (client.reminderTimes[0] || 15) * 60; // in seconds
      const start = DateTime.fromISO(client.startTime);
      const elapsedSeconds = Math.floor(nowRef.diff(start, "seconds").seconds);
      if (elapsedSeconds < 0) return formatMMSS(interval);
      const mod = elapsedSeconds % interval;
      const nextSec = mod === 0 ? interval : interval - mod;
      return formatMMSS(nextSec <= 0 ? 0 : nextSec);
    }

    return null;
  };

  // Helper function to trigger a reminder
  const triggerReminder = (
    client: ClientGame,
    remainingMinutes: number,
    elapsedMinutesFromReminderSet?: number
  ) => {
    // Ustawienie aktywnego przypomnienia
    setActiveReminder({
      client: client,
      time: remainingMinutes,
    });

    // Wyświetlenie modalu z przypomnieniem
    setShowReminderModal(true);

    // Opcjonalnie: usunięcie tego konkretnego czasu z listy przypomnień dla trybu "ZA"
    if (client.reminderMode === "before") {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === client.id && c.reminderTimes) {
            let updatedTimes = [...c.reminderTimes];

            if (client.reminderStartMode === "from_now") {
              // W trybie "od teraz" usuwamy czas który odpowiada upłyniętym minutom od ustawienia przypomnienia
              if (elapsedMinutesFromReminderSet !== undefined) {
                updatedTimes = updatedTimes.filter(
                  (time) => time !== elapsedMinutesFromReminderSet
                );
              } else {
                // Fallback jeśli nie przekazano parametru
                updatedTimes = updatedTimes.filter(
                  (time) => time !== remainingMinutes
                );
              }
            } else if (client.reminderStartMode === "from_start") {
              // W trybie "od startu" usuwamy czas który odpowiada upłyniętym minutom od startu
              const start = DateTime.fromISO(client.startTime);
              const now = DateTime.now();
              const elapsedMinutes = Math.floor(
                now.diff(start, "minutes").minutes
              );
              updatedTimes = updatedTimes.filter(
                (time) => time !== elapsedMinutes
              );
            }

            // Jeśli nie ma już więcej przypomnień, usuwamy flagę reminder
            if (updatedTimes.length === 0) {
              return { ...c, reminderTimes: updatedTimes, reminder: false };
            }
            return { ...c, reminderTimes: updatedTimes };
          }
          return c;
        })
      );
    }
    // Dla trybu "CO" oznaczamy która minuta została wywołana (żeby po zamknięciu nie wywoływało się wciąż to samo)
    if (client.reminderMode === "every") {
      const start = DateTime.fromISO(client.startTime);
      const now = DateTime.now();
      const elapsedMinutes = Math.floor(now.diff(start, "minutes").minutes);
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id
            ? { ...c, lastEveryTriggeredMinute: elapsedMinutes }
            : c
        )
      );
    }
  };

  // Function to check for clients that need reminders and display them
  const checkAndShowReminders = () => {
    const now = DateTime.now();

    clients.forEach((client) => {
      if (
        client.reminder &&
        client.reminderTimes &&
        client.reminderTimes.length > 0 &&
        !client.isPaused
      ) {
        const remainingTime = getRemainingTime(
          client.startTime,
          client.duration,
          client.isPaused,
          client.pauseStartTime
        );

        // W zależności od trybu przypomnienia, sprawdzamy czas w różny sposób
        if (client.reminderMode === "before") {
          // Tryb "ZA"
          if (client.reminderStartMode === "from_start") {
            // Liczone od rozpoczęcia gry, sprawdzamy czy upłynęło tyle minut od rozpoczęcia
            const start = DateTime.fromISO(client.startTime);
            const elapsedMinutes = Math.floor(
              now.diff(start, "minutes").minutes
            );

            if (client.reminderTimes.includes(elapsedMinutes)) {
              triggerReminder(client, remainingTime.minutes, elapsedMinutes);
            }
          } else if (client.reminderStartMode === "from_now") {
            // Liczone od momentu ustawienia przypomnienia
            if (client.reminderSetTime) {
              const reminderSetTime = DateTime.fromISO(client.reminderSetTime);
              const elapsedMinutesFromReminderSet = Math.floor(
                now.diff(reminderSetTime, "minutes").minutes
              );

              // Sprawdzamy, czy upłynęła taka liczba minut, jaka jest w przypomnieniu
              client.reminderTimes?.forEach((reminderTime) => {
                if (elapsedMinutesFromReminderSet === reminderTime) {
                  // Przekazujemy aktualny czas od ustawienia przypomnienia, aby wiedzieć który usunąć
                  triggerReminder(
                    client,
                    remainingTime.minutes,
                    elapsedMinutesFromReminderSet
                  );
                }
              });
            } else {
              // Jeśli nie ma ustawionego czasu przypomnienia, zachowujemy stare zachowanie
              if (client.reminderTimes.includes(remainingTime.minutes)) {
                triggerReminder(
                  client,
                  remainingTime.minutes,
                  remainingTime.minutes
                );
              }
            }
          } else {
            // Domyślnie, jeśli nie ustawiono trybu, używamy czasu od rozpoczęcia gry
            const start = DateTime.fromISO(client.startTime);
            const elapsedMinutes = Math.floor(
              now.diff(start, "minutes").minutes
            );

            if (client.reminderTimes.includes(elapsedMinutes)) {
              triggerReminder(client, remainingTime.minutes, elapsedMinutes);
            }
          }
        } else if (client.reminderMode === "every") {
          // Tryb "CO" - czas jest zawsze liczony od rozpoczęcia gry
          // Sprawdzamy czy upłynęła wielokrotność wybranego czasu
          const start = DateTime.fromISO(client.startTime);
          const elapsedMinutes = Math.floor(now.diff(start, "minutes").minutes);
          const reminderInterval = client.reminderTimes[0] || 15; // Domyślnie 15 minut
          // Jeśli już wcześniej potwierdzono przypomnienie dla tej minuty, pomiń
          if (client.lastEveryTriggeredMinute === elapsedMinutes) return;

          if (elapsedMinutes > 0 && elapsedMinutes % reminderInterval === 0) {
            triggerReminder(client, remainingTime.minutes, elapsedMinutes);
          }
        }
      }
    });
  };

  // Function to get payment amount based on duration, start time, and number of players
  const getPaymentAmount = (
    duration: number,
    startTime: string,
    players: number
  ): number => {
    const start = DateTime.fromISO(startTime);
    const isWeekend = [5, 6, 7].includes(start.weekday);
    const rate = isWeekend ? 45 : 39;
    return (rate / 30) * duration * players;
  };

  // Function to get single player amount based on duration and start time
  const getSinglePlayerAmount = (
    duration: number,
    startTime: string
  ): number => {
    const start = DateTime.fromISO(startTime);
    const isWeekend = [5, 6, 7].includes(start.weekday);
    const rate = isWeekend ? 45 : 39;
    return (rate / 30) * duration;
  };

  // Helper function to format time for stopwatch and timer
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Stopwatch functions
  const startStopwatch = () => {
    setStopwatchStartTime(Date.now() - stopwatchPausedTime * 1000);
    setStopwatchRunning(true);
    setShowStopwatchBubble(true);
  };

  const pauseStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchPausedTime(stopwatchTime);
  };

  const resetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setStopwatchStartTime(null);
    setStopwatchPausedTime(0);
    setMeasurements([]);
    setShowStopwatchBubble(false);
  };

  const measureStopwatch = () => {
    setMeasurements((prev) => [...prev, stopwatchTime]);
  };

  // Timer functions
  const startTimer = () => {
    const totalSeconds = timerMinutes * 60 + timerSeconds;
    setTimerRemainingSeconds(totalSeconds);
    setTimerStartTime(Date.now());
    setTimerRunning(true);
    setShowTimerBubble(true);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
    const newTotalSeconds = Math.floor(timerRemainingSeconds);
    setTimerMinutes(Math.floor(newTotalSeconds / 60));
    setTimerSeconds(newTotalSeconds % 60);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerRemainingSeconds(0);
    setTimerStartTime(null);
    setShowTimerBubble(false);
  };

  // Game management functions
  const availableGames = [
    "Arizona Sunshine",
    "Arizona Sunshine 2",
    "Beat Saber",
    "Elven Assassin",
    "Serious Sam",
    "Pavlov VR",
    "Superhot",
    "Waltz of the Wizard",
    "Spiderman",
    "All in One Sports",
    "Gorilla Tag",
    "Pistol Whip",
    "Private Property",
    "Job Simulator",
    "Half-Life Alyx",
    "Blade & Sorcery",
    "Rec Room",
  ];

  const updateIndividualGame = (index: number, game: string) => {
    const updatedGames = [...individualGames];
    updatedGames[index] = game;
    setIndividualGames(updatedGames);
  };

  const startGameSegment = (
    clientId: string,
    gameType: string,
    playerIndexes: number[] = []
  ) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id === clientId) {
          // Zakończ poprzedni segmenty tylko jeśli dotyczą tych samych graczy
          const updatedSegments = (client.gameSegments || []).map((segment) => {
            if (!segment.endTime) {
              // Jeśli nie podano konkretnych indeksów graczy (playerIndexes.length === 0)
              // traktujemy to jako "dla wszystkich" i kończymy każdy aktywny segment.
              const shouldEnd =
                playerIndexes.length === 0 ||
                segment.players.some((p) => playerIndexes.includes(p));
              if (shouldEnd) {
                return {
                  ...segment,
                  endTime: DateTime.now().toISO(),
                  duration: Math.floor(
                    DateTime.now().diff(
                      DateTime.fromISO(segment.startTime),
                      "minutes"
                    ).minutes
                  ),
                };
              }
            }
            return segment;
          });

          // Dodaj nowy segment
          const newSegment: GameSegment = {
            gameType,
            startTime: DateTime.now().toISO(),
            duration: 0,
            players:
              playerIndexes.length > 0
                ? playerIndexes
                : Array.from({ length: client.players || 1 }, (_, i) => i),
          };

          return {
            ...client,
            gameSegments: [...updatedSegments, newSegment],
          };
        }
        return client;
      })
    );
  };

  const getCurrentGameDisplay = (
    client: ClientGame,
    station?: number
  ): string => {
    if (!client.hasGameSelection) return "";

    const activeSegments =
      client.gameSegments?.filter((seg) => !seg.endTime) || [];

    if (activeSegments.length === 0) {
      if (client.gameMode === "same") {
        return client.gameType || "";
      } else {
        // For different games mode, show specific game for this station
        if (station && client.individualGames && client.stations) {
          // Find the index of this station in client.stations array (this gives us player index)
          const playerIndex = client.stations.indexOf(station);
          if (playerIndex !== -1 && client.individualGames[playerIndex]) {
            return client.individualGames[playerIndex];
          }
        }
        return client.individualGames?.filter((g) => g).length
          ? "Różne gry"
          : "";
      }
    }

    if (client.gameMode === "same") {
      const currentGame = activeSegments[0]?.gameType;
      return currentGame || "";
    } else {
      // For different games mode with active segments
      if (station && activeSegments.length > 0 && client.stations) {
        // Find player index for this station
        const playerIndex = client.stations.indexOf(station);
        if (playerIndex !== -1) {
          // Find segment that includes this player
          const stationSegment = activeSegments.find((seg) =>
            seg.players.includes(playerIndex)
          );
          if (stationSegment) {
            return stationSegment.gameType;
          }
        }
      }
      return activeSegments.length > 1
        ? "Różne gry"
        : activeSegments[0]?.gameType || "";
    }
  };

  // Bubble dragging functions
  const handleStopwatchMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setActiveBox("stopwatch");
    setDragOffset({
      x: e.clientX - stopwatchBubblePosition.x,
      y: e.clientY - stopwatchBubblePosition.y,
    });
  };

  const handleTimerMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setActiveBox("timer");
    setDragOffset({
      x: e.clientX - timerBubblePosition.x,
      y: e.clientY - timerBubblePosition.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && activeBox) {
      if (activeBox === "stopwatch") {
        setStopwatchBubblePosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (activeBox === "timer") {
        setTimerBubblePosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveBox(null);
  };

  // Function to handle changes in the number of players
  const handlePeopleChange = (delta: number) => {
    const newCount = Math.max(
      1,
      Math.min(8 - takenStationsCount, peopleCount + delta)
    );
    setPeopleCount(newCount);

    const usedSlots = clients.flatMap((c) => c.stations);
    const availableSlots = Object.keys(stanowiskoLabels)
      .map(Number)
      .filter((s) => !usedSlots.includes(s));

    const newSlots = Array(newCount)
      .fill(null)
      .map((_, i) => availableSlots[i] || availableSlots[0] || 1);

    setSlots(newSlots);
  };

  // Function to handle adding a new client or updating an existing one
  const handleAddClient = () => {
    const uniqueSlots = new Set(slots);
    if (uniqueSlots.size !== slots.length) {
      // znajdź indeksy duplikatów
      const duplicates: number[] = [];
      slots.forEach((val, idx) => {
        if (slots.indexOf(val) !== idx && !duplicates.includes(idx)) {
          duplicates.push(idx);
        }
      });
      setDuplicateSlots(duplicates);
      setShowDuplicateError(true);
      return;
    }
    setDuplicateSlots([]);
    setShowDuplicateError(false);

    const now = customStartEnabled
      ? DateTime.now()
          .set({
            hour: customHour,
            minute: customMinute,
            second: 0,
            millisecond: 0,
          })
          .toJSDate()
      : new Date();

    const stations = [...slots];

    if (editId) {
      setClients((prev) =>
        prev.map((client) =>
          client.id === editId
            ? {
                ...client,
                players: peopleCount,
                stations,
                duration,
                paid,
                startTime: customStartEnabled
                  ? DateTime.now()
                      .set({
                        hour: customHour,
                        minute: customMinute,
                        second: 0,
                        millisecond: 0,
                      })
                      .toISO()
                  : client.startTime,
                customPrice: customPriceEnabled
                  ? customPrice ?? undefined
                  : undefined,
                customStart: customStartEnabled,
                comment: addComment ? comment : undefined,
                reminder: addReminder,
                reminderTimes: addReminder ? reminderTimes : undefined,
                reminderMode: addReminder ? reminderMode : undefined,
                reminderText:
                  addReminder && reminderText ? reminderText : undefined,
                reminderStartMode: addReminder ? reminderStartMode : undefined,
                reminderSetTime:
                  addReminder && reminderStartMode === "from_now"
                    ? DateTime.now().toISO()
                    : client.reminderSetTime,
                // Game fields update
                hasGameSelection,
                gameMode: hasGameSelection ? gameMode : undefined,
                gameType:
                  hasGameSelection && gameMode === "same"
                    ? gameType
                    : undefined,
                individualGames:
                  hasGameSelection && gameMode === "different"
                    ? individualGames
                    : undefined,
                // Keep existing gameSegments when editing
              }
            : client
        )
      );

      // Start new game segment if game changed and game selection is enabled
      if (hasGameSelection) {
        const editedClient = clients.find((c) => c.id === editId);
        if (editedClient) {
          if (
            gameMode === "same" &&
            gameType &&
            gameType !== editedClient.gameType
          ) {
            startGameSegment(editId, gameType);
          } else if (
            gameMode === "different" &&
            individualGames.some(
              (game, i) =>
                game && game !== (editedClient.individualGames?.[i] || "")
            )
          ) {
            // Start segments for changed individual games
            individualGames.forEach((game, i) => {
              if (game && game !== (editedClient.individualGames?.[i] || "")) {
                startGameSegment(editId, game, [i]);
              }
            });
          }
        }
      }

      setEditId(null);
    } else {
      const newClient: ClientGame = {
        id: uuidv4(),
        stations,
        players: peopleCount,
        duration,
        startTime: now.toISOString(),
        paid,
        customPrice: customPriceEnabled ? customPrice ?? undefined : undefined,
        customStart: customStartEnabled,
        comment: addComment ? comment : undefined,
        reminder: addReminder,
        reminderTimes: addReminder ? reminderTimes : undefined,
        reminderMode: addReminder ? reminderMode : undefined,
        reminderText: addReminder && reminderText ? reminderText : undefined,
        reminderStartMode: addReminder ? reminderStartMode : undefined,
        reminderSetTime:
          addReminder && reminderStartMode === "from_now"
            ? DateTime.now().toISO()
            : undefined,
        // Game fields
        hasGameSelection,
        gameMode: hasGameSelection ? gameMode : undefined,
        gameType:
          hasGameSelection && gameMode === "same" ? gameType : undefined,
        individualGames:
          hasGameSelection && gameMode === "different"
            ? individualGames
            : undefined,
        gameSegments: hasGameSelection ? [] : undefined,
      };
      setClients((prev) => [...prev, newClient]);

      // Start initial game segment if game selection is enabled
      if (hasGameSelection) {
        setTimeout(() => {
          if (gameMode === "same" && gameType) {
            startGameSegment(newClient.id, gameType);
          } else if (
            gameMode === "different" &&
            individualGames.some((g) => g)
          ) {
            // For different games, start segments for each player with their game
            individualGames.forEach((game, index) => {
              if (game) {
                startGameSegment(newClient.id, game, [index]);
              }
            });
          }
        }, 100);
      }
    }

    resetForm();
  };

  // Function to handle deleting a client
  const handleDeleteClient = (id: string) => {
    setClients((prev) => {
      const toRemove = prev.find((c) => c.id === id);
      if (toRemove) {
        try {
          // If client wasn't paid, treat deletion as paid (we don't release without payment)
          if (!toRemove.paid) {
            const copyPaid = { ...toRemove, paid: true } as ClientGame;
            recordClientToStats(copyPaid);
          } else {
            recordClientToStats(toRemove);
          }
        } catch (e) {
          console.error("Failed to record stats for removed client", e);
        }
      }
      return prev.filter((client) => client.id !== id);
    });
  };

  // Remove client without recording to stats
  const handleDeleteClientWithoutStats = (id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  // Function to handle pausing and resuming a game
  const handlePauseResumeGame = (clientId: string) => {
    setClients((prev) => {
      return prev.map((client) => {
        if (client.id !== clientId) return client;

        const now = DateTime.now();

        if (client.isPaused && client.pauseStartTime) {
          // Wznowienie gry - przesuwamy czas startowy o czas trwania pauzy
          const pauseStartTime = DateTime.fromISO(client.pauseStartTime);
          const pauseDuration = now.diff(pauseStartTime);

          // Przesunięcie czasu startowego o czas trwania pauzy
          const newStartTime = DateTime.fromISO(client.startTime)
            .plus({ milliseconds: pauseDuration.milliseconds })
            .toISO();
          // Jeśli przypomnienie było ustawione "od teraz", przesuwamy także reminderSetTime
          let newReminderSetTime: string | undefined = undefined;
          if (
            client.reminderStartMode === "from_now" &&
            client.reminderSetTime
          ) {
            try {
              newReminderSetTime =
                DateTime.fromISO(String(client.reminderSetTime))
                  .plus({ milliseconds: pauseDuration.milliseconds })
                  .toISO() ?? undefined;
            } catch (e) {
              // jeśli parsowanie się nie uda, zachowujemy oryginalny reminderSetTime
            }
          }

          // Mark the last pause in pauseHistory with endTime
          const newPauseHistory = (client.pauseHistory || []).slice();
          if (newPauseHistory.length > 0) {
            const lastIdx = newPauseHistory.length - 1;
            if (!newPauseHistory[lastIdx].endTime) {
              newPauseHistory[lastIdx] = {
                ...newPauseHistory[lastIdx],
                endTime: now.toISO(),
              };
            }
          }

          return {
            ...client,
            startTime: newStartTime,
            isPaused: false,
            pauseStartTime: undefined,
            pauseHistory: newPauseHistory,
            reminderSetTime: newReminderSetTime,
          } as ClientGame;
        } else {
          // Wstrzymanie gry
          // Add a new pause record with startTime (endTime will be set on resume)
          const newPauseHistory = (client.pauseHistory || []).slice();
          newPauseHistory.push({ startTime: now.toISO() });

          return {
            ...client,
            isPaused: true,
            pauseStartTime: now.toISO(),
            pauseHistory: newPauseHistory,
          } as ClientGame;
        }
      });
    });
  };

  // Function to handle moving a client to a new station using drag and drop
  const handleDragClient = (
    clientId: string,
    newStationId: number,
    draggedStationId?: number
  ) => {
    // Obsługa klientów przypisanych do stanowisk
    setClients((prev) => {
      // Znajdujemy przeciąganego klienta
      const draggedClient = prev.find((c) => c.id === clientId);
      if (!draggedClient) return prev;

      // Sprawdzamy, czy to jest przeciąganie w obrębie tej samej grupy (ten sam klient)
      const isSameGroupDrag =
        draggedStationId !== undefined &&
        draggedClient.stations.length > 1 &&
        draggedClient.stations.includes(draggedStationId) &&
        draggedClient.stations.includes(newStationId);

      // Jeśli jest to przeciąganie w obrębie tej samej grupy, obsługujemy to inaczej
      if (isSameGroupDrag) {
        return prev.map((client) => {
          if (client.id === clientId) {
            // Kopiujemy stanowiska
            const newStations = [...client.stations];

            // Usuwamy nowe stanowisko z listy (jeśli już tam jest)
            const existingNewStationIndex = newStations.indexOf(newStationId);
            if (existingNewStationIndex !== -1) {
              // Zamieniamy miejscami ze stanowiskiem przeciąganym
              const draggedStationIndex = newStations.indexOf(
                draggedStationId!
              );
              if (draggedStationIndex !== -1) {
                // Zamieniamy stanowiska miejscami
                [
                  newStations[draggedStationIndex],
                  newStations[existingNewStationIndex],
                ] = [
                  newStations[existingNewStationIndex],
                  newStations[draggedStationIndex],
                ];
              }
            }

            return { ...client, stations: newStations };
          }
          return client;
        });
      }

      // Sprawdzamy, czy nowe stanowisko jest już zajęte przez innego klienta
      const occupyingClient = prev.find(
        (c) => c.id !== clientId && c.stations.includes(newStationId)
      );

      // Jeśli miejsce jest już zajęte, wykonujemy zamianę miejscami
      if (occupyingClient) {
        // Tworzymy nową tablicę klientów
        let updatedClients = [...prev];

        // Dla grup z wieloma osobami
        if (draggedClient.stations.length > 1 && draggedStationId) {
          // Kopiujemy klienta i modyfikujemy jego stanowiska
          const updatedDraggedClient = { ...draggedClient };
          const draggedStations = [...updatedDraggedClient.stations];
          const draggedIndex = draggedStations.indexOf(draggedStationId);

          if (draggedIndex !== -1) {
            // Zmieniamy stanowisko przeciąganego klienta
            draggedStations[draggedIndex] = newStationId;
            updatedDraggedClient.stations = draggedStations;

            // Znajdujemy klienta zajmującego docelowe stanowisko
            const occupierIndex = updatedClients.findIndex(
              (c) => c.id === occupyingClient.id
            );
            if (occupierIndex !== -1) {
              const updatedOccupier = { ...updatedClients[occupierIndex] };

              // Jeśli zajmujący też ma wiele stanowisk
              if (updatedOccupier.stations.length > 1) {
                const occupierStations = [...updatedOccupier.stations];
                const occupiedIndex = occupierStations.indexOf(newStationId);

                if (occupiedIndex !== -1) {
                  // Zamieniamy stanowisko zajmującego klienta
                  occupierStations[occupiedIndex] = draggedStationId;
                  updatedOccupier.stations = occupierStations;

                  // Aktualizujemy obu klientów
                  updatedClients[occupierIndex] = updatedOccupier;
                  updatedClients = updatedClients.map((c) =>
                    c.id === draggedClient.id ? updatedDraggedClient : c
                  );

                  return updatedClients;
                }
              } else {
                // Dla pojedynczego klienta zajmującego miejsce
                updatedOccupier.stations = [draggedStationId];
                updatedClients[occupierIndex] = updatedOccupier;
                updatedClients = updatedClients.map((c) =>
                  c.id === draggedClient.id ? updatedDraggedClient : c
                );

                return updatedClients;
              }
            }
          }
        } else {
          // Dla pojedynczych klientów przeciąganych na grupę lub pojedynczego klienta
          const updatedDraggedClient = {
            ...draggedClient,
            stations: [newStationId],
          };

          // Znajdujemy klienta zajmującego docelowe stanowisko
          const occupierIndex = updatedClients.findIndex(
            (c) => c.id === occupyingClient.id
          );
          if (occupierIndex !== -1) {
            // Tworzymy kopię zajmującego klienta
            const updatedOccupier = { ...updatedClients[occupierIndex] };

            // Sprawdzamy czy zajmujący jest grupą
            if (updatedOccupier.stations.length > 1) {
              // Jeśli zajmujący to grupa, znajdujemy indeks zajmowanego stanowiska
              const occupierStations = [...updatedOccupier.stations];
              const occupiedIndex = occupierStations.indexOf(newStationId);

              // Jeśli przeciągamy z konkretnego stanowiska
              if (draggedStationId) {
                // Tylko zamieniamy jedno stanowisko w grupie
                if (occupiedIndex !== -1) {
                  occupierStations[occupiedIndex] = draggedStationId;
                  updatedOccupier.stations = occupierStations;
                }
              } else if (draggedClient.stations.length > 0) {
                // Jeśli nie mamy konkretnego stanowiska, używamy pierwszego z listy
                if (occupiedIndex !== -1) {
                  occupierStations[occupiedIndex] = draggedClient.stations[0];
                  updatedOccupier.stations = occupierStations;
                }
              }

              updatedClients[occupierIndex] = updatedOccupier;
            } else {
              // Jeśli zajmujący to pojedynczy klient
              // Jeśli przeciągamy z konkretnego stanowiska
              if (draggedStationId) {
                updatedOccupier.stations = [draggedStationId];
              } else if (draggedClient.stations.length > 0) {
                // Jeśli nie mamy konkretnego stanowiska, używamy pierwszego z listy
                updatedOccupier.stations = [draggedClient.stations[0]];
              }

              updatedClients[occupierIndex] = updatedOccupier;
            }
          }

          updatedClients = updatedClients.map((c) =>
            c.id === draggedClient.id ? updatedDraggedClient : c
          );

          return updatedClients;
        }
      }

      // Jeśli miejsce nie jest zajęte, wykonujemy standardową operację
      return prev.map((client) => {
        if (client.id === clientId) {
          // Dla grup z wieloma osobami sprawdzamy, czy mamy informację o przeciąganym stanowisku
          if (client.stations.length > 1 && draggedStationId) {
            // Tworzymy nową tablicę stanowisk
            const newStations = [...client.stations];
            // Znajdujemy indeks przeciąganego stanowiska
            const draggedIndex = newStations.indexOf(draggedStationId);
            if (draggedIndex !== -1) {
              // Zamieniamy to stanowisko na nowe
              newStations[draggedIndex] = newStationId;
              return { ...client, stations: newStations };
            }
          } else {
            // Dla pojedynczych osób, po prostu zmieniamy stanowisko
            return { ...client, stations: [newStationId] };
          }
        }
        return client;
      });
    });
  };

  const handleEditClient = (client: ClientGame) => {
    if (editId === client.id) {
      // Jeśli klikamy edycję tego samego klienta -> wyłącz edycję
      setEditId(null);
      resetForm(); // pełne resetowanie
      setAddComment(false);
    } else {
      setEditId(client.id);
      setPeopleCount(client.players);
      setSplitEnabled(false);
      setSplitGroupsCount(2);
      setSplitGroups(
        Array.from({ length: 2 }, (_, i) => ({
          players:
            i === 0
              ? Math.ceil(client.players / 2)
              : Math.floor(client.players / 2),
          stations: [client.stations[i] ?? null],
        }))
      );
      setSplitError(false);
      setSlots(client.stations);
      setDuration(client.duration);
      setPaid(client.paid);
      setCustomPrice(client.customPrice ?? null);
      setCustomPriceEnabled(client.customPrice != null);

      //customStart
      const start = DateTime.fromISO(client.startTime);
      setCustomStartEnabled(client.customStart ?? false);
      setCustomHour(start.hour);
      setCustomMinute(start.minute);
      setAddComment(!!client.comment);
      setComment(client.comment ?? "");
      setAddReminder(!!client.reminder);
      setReminderCount(client.reminderTimes?.length || 1);
      setReminderMode(client.reminderMode || "before");
      setReminderTimes(client.reminderTimes || [15]);
      setReminderText(client.reminderText || "");
      setReminderStartMode(client.reminderStartMode || "from_start");

      // Load game fields
      setHasGameSelection(client.hasGameSelection || false);
      setGameMode(client.gameMode || "same");
      setGameType(client.gameType || "");
      setIndividualGames(client.individualGames || []);
    }
  };

  // Function to handle adding a client to the queue
  const handleSplitGroup = () => {
    const sum = splitGroups.reduce((a, g) => a + g.players, 0);
    const allStations = splitGroups.flatMap((g) => g.stations);
    const duplicates: number[] = [];
    allStations.forEach((val, idx) => {
      if (allStations.indexOf(val) !== idx && !duplicates.includes(idx)) {
        duplicates.push(idx);
      }
    });
    if (
      sum !== peopleCount ||
      allStations.some((s) => s == null) ||
      new Set(allStations).size !== allStations.length
    ) {
      setSplitError(true);
      return;
    }
    // Podziel grupę
    if (!editId) return;
    const client = clients.find((c) => c.id === editId);
    if (!client) return;
    const newGroups = splitGroups.map((g) => ({
      ...client,
      id: uuidv4(),
      players: g.players,
      stations: g.stations,
    }));
    setClients((prev) => prev.filter((c) => c.id !== editId).concat(newGroups));
    setEditId(null);
    setSplitEnabled(false);
    resetForm();
  };

  // Function to handle adding a client to the queue
  const handleRemoveFromGroup = (names: string[], prices: (number | "")[]) => {
    if (!editId) return;
    const client = clients.find((c) => c.id === editId);
    if (!client) return;

    let updatedStations = [...client.stations];
    let updatedPlayers = client.players;
    let updatedPaid = client.paid;
    let updatedCustomPrice = client.customPrice;

    let queueToAdd: ClientGame[] = [];
    let removedNames: string[] = [];

    removeStations.forEach((station, idx) => {
      const option = removeOptions[idx];
      if (option?.type === "paid") {
        updatedStations = updatedStations.filter((s) => s !== station);
        updatedPlayers--;
      } else if (option?.type === "toPay") {
        updatedStations = updatedStations.filter((s) => s !== station);
        updatedPlayers--;
        const now = DateTime.now().toISO();
        // Użyj nazwy stanowiska do komentarza
        const stationLabel =
          stanowiskoLabels[station] || `Stanowisko ${station}`;
        removedNames.push(stationLabel);

        const playedMinutes = Math.max(
          0,
          Math.floor(
            DateTime.now().diff(DateTime.fromISO(client.startTime), "minutes")
              .minutes
          )
        );

        queueToAdd.push({
          id: uuidv4(),
          name: names[idx] !== undefined ? names[idx] : "",
          stations: [station],
          players: 1,
          duration: client.duration,
          startTime: now,
          paid: false,
          customPrice: prices[idx] !== "" ? Number(prices[idx]) : undefined,
          customStart: client.customStart,
          comment: "Do zapłaty (kolejka)",
          queue: true,
          playedMinutes,
        } as any);
      }
    });

    setClients((prev) =>
      prev
        .map((c) => {
          if (c.id === editId) {
            let newComment = c.comment || "";
            if (removedNames.length) {
              const newPart = `W kolejce oczekuje płatność za: ${removedNames.join(
                " + "
              )}`;
              if (!newComment) {
                newComment = newPart;
              } else if (!newComment.includes(newPart)) {
                newComment = `${newComment} + ${newPart}`;
              }
            }
            return {
              ...c,
              stations: updatedStations,
              players: updatedPlayers,
              paid: updatedPaid,
              customPrice: updatedCustomPrice,
              comment: newComment,
            };
          }
          return c;
        })
        .filter((c) => c.players > 0)
    );

    setQueueClients((prev) => [...prev, ...queueToAdd]);
    setRemoveFromGroupEnabled(false);
    setRemoveCount("");
    setRemoveStations([]);
    setRemoveOptions([]);
    setEditId(null);
    resetForm();
  };

  // Function to handle adding a client to the queue
  const occupiedStations = clients
    .filter((c) => c.id !== editId)
    .flatMap((client) => client.stations);

  // Calculate the total number of stations taken by all clients
  const takenStationsCount = clients.reduce(
    (total, client) => total + client.stations.length,
    0
  );

  // Check if all stations are taken (8 total)
  const allStationsTaken = !editId && takenStationsCount >= 8;

  // Define the order of stations for sorting
  const sortedStationOrder = [1, 2, 5, 6, 8, 7, 3, 4];

  // Function to get sorted clients based on the current sort configuration
  const getSortedClients = () => {
    if (!sortConfig.key || !sortConfig.direction) return clients;

    const sorted = [...clients];

    sorted.sort((a, b) => {
      switch (sortConfig.key) {
        case "players":
          return sortConfig.direction === "asc"
            ? a.players - b.players
            : b.players - a.players;
        case "stations":
          const aStations = a.stations
            .map((s) => stanowiskoLabels[s])
            .join(", ");
          const bStations = b.stations
            .map((s) => stanowiskoLabels[s])
            .join(", ");
          return sortConfig.direction === "asc"
            ? aStations.localeCompare(bStations)
            : bStations.localeCompare(aStations);
        case "duration":
          return sortConfig.direction === "asc"
            ? a.duration - b.duration
            : b.duration - a.duration;
        case "start":
          return sortConfig.direction === "asc"
            ? DateTime.fromISO(a.startTime).toMillis() -
                DateTime.fromISO(b.startTime).toMillis()
            : DateTime.fromISO(b.startTime).toMillis() -
                DateTime.fromISO(a.startTime).toMillis();
        case "end":
          const aEnd = calculateEndTime(a.startTime, a.duration).toMillis();
          const bEnd = calculateEndTime(b.startTime, b.duration).toMillis();
          return sortConfig.direction === "asc" ? aEnd - bEnd : bEnd - aEnd;
        case "remaining":
          const aRem = getRemainingTime(
            a.startTime,
            a.duration,
            a.isPaused,
            a.pauseStartTime
          ).minutes;
          const bRem = getRemainingTime(
            b.startTime,
            b.duration,
            b.isPaused,
            b.pauseStartTime
          ).minutes;
          return sortConfig.direction === "asc" ? aRem - bRem : bRem - aRem;
        case "paid":
          // First sort by paid status
          if (a.paid !== b.paid) {
            return sortConfig.direction === "asc"
              ? a.paid
                ? -1
                : 1
              : a.paid
              ? 1
              : -1;
          }
          // If paid status is the same, sort by remaining time
          const aAmount =
            a.customPrice != null
              ? a.customPrice * a.players
              : getPaymentAmount(a.duration, a.startTime, a.players);
          const bAmount =
            b.customPrice != null
              ? b.customPrice * b.players
              : getPaymentAmount(b.duration, b.startTime, b.players);
          return bAmount - aAmount;
        default:
          return 0;
      }
    });

    return sorted;
  };

  // Function to handle sorting clients by a specific key
  const handleSort = (key: string, twoWay = false) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        // First click: ascending sort
        return { key, direction: "asc" };
      } else if (prev.direction === "asc") {
        // Second click: descending sort
        return { key, direction: twoWay ? "desc" : null };
      } else if (prev.direction === "desc") {
        // Third click: reset sort
        return { key: null, direction: null };
      } else {
        // Reset sort
        return { key: null, direction: null };
      }
    });
  };

  return (
    <section className="bg-[#0f1525] text-white px-6 py-10 min-h-screen">
      {/* Main container for the client management page */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 bg-[#1e2636] p-6 rounded-lg shadow-md">
          <div className="flex ">
            <h2 className="text-xl font-bold text-[#00d9ff] mb-4 uppercase">
              {subpage === "main"
                ? "Zarządzaj klientami"
                : subpage === "stoper"
                ? "Stoper i Minutnik"
                : "Statystyki"}
            </h2>
            <div className="flex flex-1 gap-2 justify-end">
              <button
                className={`w-8 h-8 rounded flex items-center justify-center transition ${
                  subpage === "main"
                    ? "bg-[#0f1525] text-gray-300 shadow"
                    : "bg-[#1e2636] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Strona główna"
                onClick={() => setSubpage("main")}
              >
                <FaHome size={18} />
              </button>
              <button
                className={`w-8 h-8 rounded flex items-center justify-center transition ${
                  subpage === "stoper"
                    ? "bg-[#0f1525] text-gray-300 shadow"
                    : "bg-[#1e2636] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Stoper"
                onClick={() => setSubpage("stoper")}
              >
                <FaClock size={18} />
              </button>
              <button
                className={`w-8 h-8 rounded flex items-center justify-center transition ${
                  subpage === "stats"
                    ? "bg-[#0f1525] text-gray-300 shadow"
                    : "bg-[#1e2636] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Statystyki"
                onClick={() => setSubpage("stats")}
              >
                <FaChartBar size={20} />
              </button>
            </div>
          </div>

          {/* Form for adding or editing a client */}
          {subpage === "main" && (
            <div>
              <div className="mb-4">
                <label className="block mb-1 text-sm">Liczba osób:</label>
                <div className="flex items-center gap-2">
                  {/* Button to decrease the number of players */}
                  <button
                    onClick={() => handlePeopleChange(-1)}
                    className="w-7 h-7 flex items-center justify-center bg-[#00d9ff] text-black font-bold rounded disabled:opacity-50 transition"
                    disabled={peopleCount <= 1}
                    style={{ minWidth: "1rem", minHeight: "1rem" }}
                    type="button"
                  >
                    -
                  </button>
                  <span
                    className="inline-flex items-center justify-center text-lg font-bold"
                    style={{ width: "1.25rem", textAlign: "center" }}
                  >
                    {peopleCount}
                  </span>
                  {/* Button to increase the number of players */}
                  <button
                    onClick={() => handlePeopleChange(1)}
                    className="w-7 h-7 flex items-center justify-center bg-[#00d9ff] text-black font-bold rounded disabled:opacity-50 transition"
                    disabled={peopleCount >= 8 || allStationsTaken}
                    style={{ minWidth: "1rem", minHeight: "1rem" }}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Select dropdown for player slots */}
              {Array.from({ length: peopleCount }).map((_, i) => (
                <div key={i} className="mb-2">
                  <label className="block text-sm">
                    Stanowisko dla gracza {i + 1}:
                  </label>
                  <select
                    value={slots[i]}
                    onChange={(e) => {
                      const updated = [...slots];
                      updated[i] = parseInt(e.target.value);
                      setSlots(updated);
                      setDuplicateSlots([]); // Reset duplicate slots when changing a slot
                      setShowDuplicateError(false);
                    }}
                    className={`w-full p-2 rounded bg-[#0f1525] border ${
                      duplicateSlots.includes(i)
                        ? "border-red-500"
                        : "border-gray-600"
                    } text-white`}
                  >
                    {sortedStationOrder
                      .filter(
                        (stationId) =>
                          !occupiedStations.includes(stationId) ||
                          slots[i] === stationId
                      )
                      .map((stationId) => (
                        <option key={stationId} value={stationId}>
                          {stanowiskoLabels[stationId]}
                        </option>
                      ))}
                  </select>
                </div>
              ))}

              {/* Error message for duplicate slots */}
              {showDuplicateError && (
                <div className="mb-4 text-red-500 text-sm">
                  Wszystkie stanowiska muszą być unikalne!
                </div>
              )}

              {/* Button to add or update the client */}
              <div className="mb-4">
                <label className="block mb-1 text-sm">Czas gry (minuty):</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[30, 15, 5, 1].map((val) => (
                    <button
                      key={`plus-${val}`}
                      onClick={() => setDuration((prev) => prev + val)}
                      className="px-3 py-1 bg-[#0d7a25] hover:bg-green-600 text-white text-sm rounded"
                      type="button"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[30, 15, 5, 1].map((val) => (
                    <button
                      key={`minus-${val}`}
                      onClick={() =>
                        setDuration((prev) => Math.max(1, prev - val))
                      }
                      className="px-3 py-1 bg-[#911e1e] hover:bg-red-600 text-white text-sm rounded"
                      type="button"
                    >
                      -{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkbox for paid game option */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={customStartEnabled}
                    onChange={() => setCustomStartEnabled(!customStartEnabled)}
                    className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                  />
                  Niestandardowa godzina rozpoczęcia
                </label>

                {customStartEnabled && (
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">Godzina:</label>
                      <input
                        type="number"
                        min={-1}
                        max={24}
                        value={customHour}
                        onChange={(e) => {
                          let newHour = Number(e.target.value);
                          if (newHour < 0) newHour = 23; // Zapętlanie godzin wstecz
                          if (newHour > 23) newHour = 0; // Zapętlanie godzin do przodu
                          setCustomHour(newHour);
                        }}
                        className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">Minuty:</label>
                      <input
                        type="number"
                        min={-1}
                        max={60}
                        value={customMinute}
                        onChange={(e) => {
                          let newMinute = Number(e.target.value);
                          if (newMinute < 0) newMinute = 59; // Zapętlanie minut wstecz
                          if (newMinute > 59) newMinute = 0; // Zapętlanie minut do przodu
                          setCustomMinute(newMinute);
                        }}
                        className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Checkbox for paid game option */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={customPriceEnabled}
                    onChange={() => setCustomPriceEnabled(!customPriceEnabled)}
                    className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                  />
                  Niestandardowa kwota
                </label>

                {customPriceEnabled && (
                  <>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={customPrice ?? ""}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white mb-2"
                      placeholder="Podaj kwotę zł"
                    />

                    <div className="flex flex-wrap gap-2">
                      {[50, 25, 15, 10, 5, 1].map((val) => (
                        <button
                          key={val}
                          onClick={() =>
                            setCustomPrice((prev) => (prev ?? 0) + val)
                          }
                          className="px-3 py-1 bg-[#0d7a25] hover:bg-green-600 text-white text-sm rounded"
                        >
                          +{val}
                        </button>
                      ))}
                      {[50, 25, 15, 10, 5, 1].map((val) => (
                        <button
                          key={`minus-${val}`}
                          onClick={() =>
                            setCustomPrice((prev) =>
                              Math.max(0, (prev ?? 0) - val)
                            )
                          }
                          className="px-3 py-1 bg-[#911e1e] hover:bg-red-600 text-white text-sm rounded"
                        >
                          -{val}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Checkbox for paid game option */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={addComment}
                    onChange={() => setAddComment((v) => !v)}
                    className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                  />
                  Dodaj komentarz
                </label>
                {addComment && (
                  <textarea
                    ref={commentInputRef}
                    className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
                    placeholder="Wpisz komentarz..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                  />
                )}
              </div>

              {/* Checkbox for reminder option */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={addReminder}
                    onChange={() => setAddReminder((v) => !v)}
                    className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                  />
                  Ustaw przypomnienie
                </label>
                {addReminder && (
                  <div className="mt-2 p-3 rounded border-1 border-gray-600">
                    <div className="mb-3">
                      <div className="flex gap-3 items-center mb-2">
                        <label className="block text-sm">
                          Liczba przypomnień:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={reminderCount}
                          onChange={(e) => {
                            const newCount = Math.max(
                              1,
                              Math.min(5, parseInt(e.target.value) || 1)
                            );
                            setReminderCount(newCount);

                            // Dostosuj listę czasów do nowej liczby przypomnień
                            if (newCount > reminderTimes.length) {
                              // Dodaj brakujące czasy
                              const newTimes = [...reminderTimes];
                              for (
                                let i = reminderTimes.length;
                                i < newCount;
                                i++
                              ) {
                                newTimes.push(5);
                              }
                              setReminderTimes(newTimes);
                            } else if (newCount < reminderTimes.length) {
                              // Usuń nadmiarowe czasy
                              setReminderTimes(
                                reminderTimes.slice(0, newCount)
                              );
                            }
                          }}
                          className="w-16 p-1 text-center rounded bg-[#0f1525] border border-gray-600 text-white"
                        />
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <label className="text-sm whitespace-nowrap">
                          Tryb:
                        </label>
                        <select
                          value={reminderMode}
                          onChange={(e) => {
                            const newMode = e.target.value as
                              | "before"
                              | "every";
                            setReminderMode(newMode);
                            if (newMode === "before") {
                              // Przy zmianie na "ZA" ustawiamy domyślne czasy dla wszystkich przypomnień
                              if (reminderMode === "every") {
                                const defaultBeforeTimes = [
                                  15, 10, 5, 3, 1,
                                ].slice(0, reminderCount || 1);
                                setReminderTimes(defaultBeforeTimes);
                              }
                              // Jeśli nie ma żadnych przypomnień, dodajemy jedno domyślne
                              if (
                                !reminderTimes ||
                                reminderTimes.length === 0
                              ) {
                                setReminderTimes([15]);
                                setReminderCount(1);
                              }
                            } else {
                              // Przy zmianie na "CO" automatycznie ustawiamy jedno przypomnienie
                              setReminderCount(1);
                              setReminderTimes([15]);
                            }
                          }}
                          className="p-1 rounded bg-[#0f1525] border border-gray-600 text-white"
                        >
                          <option value="before">ZA</option>
                          <option value="every">CO</option>
                        </select>
                      </div>

                      {reminderMode === "before" && (
                        <div className="flex items-center gap-3 mb-2">
                          <label className="text-sm whitespace-nowrap">
                            Licz od:
                          </label>
                          <select
                            value={reminderStartMode}
                            onChange={(e) =>
                              setReminderStartMode(
                                e.target.value as "from_start" | "from_now"
                              )
                            }
                            className="p-1 rounded bg-[#0f1525] border border-gray-600 text-white"
                          >
                            <option value="from_start">Od startu gry</option>
                            <option value="from_now">Teraz</option>
                          </select>
                        </div>
                      )}

                      {reminderMode === "before" ? (
                        // Tryb "ZA" - pokazujemy tyle inputów, ile przypomnień
                        (reminderTimes.length > 0 ? reminderTimes : [15]).map(
                          (time, index) => (
                            <div
                              key={`reminder-time-${index}`}
                              className="flex items-center gap-2 mb-2"
                            >
                              <label className="text-sm whitespace-nowrap">
                                Przypomnienie {index + 1}:
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={60}
                                value={time}
                                onChange={(e) => {
                                  const newValue = Math.max(
                                    1,
                                    Math.min(60, parseInt(e.target.value) || 1)
                                  );
                                  const newTimes = [...reminderTimes];
                                  newTimes[index] = newValue;
                                  setReminderTimes(newTimes);
                                }}
                                className="w-16 p-1 text-center rounded bg-[#0f1525] border border-gray-600 text-white"
                              />
                              <span className="text-sm text-gray-300">
                                minut
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        // Tryb "CO" - pokazujemy tylko jeden input
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm whitespace-nowrap">
                            Co:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={
                              reminderTimes && reminderTimes.length > 0
                                ? reminderTimes[0]
                                : 15
                            }
                            onChange={(e) => {
                              const newValue = Math.max(
                                1,
                                Math.min(60, parseInt(e.target.value) || 1)
                              );
                              setReminderTimes([newValue]);
                            }}
                            className="w-16 p-1 text-center rounded bg-[#0f1525] border border-gray-600 text-white"
                          />
                          <span className="text-sm text-gray-300">minut</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <label className="block text-sm mb-1">
                        Tekst przypomnienia (opcjonalnie):
                      </label>
                      <textarea
                        className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
                        placeholder="Wpisz tekst przypomnienia..."
                        value={reminderText}
                        onChange={(e) => setReminderText(e.target.value)}
                        rows={1}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Button to add or update the client */}
              {editId && peopleCount > 1 && (
                <>
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={splitEnabled}
                        onChange={() => setSplitEnabled((v) => !v)}
                        className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                      />
                      Podziel grupę
                    </label>
                  </div>
                  {splitEnabled && (
                    <div className="mb-4 mt-2 p-3 rounded  border border-[#00d9ff]">
                      <div className="font-semibold text-[#00d9ff] mb-2">
                        Podział grupy {peopleCount} osobowej
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm">Liczba grup:</label>
                        <select
                          value={splitGroupsCount}
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            setSplitGroupsCount(val);
                            if (val === "" || isNaN(Number(val))) {
                              setSplitGroups([]);
                              return;
                            }
                            const base = Math.floor(peopleCount / Number(val));
                            const rest = peopleCount % Number(val);
                            setSplitGroups(
                              Array.from({ length: Number(val) }, (_, i) => ({
                                players: i < rest ? base + 1 : base,
                                stations: Array(
                                  i < rest ? base + 1 : base
                                ).fill(null),
                              }))
                            );
                            setSplitError(false);
                          }}
                          className="w-24 p-1 rounded bg-[#0f1525] border border-gray-600 text-white"
                        >
                          <option value="">Wybierz...</option>
                          {Array.from(
                            { length: peopleCount - 1 },
                            (_, i) => i + 2
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      {splitGroupsCount !== "" && (
                        <>
                          <table className="w-full text-sm mb-4 bg-[#1e2636] rounded">
                            <thead>
                              <tr>
                                <th className="p-2 text-left border-b border-gray-600">
                                  Grupa
                                </th>
                                <th className="p-2 text-left border-b border-gray-600">
                                  Liczba osób
                                </th>
                                <th className="p-2 text-left border-b border-gray-600">
                                  Stanowiska
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {splitGroups.map((group, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-700"
                                >
                                  <td className="p-2 font-semibold align-top">
                                    Grupa {idx + 1}
                                  </td>
                                  <td className="p-2 align-top">
                                    <input
                                      type="number"
                                      min={1}
                                      max={peopleCount}
                                      value={group.players}
                                      onChange={(e) => {
                                        const val = Math.max(
                                          1,
                                          Math.min(
                                            peopleCount,
                                            Number(e.target.value)
                                          )
                                        );
                                        const updated = [...splitGroups];
                                        const sumOther = updated.reduce(
                                          (acc, g, i2) =>
                                            i2 === idx ? acc : acc + g.players,
                                          0
                                        );
                                        updated[idx].players = Math.max(
                                          1,
                                          Math.min(val, peopleCount - sumOther)
                                        );
                                        if (
                                          updated[idx].stations.length >
                                          updated[idx].players
                                        ) {
                                          updated[idx].stations = updated[
                                            idx
                                          ].stations.slice(
                                            0,
                                            updated[idx].players
                                          );
                                        } else {
                                          updated[idx].stations = [
                                            ...updated[idx].stations,
                                            ...Array(
                                              updated[idx].players -
                                                updated[idx].stations.length
                                            ).fill(null),
                                          ];
                                        }
                                        setSplitGroups(updated);
                                      }}
                                      className="w-16 p-1 rounded bg-[#0f1525] border border-gray-600 text-white"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <div className="flex flex-col gap-2">
                                      {Array.from({
                                        length: group.players,
                                      }).map((_, pIdx) => {
                                        const stationValue =
                                          group.stations[pIdx];
                                        const allStations = splitGroups.flatMap(
                                          (g) => g.stations
                                        );
                                        const isDuplicate =
                                          stationValue &&
                                          allStations.filter(
                                            (s) => s === stationValue
                                          ).length > 1 &&
                                          stationValue !== null;

                                        return (
                                          <select
                                            key={pIdx}
                                            value={stationValue ?? ""}
                                            onChange={(e) => {
                                              const updated = [...splitGroups];
                                              updated[idx].stations[pIdx] =
                                                Number(e.target.value);
                                              setSplitGroups(updated);
                                              setSplitError(false);
                                            }}
                                            className={`w-28 p-1 rounded bg-[#0f1525] border ${
                                              isDuplicate
                                                ? "border-red-500"
                                                : "border-gray-600"
                                            } text-white`}
                                          >
                                            <option value="">Stanowisko</option>
                                            {slots.map((s) => (
                                              <option key={s} value={s}>
                                                {stanowiskoLabels[s]}
                                              </option>
                                            ))}
                                          </select>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {splitError && (
                            <div className="mb-2 mt-2 text-red-500 text-sm">
                              Każde stanowisko musi być unikalne!
                            </div>
                          )}
                          {splitGroups.some((g) =>
                            g.stations.some((s) => !s)
                          ) && (
                            <div className="mb-2 mt-2 text-red-500 text-sm">
                              Wszystkie stanowiska muszą zostać wybrane!
                            </div>
                          )}
                          {splitGroups.reduce((a, b) => a + b.players, 0) <
                            peopleCount && (
                            <div className="mb-2 mt-2 text-red-500 text-sm">
                              Wybrano za mało osób w grupach!
                            </div>
                          )}

                          <button
                            className="mt-2 px-4 py-1 rounded bg-[#00d9ff] text-black font-bold hover:bg-[#ffcc00] transition"
                            onClick={handleSplitGroup}
                            disabled={
                              splitGroups.some(
                                (g) =>
                                  g.players < 1 ||
                                  !g.stations ||
                                  g.stations.length !== g.players ||
                                  g.stations.some((s) => !s)
                              ) ||
                              splitGroups.reduce((a, b) => a + b.players, 0) !==
                                peopleCount
                            }
                          >
                            Podziel grupę
                          </button>
                        </>
                      )}
                      {splitGroupsCount === "" && (
                        <div className="mb-2 mt-2 text-red-500 text-sm">
                          Wybierz liczbę grup!
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Button to add or update the client */}
              {editId && peopleCount > 1 && (
                <>
                  <div className="mb-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={removeFromGroupEnabled}
                        onChange={() => {
                          setRemoveFromGroupEnabled((v) => !v);
                          setRemoveCount("");
                          setRemoveStations([]);
                          setRemoveOptions([]);
                        }}
                        className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                      />
                      Usuń z grupy
                    </label>
                  </div>
                  {removeFromGroupEnabled && (
                    <div className="mb-4 p-3 rounded border-2 border-[#ff0000]/40 bg-[#1e2636]">
                      <div className="font-semibold text-[#ff0000] mb-2">
                        Usuwanie osób z grupy {peopleCount} osobowej
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm">Ile osób usunąć:</label>
                        <select
                          value={removeCount}
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            setRemoveCount(val);
                            setRemoveStations(
                              val === "" ? [] : Array(val).fill(null)
                            );
                            setRemoveOptions(
                              val === ""
                                ? []
                                : Array(val).fill({ type: "paid" })
                            );
                            setRemoveNames(
                              val === "" ? [] : Array(val).fill("")
                            );
                            setRemovePrices(
                              val === "" ? [] : Array(val).fill("")
                            );
                          }}
                          className="w-24 p-1 rounded bg-[#0f1525] border border-gray-600 text-white"
                        >
                          <option value="">Wybierz...</option>
                          {Array.from(
                            { length: peopleCount },
                            (_, i) => i + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Render remove stations and options if removeCount is set */}
                      {removeCount !== "" && (
                        <>
                          <div className="mt-2 flex flex-col gap-4">
                            {Array.from({ length: Number(removeCount) }).map(
                              (_, idx) => {
                                const station = removeStations[idx];
                                const client = clients.find(
                                  (c) => c.id === editId
                                );
                                let startTime = "";
                                let duration = "";
                                let nowTime = "";
                                let played = "";
                                let defaultPrice = "";
                                if (client && station) {
                                  startTime = DateTime.fromISO(
                                    client.startTime
                                  ).toFormat("HH:mm");
                                  duration = client.duration + " min";
                                  nowTime = DateTime.now().toFormat("HH:mm");
                                  const playedMinutes = Math.max(
                                    0,
                                    Math.floor(
                                      DateTime.now().diff(
                                        DateTime.fromISO(client.startTime),
                                        "minutes"
                                      ).minutes
                                    )
                                  );
                                  played = playedMinutes + " min";

                                  // Wylicz kwotę za faktycznie zagrany czas
                                  const start = DateTime.fromISO(
                                    client.startTime
                                  );
                                  const isWeekend = [5, 6, 7].includes(
                                    start.weekday
                                  );
                                  const rate = isWeekend ? 45 : 39;
                                  defaultPrice = (
                                    (rate / 30) *
                                    playedMinutes
                                  ).toFixed(2);
                                }
                                return (
                                  <div
                                    key={idx}
                                    className="flex flex-col gap-1 border-b border-gray-700 pb-2"
                                  >
                                    <label className="text-sm">
                                      Stanowisko do usunięcia {idx + 1}:
                                    </label>
                                    <select
                                      value={removeStations[idx] ?? ""}
                                      onChange={(e) => {
                                        const updated = [...removeStations];
                                        updated[idx] = Number(e.target.value);
                                        setRemoveStations(updated);
                                        const pricesUpd = [...removePrices];
                                        const client = clients.find(
                                          (c) => c.id === editId
                                        );
                                        const c = client
                                          ? (() => {
                                              const playedMinutes = Math.max(
                                                0,
                                                Math.floor(
                                                  DateTime.now().diff(
                                                    DateTime.fromISO(
                                                      client.startTime
                                                    ),
                                                    "minutes"
                                                  ).minutes
                                                )
                                              );
                                              const start = DateTime.fromISO(
                                                client.startTime
                                              );
                                              const isWeekend = [
                                                5, 6, 7,
                                              ].includes(start.weekday);
                                              const rate = isWeekend ? 45 : 39;
                                              return (
                                                (rate / 30) *
                                                playedMinutes
                                              ).toFixed(2);
                                            })()
                                          : "";
                                        pricesUpd[idx] =
                                          c === "" ? "" : Number(c);
                                        setRemovePrices(pricesUpd);
                                      }}
                                      className="w-28 p-1 rounded bg-[#0f1525] border border-gray-600 text-white"
                                    >
                                      <option value="">Stanowisko</option>
                                      {slots.map((s) => (
                                        <option key={s} value={s}>
                                          {stanowiskoLabels[s]}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="flex gap-4 mt-1">
                                      <label className="flex items-center gap-1 text-xs">
                                        <input
                                          type="radio"
                                          checked={
                                            removeOptions[idx]?.type === "paid"
                                          }
                                          onChange={() => {
                                            const updated = [...removeOptions];
                                            updated[idx] = { type: "paid" };
                                            setRemoveOptions(updated);
                                          }}
                                        />
                                        Opłacone
                                      </label>
                                      <label className="flex items-center gap-1 text-xs">
                                        <input
                                          type="radio"
                                          checked={
                                            removeOptions[idx]?.type === "toPay"
                                          }
                                          onChange={() => {
                                            const updated = [...removeOptions];
                                            updated[idx] = { type: "toPay" };
                                            setRemoveOptions(updated);
                                          }}
                                        />
                                        Do opłacenia
                                      </label>
                                    </div>
                                    {/* INPUTY i info tylko dla opcji do zapłaty */}
                                    {removeOptions[idx]?.type === "toPay" && (
                                      <>
                                        <div className="text-xs text-gray-300 mt-2 mb-1">
                                          <div>
                                            <span className="font-semibold">
                                              Czas gry:
                                            </span>{" "}
                                            {duration}
                                          </div>
                                          <div>
                                            <span className="font-semibold">
                                              Start:
                                            </span>{" "}
                                            {startTime}
                                          </div>
                                          <div>
                                            <span className="font-semibold">
                                              Teraz:
                                            </span>{" "}
                                            {nowTime}
                                          </div>
                                          <div>
                                            <span className="font-semibold">
                                              Grano:
                                            </span>{" "}
                                            {played}
                                          </div>
                                        </div>
                                        <label className="block text-xs font-semibold mt-2 mb-0.5">
                                          Kwota do zapłaty
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step="0.01"
                                          placeholder="Kwota"
                                          value={
                                            removePrices[idx] ?? defaultPrice
                                          }
                                          onChange={(e) => {
                                            const updated = [...removePrices];
                                            updated[idx] =
                                              e.target.value === ""
                                                ? ""
                                                : Number(e.target.value);
                                            setRemovePrices(updated);
                                          }}
                                          className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
                                        />
                                      </>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                          <button
                            className="mt-4 px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-800 transition disabled:opacity-50"
                            disabled={
                              removeStations.length !== Number(removeCount) ||
                              removeStations.some((s) => !s) ||
                              removeOptions.length !== Number(removeCount) ||
                              removeOptions.some((opt) => !opt.type)
                            }
                            onClick={() => {
                              handleRemoveFromGroup(removeNames, removePrices);
                            }}
                          >
                            Usuń wybrane osoby
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Game selection section */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={hasGameSelection}
                    onChange={() => setHasGameSelection(!hasGameSelection)}
                    className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                  />
                  Wybór gry
                </label>

                {hasGameSelection && (
                  <div className="space-y-3">
                    {/* Game mode selection - only show for groups */}
                    {peopleCount > 1 && (
                      <div>
                        <label className="block text-sm mb-1">Tryb gier:</label>
                        <select
                          value={gameMode}
                          onChange={(e) =>
                            setGameMode(e.target.value as "same" | "different")
                          }
                          className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white text-sm"
                        >
                          <option value="same">Wszyscy grają w to samo</option>
                          <option value="different">
                            Każdy gra w co innego
                          </option>
                        </select>
                      </div>
                    )}

                    {peopleCount === 1 || gameMode === "same" ? (
                      /* Single select for entire group or single client */
                      <div>
                        <label className="block text-sm mb-1">
                          {peopleCount === 1
                            ? "Gra dla klienta:"
                            : "Gra dla grupy:"}
                        </label>
                        <select
                          value={gameType}
                          onChange={(e) => setGameType(e.target.value)}
                          className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white text-sm"
                        >
                          <option value="">Wybierz grę...</option>
                          {availableGames.map((game) => (
                            <option key={game} value={game}>
                              {game}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* Individual selects for each player */
                      <div className="space-y-2">
                        <label className="block text-sm mb-1">
                          Gry dla poszczególnych graczy:
                        </label>
                        {Array.from({ length: peopleCount }).map((_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm w-20 text-gray-300">
                              Gracz {i + 1}:
                            </span>
                            <select
                              value={individualGames[i] || ""}
                              onChange={(e) =>
                                updateIndividualGame(i, e.target.value)
                              }
                              className="flex-1 p-2 rounded bg-[#0f1525] border border-gray-600 text-white text-sm"
                            >
                              <option value="">Wybierz grę...</option>
                              {availableGames.map((game) => (
                                <option key={game} value={game}>
                                  {game}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Checkbox for paid game option */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={paid}
                    onChange={() => setPaid(!paid)}
                    className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                  />{" "}
                  Opłacone
                </label>
              </div>

              <button
                onClick={handleAddClient}
                disabled={allStationsTaken}
                className={`w-full text-black font-bold py-2 rounded transition ${
                  allStationsTaken
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-[#00d9ff] hover:bg-[#ffcc00]"
                }`}
              >
                {editId ? "Zapisz zmiany" : "Dodaj klienta"}
              </button>
            </div>
          )}

          {subpage === "stoper" && (
            <div>
              {/* Sekcja Stopera */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Stoper
                </h3>
                <div className="bg-[#0f1525] p-4 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-white">
                      {formatTime(stopwatchTime)}
                    </div>
                  </div>

                  <div className="flex text-sm gap-2 font-semibold mb-4 justify-center">
                    {!stopwatchRunning ? (
                      <button
                        onClick={startStopwatch}
                        className="px-2 py-2 w-24 bg-green-600 hover:bg-green-700 text-white rounded transition"
                      >
                        <FaPlay className="inline mr-2" />
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={pauseStopwatch}
                        className="px-4 py-2 w-24 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition"
                      >
                        <FaPause className="inline mr-2" />
                        Pauza
                      </button>
                    )}

                    <button
                      onClick={measureStopwatch}
                      disabled={!stopwatchRunning}
                      className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-600 text-white rounded transition"
                    >
                      Pomiar
                    </button>

                    <button
                      onClick={resetStopwatch}
                      className="px-4 py-2 bg-red-500 hover:bg-red-800 text-white rounded transition"
                    >
                      Reset
                    </button>
                  </div>

                  {!showStopwatchBubble &&
                    (stopwatchRunning || measurements.length > 0) && (
                      <button
                        onClick={() => setShowStopwatchBubble(true)}
                        className="w-full px-4 py-2 bg-[#1e2636] hover:bg-[#147a8f] text-white rounded transition"
                      >
                        Pokaż
                      </button>
                    )}

                  {measurements.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-300 mb-2">
                        Pomiary:
                      </h4>
                      <div className="max-h-32 overflow-y-auto bg-[#1e2636] p-2 rounded">
                        {measurements.map((time, index) => (
                          <div
                            key={index}
                            className="text-sm text-gray-300 font-mono"
                          >
                            {index + 1}. {formatTime(time)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sekcja Minutnika */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Minutnik
                </h3>
                <div className="bg-[#0f1525] p-4 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-2xl  font-bold text-white">
                      {timerRunning
                        ? formatTime(timerRemainingSeconds)
                        : formatTime(timerMinutes * 60 + timerSeconds)}
                    </div>
                  </div>

                  {!timerRunning && (
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-300 mb-1">
                          Minuty
                        </label>
                        <input
                          type="number"
                          value={timerMinutes}
                          onChange={(e) =>
                            setTimerMinutes(
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-full p-2 rounded bg-[#1e2636] border border-gray-600 text-white"
                          min="0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm text-gray-300 mb-1">
                          Sekundy
                        </label>
                        <input
                          type="number"
                          value={timerSeconds}
                          onChange={(e) =>
                            setTimerSeconds(
                              Math.max(
                                0,
                                Math.min(59, parseInt(e.target.value) || 0)
                              )
                            )
                          }
                          className="w-full p-2 rounded bg-[#1e2636] border border-gray-600 text-white"
                          min="0"
                          max="59"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-center text-sm Analiza przepełnienia (kolejki)font-semibold">
                    {!timerRunning ? (
                      <button
                        onClick={startTimer}
                        disabled={timerMinutes === 0 && timerSeconds === 0}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition"
                      >
                        <FaPlay className="inline mr-2" />
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={pauseTimer}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition"
                      >
                        <FaPause className="inline mr-2" />
                        Pauza
                      </button>
                    )}

                    <button
                      onClick={resetTimer}
                      className="px-4 py-2 bg-red-500 hover:bg-red-800 text-white rounded transition"
                    >
                      Reset
                    </button>
                  </div>

                  {!showTimerBubble && timerRunning && (
                    <button
                      onClick={() => setShowTimerBubble(true)}
                      className="w-full mt-4 px-4 py-2 bg-[#1e2636] hover:bg-[#147a8f] text-white rounded transition"
                    >
                      Pokaż
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {subpage === "stats" && (
            <div className="font-semibold">
              <button
                className={`px-4 py-2 mb-2 rounded flex items-center justify-center transition ${
                  statsSubPage === "statystyki_podstawowe"
                    ? "bg-[#0f1525] text-white shadow border-l-2 border-[#00d9ff]"
                    : "bg-[#161c29] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Statystyki podstawowe"
                onClick={() => setStatsSubPage("statystyki_podstawowe")}
              >
                Statystyki podstawowe
              </button>
             <button
                className={`px-4 py-2 mb-2 rounded flex items-center justify-center transition ${
                  statsSubPage === "wykorzystanie_stanowisk"
                    ? "bg-[#0f1525] text-white shadow border-l-2 border-[#00d9ff]"
                    : "bg-[#161c29] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Wykorzystanie stanowisk"
                onClick={() => setStatsSubPage("wykorzystanie_stanowisk")}
              >
                Wykorzystanie stanowisk
              </button>
              <button
                className={`px-4 py-2 mb-2 rounded flex items-center justify-center transition ${
                  statsSubPage === "analiza_finansowa"
                    ? "bg-[#0f1525] text-white shadow border-l-2 border-[#00d9ff]"
                    : "bg-[#161c29] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Analiza finansowa"
                onClick={() => setStatsSubPage("analiza_finansowa")}
              >
                Analiza finansowa
              </button>
              <button
                className={`px-4 py-2 mb-2 rounded flex items-center justify-center transition ${
                  statsSubPage === "analiza_graczy"
                    ? "bg-[#0f1525] text-white shadow border-l-2 border-[#00d9ff]"
                    : "bg-[#161c29] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Analiza graczy"
                onClick={() => setStatsSubPage("analiza_graczy")}
              >
                Analiza graczy
              </button>
              <button
                className={`px-4 py-2 mb-2 rounded flex items-center justify-center transition ${
                  statsSubPage === "analiza_gier"
                    ? "bg-[#0f1525] text-white shadow border-l-2 border-[#00d9ff]"
                    : "bg-[#161c29] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Analiza gier"
                onClick={() => setStatsSubPage("analiza_gier")}
              >
                Analiza gier
              </button>
              <button
                className={`px-4 py-2 mb-2 rounded flex items-center justify-center transition ${
                  statsSubPage === "operacyjne"
                    ? "bg-[#0f1525] text-white shadow border-l-2 border-[#00d9ff]"
                    : "bg-[#161c29] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Statystyki operacyjne"
                onClick={() => setStatsSubPage("operacyjne")}
              >
                Statystyki operacyjne
              </button>
              <button
                className={`px-4 py-2 mb-2 rounded flex items-center justify-center transition ${
                  statsSubPage === "wskazniki"
                    ? "bg-[#0f1525] text-white shadow border-l-2 border-[#00d9ff]"
                    : "bg-[#161c29] text-gray-500 hover:bg-[#0f1525]"
                }`}
                title="Wskaźniki"
                onClick={() => setStatsSubPage("wskazniki")}
              >
                Wskaźniki
              </button>
            </div>
          )}
        </div>

        {/*RIGHT SIDE: CLIENTS */}
        <div className="w-full md:w-2/3 px-2">
          {(subpage === "main" || subpage === "stoper") && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, index) => {
                  const slotIndex = index + 1;
                  const clientsInSlot = clients.filter((client) =>
                    client.stations.includes(slotIndex)
                  );

                  const isEditing = clientsInSlot.some(
                    (client) => editId === client.id
                  );

                  // Sprawdzamy, czy jakakolwiek gra w tym slocie się zakończyła
                  const hasGameEnded = clientsInSlot.some((client) => {
                    const { isOver } = getRemainingTime(
                      client.startTime,
                      client.duration,
                      client.isPaused,
                      client.pauseStartTime
                    );
                    return isOver;
                  });

                  return (
                    <div
                      key={index}
                      className={`bg-[#1e2636] rounded-lg p-4 shadow-md flex flex-col h-50 break-words transition
                    ${
                      isEditing
                        ? "ring-1 ring-[#00d9ff] z-10"
                        : hasGameEnded
                        ? "ring-1 ring-red-500 z-20"
                        : clientsInSlot.some((client) => client.isPaused)
                        ? "ring-1 ring-orange-500 z-10"
                        : clientsInSlot.some((client) => client.reminder)
                        ? "ring-1 ring-pink-500 z-10"
                        : clientsInSlot.some((client) => client.comment)
                        ? "ring-1 ring-green-500 z-10"
                        : clientsInSlot.length === 0
                        ? "hover:bg-[#242d40]"
                        : ""
                    }`}
                      style={{
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                      onDragOver={(e) => {
                        // Pozwalamy na upuszczenie na każde miejsce - puste lub zajęte
                        e.preventDefault();

                        // Dodajemy różne style zależnie od tego czy miejsce jest zajęte czy puste
                        if (clientsInSlot.length === 0) {
                          // Dla pustych miejsc - niebieska obwódka
                          e.currentTarget.classList.add(
                            "bg-[#2a3a56]",
                            "ring-1",
                            "ring-[#00d9ff]",
                            "z-10"
                          );
                        } else {
                          // Dla zajętych miejsc - pomarańczowa obwódka wskazująca na możliwość zamiany
                          e.currentTarget.classList.add(
                            "bg-[#2a3a56]",
                            "ring-1",
                            "ring-amber-500",
                            "z-10"
                          );
                        }
                      }}
                      onDragLeave={(e) => {
                        // Usuwamy wszystkie style podświetlające, niezależnie od tego czy miejsce było puste czy zajęte
                        e.currentTarget.classList.remove(
                          "bg-[#2a3a56]",
                          "ring-1",
                          "ring-[#00d9ff]",
                          "ring-orange-500"
                        );
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        // Usuwamy wszystkie style podświetlające
                        e.currentTarget.classList.remove(
                          "bg-[#2a3a56]",
                          "ring-1",
                          "ring-[#00d9ff]",
                          "ring-orange-500"
                        );
                        const dragData = e.dataTransfer.getData("text/plain");

                        // Sprawdzamy, czy dane zawierają ID stanowiska (format clientId:stationId)
                        const [clientId, stationId] = dragData.includes(":")
                          ? dragData.split(":")
                          : [dragData, null];

                        // Obsługujemy upuszczanie na dowolne miejsce - puste lub zajęte
                        if (clientId) {
                          handleDragClient(
                            clientId,
                            slotIndex,
                            stationId ? parseInt(stationId) : undefined
                          );
                        }
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        {(() => {
                          const colorMap = buildClientColorMap();
                          const clientForSlot = clientsInSlot[0];
                          return (
                            <div className="text-sm font-bold text-[#00d9ff] flex items-center gap-2">
                              <span>{stanowiskoLabels[slotIndex]}</span>
                              {clientForSlot &&
                                clientForSlot.stations &&
                                clientForSlot.stations.length > 1 && (
                                  <span
                                    aria-hidden
                                    className="inline-block w-2 h-2 rounded-xs"
                                    style={{
                                      backgroundColor:
                                        colorMap[clientForSlot.id],
                                    }}
                                  />
                                )}
                            </div>
                          );
                        })()}
                        {clientsInSlot.length > 0 && (
                          <div className="flex gap-2 ">
                            <span className="relative group flex items-center mr-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const wasEditing =
                                    editId === clientsInSlot[0].id;
                                  handleEditClient(clientsInSlot[0]);
                                  // jeśli otwieramy edycję teraz (a nie zamykamy), włącz pole komentarza gdy brak komentarza
                                  if (
                                    !wasEditing &&
                                    !clientsInSlot[0].comment
                                  ) {
                                    setAddComment(true);
                                  }
                                  setTimeout(() => {
                                    commentInputRef.current?.focus();
                                  }, 0);
                                }}
                                className={`text-gray-500 hover:text-green-500/80 ${
                                  clientsInSlot[0].comment
                                    ? "text-green-500"
                                    : "text-gray-500"
                                }`}
                                title={
                                  clientsInSlot[0].comment
                                    ? ""
                                    : "Dodaj komentarz"
                                }
                              >
                                <FaCommentDots />
                              </button>
                              {clientsInSlot[0].comment && (
                                <span className="absolute left-7 top-1/2 -translate-y-1/2 bg-[#222] text-white px-3 py-1 rounded z-10 text-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-pre-line min-w-[180px] max-w-[400px] transition-opacity duration-200">
                                  {clientsInSlot[0].comment}
                                </span>
                              )}
                            </span>

                            <button
                              onClick={() => handleEditClient(clientsInSlot[0])}
                              className={`text-gray-500 hover:text-yellow-500 ${
                                editId === clientsInSlot[0].id
                                  ? "animate-blink-slow text-yellow-500"
                                  : ""
                              }`}
                              title="Edytuj klienta"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => {
                                setClientToDelete(clientsInSlot[0]);
                                setShowDeleteModal(true);
                              }}
                              className="text-gray-500 hover:text-red-600"
                              title="Usuń klienta"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>

                      {clientsInSlot.length > 0 ? (
                        clientsInSlot.map((client, i) => {
                          // Dla grup z wieloma stanowiskami, musimy znaleźć, które stanowisko odpowiada temu slotowi
                          const stationForThisSlot = client.stations.includes(
                            slotIndex
                          )
                            ? slotIndex
                            : client.stations[i];
                          return (
                            <div
                              key={i}
                              className="text-sm text-blue-300 mb-2"
                              draggable="false"
                              onMouseDown={(e) => {
                                const element = e.currentTarget;
                                const timer = setTimeout(() => {
                                  element.setAttribute("draggable", "true");
                                  element.classList.add("cursor-move");
                                  // Dodajemy flagę, że element jest w trybie przeciągania
                                  element.setAttribute(
                                    "data-drag-enabled",
                                    "true"
                                  );

                                  // Ustawiamy timer na reset po 2 sekundach jeśli nie zostanie przeciągnięty
                                  const resetTimer = setTimeout(() => {
                                    // Sprawdzamy czy element ma włączoną możliwość przeciągania
                                    // i nie jest aktualnie przeciągany
                                    if (
                                      element.getAttribute(
                                        "data-drag-enabled"
                                      ) === "true" &&
                                      !element.classList.contains("opacity-50")
                                    ) {
                                      element.setAttribute(
                                        "draggable",
                                        "false"
                                      );
                                      element.classList.remove("cursor-move");
                                      element.removeAttribute(
                                        "data-drag-enabled"
                                      );
                                    }
                                  }, 2000);

                                  // Zapisujemy timer resetu w atrybucie elementu
                                  element.setAttribute(
                                    "data-reset-timer",
                                    String(resetTimer)
                                  );
                                }, 500); // zmienione z 1000 na 500ms (pół sekundy)

                                // Zapisujemy timer w atrybucie elementu
                                element.setAttribute(
                                  "data-timer",
                                  String(timer)
                                );
                              }}
                              onMouseUp={(e) => {
                                const element = e.currentTarget;
                                const timer = Number(
                                  element.getAttribute("data-timer")
                                );
                                if (timer) {
                                  clearTimeout(timer);
                                  element.removeAttribute("data-timer");
                                }

                                // Nie czyścimy timera resetu, aby pozwolić mu działać
                                // nawet po puszczeniu przycisku myszy

                                if (
                                  !element.classList.contains("cursor-move")
                                ) {
                                  element.setAttribute("draggable", "false");
                                }
                              }}
                              onMouseLeave={(e) => {
                                const element = e.currentTarget;
                                const timer = Number(
                                  element.getAttribute("data-timer")
                                );
                                if (timer) {
                                  clearTimeout(timer);
                                  element.removeAttribute("data-timer");
                                }

                                // Nie czyścimy timera resetu, aby pozwolił mu działać
                                // nawet po opuszczeniu elementu kursorem
                              }}
                              onDragStart={(e) => {
                                // Jeśli jest więcej niż jedno stanowisko (grupa), dodajemy informację o konkretnym stanowisku
                                if (client.stations.length > 1) {
                                  // Tworzymy specjalne ID dla przeciągania: clientId:stationId
                                  e.dataTransfer.setData(
                                    "text/plain",
                                    `${client.id}:${stationForThisSlot}`
                                  );
                                } else {
                                  // Dla pojedynczych klientów, po prostu używamy ich ID
                                  e.dataTransfer.setData(
                                    "text/plain",
                                    client.id
                                  );
                                }

                                // Dodajemy klasę wskazującą, że element jest przeciągany
                                e.currentTarget.classList.add("opacity-50");

                                // Czyścimy timer resetu, ponieważ element jest teraz przeciągany
                                const resetTimer = Number(
                                  e.currentTarget.getAttribute(
                                    "data-reset-timer"
                                  )
                                );
                                if (resetTimer) {
                                  clearTimeout(resetTimer);
                                  e.currentTarget.removeAttribute(
                                    "data-reset-timer"
                                  );
                                }
                              }}
                              onDragEnd={(e) => {
                                // Usuwamy klasę po zakończeniu przeciągania
                                e.currentTarget.classList.remove("opacity-50");
                                e.currentTarget.classList.remove("cursor-move");
                                e.currentTarget.setAttribute(
                                  "draggable",
                                  "false"
                                );
                                e.currentTarget.removeAttribute(
                                  "data-drag-enabled"
                                );

                                // Czyścimy timer resetu jeśli istnieje
                                const resetTimer = Number(
                                  e.currentTarget.getAttribute(
                                    "data-reset-timer"
                                  )
                                );
                                if (resetTimer) {
                                  clearTimeout(resetTimer);
                                  e.currentTarget.removeAttribute(
                                    "data-reset-timer"
                                  );
                                }
                              }}
                            >
                              <div className="flex justify-between">
                                <div className="font-semibold text-gray-300">
                                  {client.duration} min
                                </div>
                                <div className="text-sm  text-gray-400">
                                  {DateTime.fromISO(client.startTime).toFormat(
                                    "HH:mm"
                                  )}{" "}
                                  –{" "}
                                  {calculateEndTime(
                                    client.startTime,
                                    client.duration
                                  ).toFormat("HH:mm")}
                                </div>
                              </div>
                              {(() => {
                                const { text, minutes, isOver } =
                                  getRemainingTime(
                                    client.startTime,
                                    client.duration,
                                    client.isPaused,
                                    client.pauseStartTime
                                  );
                                let colorClass = "text-white";
                                let blinkClass = "";
                                if (isOver || minutes <= 1) {
                                  colorClass = "text-red-400";
                                  blinkClass = "animate-blink";
                                } else if (minutes <= 5) {
                                  colorClass = "text-red-400";
                                } else if (minutes <= 10) {
                                  colorClass = "text-yellow-400";
                                }
                                return (
                                  <div
                                    className={`text-sm mt-2 ${colorClass} ${blinkClass}`}
                                  >
                                    Pozostało: {text}
                                  </div>
                                );
                              })()}
                              <div className="text-sm ">
                                {client.hasGameSelection ? (
                                  <span className="text-gray-500">
                                    {getCurrentGameDisplay(
                                      client,
                                      stationForThisSlot
                                    ) || "Nie wybrano gry"}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">
                                    Brak wyboru gry
                                  </span>
                                )}
                              </div>
                              <div className="text-sm mt-4">
                                {client.paid ? (
                                  <span className="text-green-400 font-semibold">
                                    Opłacone
                                  </span>
                                ) : (
                                  <span className="text-red-400">
                                    Do zapłaty:{" "}
                                    {client.customPrice != null
                                      ? `${client.customPrice.toFixed(2)} zł`
                                      : `${getSinglePlayerAmount(
                                          client.duration,
                                          client.startTime
                                        ).toFixed(2)} zł`}
                                  </span>
                                )}
                              </div>

                              <div className="flex justify-end gap-2 mt-5 text-[15px] h-[17px]">
                                {/* left area: show pause (if paused) and reminder (if set) */}
                                <div className="mr-auto flex gap-3">
                                  {client.isPaused && client.reminder && (
                                    <>
                                      <div className="text-pink-400 text-[13px]  font-semibold">
                                        U:{" "}
                                        {getReminderCountdown(client) ??
                                          "--:--"}
                                      </div>
                                      <div className="text-orange-500 text-[13px] font-semibold">
                                        P:{" "}
                                        {
                                          getRemainingTime(
                                            client.startTime,
                                            client.duration,
                                            client.isPaused,
                                            client.pauseStartTime
                                          ).pauseDuration
                                        }
                                      </div>
                                    </>
                                  )}

                                  {client.isPaused && !client.reminder && (
                                    <div className="text-orange-500 text-[14px] font-semibold">
                                      Pauza:{" "}
                                      {
                                        getRemainingTime(
                                          client.startTime,
                                          client.duration,
                                          client.isPaused,
                                          client.pauseStartTime
                                        ).pauseDuration
                                      }
                                    </div>
                                  )}

                                  {client.reminder && !client.isPaused && (
                                    <div className="text-pink-400 text-[14px] font-semibold">
                                      Uwaga:{" "}
                                      {getReminderCountdown(client) ?? "--:--"}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => {
                                    // Mirror comment-button behaviour: if clicking the same client while editing,
                                    // toggle edit off. If opening edit, enable reminder UI when no reminder exists.
                                    const wasEditing = editId === client.id;
                                    handleEditClient(client);
                                    if (!wasEditing && !client.reminder) {
                                      setAddReminder(true);
                                    }
                                  }}
                                  className={`${
                                    client.reminder
                                      ? "text-pink-500 hover:text-pink-500"
                                      : "text-gray-500 hover:text-pink-500"
                                  }`}
                                  title={
                                    client.reminder
                                      ? `Przypomnienie ustawione`
                                      : "Ustaw przypomnienie"
                                  }
                                >
                                  <FaBell />
                                </button>
                                <button
                                  onClick={() => {
                                    handlePauseResumeGame(client.id);
                                  }}
                                  className={`${
                                    client.isPaused
                                      ? "text-orange-500 hover:text-green-500"
                                      : "text-gray-500 hover:text-orange-500"
                                  }`}
                                  title={
                                    client.isPaused
                                      ? "Wznów grę"
                                      : "Wstrzymaj grę"
                                  }
                                >
                                  {client.isPaused ? <FaPlay /> : <FaPause />}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-gray-300">Brak gracza</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Queue section */}
              <div className="overflow-x-auto lg:overflow-x-visible mt-10">
                {queueClients.length > 0 && (
                  <div className="mt-8 mb-8">
                    <h3 className="text-lg font-bold text-[#00d9ff] mb-2">
                      Kolejka do zapłaty
                    </h3>
                    <table className="w-full table-auto text-sm bg-[#1e2636] rounded-lg shadow-md">
                      <thead>
                        <tr className="text-left border-b border-gray-600 text-[#00d9ff]">
                          <th className="p-3">Stanowisko</th>
                          <th className="p-3">Czas</th>
                          <th className="p-3">Kwota</th>
                          <th className="p-3">Opłacone</th>
                          <th className="p-3">Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queueClients.map((client) => {
                          const isEditing = editingQueueId === client.id;
                          return (
                            <tr
                              key={client.id}
                              className="border-b border-gray-700 hover:bg-[#2b3242]"
                            >
                              <td className="p-3 text-white">
                                {client.stations
                                  .map((s) => stanowiskoLabels[s])
                                  .join(", ")}
                              </td>
                              <td className="p-3 text-white">
                                {client.playedMinutes != null
                                  ? `${client.playedMinutes} min`
                                  : "-"}
                              </td>
                              <td className="p-3 text-white ">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editingQueuePrice}
                                    onChange={(e) =>
                                      setEditingQueuePrice(
                                        e.target.value === ""
                                          ? ""
                                          : Number(e.target.value)
                                      )
                                    }
                                    className="w-24 p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
                                  />
                                ) : (
                                  (client.customPrice != null
                                    ? client.customPrice
                                    : getSinglePlayerAmount(
                                        client.duration,
                                        client.startTime
                                      )
                                  ).toFixed(2) + " zł"
                                )}
                              </td>
                              <td className="p-3 text-white">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!client.paid}
                                    onChange={(e) => {
                                      const updated = [...queueClients];
                                      const idx = updated.findIndex(
                                        (c) => c.id === client.id
                                      );
                                      updated[idx] = {
                                        ...client,
                                        paid: e.target.checked,
                                      };
                                      setQueueClients(updated);
                                    }}
                                    className="accent-[#00d9ff] w-4 h-4 rounded border-gray-600"
                                    disabled={isEditing}
                                  />
                                  <span
                                    className={
                                      client.paid
                                        ? "text-green-400 font-bold"
                                        : "text-red-400 font-bold"
                                    }
                                    style={{
                                      minWidth: 90,
                                      display: "inline-block",
                                    }}
                                  >
                                    {client.paid ? "Opłacone" : "Do zapłaty"}
                                  </span>
                                </label>
                              </td>
                              <td className="p-3">
                                {isEditing ? (
                                  <div className="flex gap-2">
                                    <button
                                      className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700"
                                      onClick={() => setEditingQueueId(null)}
                                    >
                                      Anuluj
                                    </button>
                                    <button
                                      className="px-3 py-1 rounded bg-[#00d9ff] text-black font-bold hover:bg-[#ffcc00]"
                                      onClick={() => {
                                        setQueueClients(
                                          queueClients.map((q) =>
                                            q.id === client.id
                                              ? {
                                                  ...q,
                                                  customPrice:
                                                    editingQueuePrice === ""
                                                      ? undefined
                                                      : Number(
                                                          editingQueuePrice
                                                        ),
                                                }
                                              : q
                                          )
                                        );
                                        setEditingQueueId(null);
                                      }}
                                    >
                                      Zapisz
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      className="text-gray-500 hover:text-yellow-500 transition"
                                      onClick={() => {
                                        setEditingQueueId(client.id);
                                        setEditingQueuePrice(
                                          client.customPrice != null
                                            ? client.customPrice
                                            : getSinglePlayerAmount(
                                                client.duration,
                                                client.startTime
                                              )
                                        );
                                      }}
                                      title="Edytuj"
                                      disabled={client.paid}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      className={`text-gray-500 hover:text-red-600 ml-2 transition ${
                                        !client.paid
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        if (!client.paid) return;
                                        setQueueClients(
                                          queueClients.filter(
                                            (q) => q.id !== client.id
                                          )
                                        );
                                      }}
                                      title="Usuń"
                                      disabled={!client.paid}
                                    >
                                      <FaTrash />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Clients list section */}
                <table className="w-full table-auto text-sm bg-[#1e2636] rounded-lg shadow-md">
                  <thead>
                    <tr className="text-left border-b border-gray-600 text-[#00d9ff]">
                      <th
                        className={`p-3 cursor-pointer select-none transition ${
                          sortConfig.key === "players" ? "bg-[#193a4d]" : ""
                        } hover:bg-[#193a4d]/40`}
                        onClick={() => handleSort("players", true)}
                      >
                        Liczba graczy
                      </th>
                      <th
                        className={`p-3 cursor-pointer select-none transition ${
                          sortConfig.key === "stations" ? "bg-[#193a4d]" : ""
                        } hover:bg-[#193a4d]/40`}
                        onClick={() => handleSort("stations")}
                      >
                        Stanowiska
                      </th>
                      <th
                        className={`p-3 cursor-pointer select-none transition ${
                          sortConfig.key === "duration" ? "bg-[#193a4d]" : ""
                        } hover:bg-[#193a4d]/40`}
                        onClick={() => handleSort("duration", true)}
                      >
                        Czas
                      </th>
                      <th
                        className={`p-3 cursor-pointer select-none transition ${
                          sortConfig.key === "start" ? "bg-[#193a4d]" : ""
                        } hover:bg-[#193a4d]/40`}
                        onClick={() => handleSort("start", true)}
                      >
                        Start
                      </th>
                      <th
                        className={`p-3 cursor-pointer select-none transition ${
                          sortConfig.key === "end" ? "bg-[#193a4d]" : ""
                        } hover:bg-[#193a4d]/40`}
                        onClick={() => handleSort("end", true)}
                      >
                        Koniec
                      </th>
                      <th
                        className={`p-3 cursor-pointer select-none transition ${
                          sortConfig.key === "remaining" ? "bg-[#193a4d]" : ""
                        } hover:bg-[#193a4d]/40`}
                        onClick={() => handleSort("remaining", true)}
                      >
                        Pozostało
                      </th>
                      <th
                        className={`p-3 cursor-pointer select-none transition ${
                          sortConfig.key === "paid" ? "bg-[#193a4d]" : ""
                        } hover:bg-[#193a4d]/40`}
                        onClick={() => handleSort("paid", true)}
                      >
                        Płatność
                      </th>
                      <th className="p-3">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedClients().map((client) => {
                      const end = calculateEndTime(
                        client.startTime,
                        client.duration
                      );
                      const remaining = getRemainingTime(
                        client.startTime,
                        client.duration,
                        client.isPaused,
                        client.pauseStartTime
                      );
                      const price = getPaymentAmount(
                        client.duration,
                        client.startTime,
                        client.players
                      );
                      const isEditing = editId === client.id;

                      return (
                        <tr
                          key={client.id}
                          className={`border-b border-gray-700 hover:bg-[#2b3242] ${
                            isEditing ? "bg-[#2a354a] " : ""
                          }`}
                        >
                          <td className="p-3 text-white">{client.players}</td>
                          <td className="p-3 text-white">
                            {client.stations
                              .map((s) => `${stanowiskoLabels[s]}`)
                              .join(", ")}
                          </td>
                          <td className="p-3 text-white">
                            {client.duration} min
                          </td>
                          <td className="p-3 text-white">
                            {DateTime.fromISO(client.startTime).toFormat(
                              "HH:mm"
                            )}
                          </td>
                          <td className="p-3 text-white">
                            {end.toFormat("HH:mm")}
                          </td>
                          <td className="p-3 text-white">{remaining.text}</td>
                          <td className="p-3">
                            {client.paid ? (
                              <span className="text-green-400 font-semibold">
                                Opłacone
                              </span>
                            ) : (
                              <span className="text-red-400">
                                {(client.customPrice != null
                                  ? client.customPrice * client.players
                                  : price
                                ).toFixed(2)}{" "}
                                zł
                              </span>
                            )}
                          </td>
                          <td className="p-3 flex gap-2 mt-1">
                            <span className="relative group flex items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const wasEditing = editId === client.id;
                                  handleEditClient(client);
                                  if (!wasEditing && !client.comment) {
                                    setAddComment(true);
                                  }
                                  setTimeout(() => {
                                    commentInputRef.current?.focus();
                                  }, 0);
                                }}
                                className={`text-gray-500 hover:text-green-500/80 ${
                                  client.comment
                                    ? "text-green-500"
                                    : "text-gray-500"
                                }`}
                                title={client.comment ? "" : "Dodaj komentarz"}
                                style={{ padding: 0 }}
                              >
                                <FaCommentDots />
                              </button>
                              {client.comment && (
                                <span className="absolute left-7 top-1/2 -translate-y-1/2 bg-[#222] text-white px-3 py-1 rounded z-10 text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-pre-line min-w-[120px] max-w-[300px] transition-opacity duration-200">
                                  {client.comment}
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => handleEditClient(client)}
                              className={`text-gray-500 hover:text-yellow-500 ${
                                isEditing
                                  ? "animate-blink-slow text-yellow-500"
                                  : ""
                              }`}
                              title="Edytuj"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => {
                                const wasEditing = editId === client.id;
                                handleEditClient(client);
                                if (!wasEditing && !client.reminder) {
                                  setAddReminder(true);
                                }
                              }}
                              className={`${
                                client.reminder
                                  ? "text-pink-500 hover:text-pink-500"
                                  : "text-gray-500 hover:text-pink-500"
                              }`}
                              title={
                                client.reminder
                                  ? `Przypomnienie ustawione`
                                  : "Ustaw przypomnienie"
                              }
                            >
                              <FaBell />
                            </button>
                            <button
                              onClick={() => handlePauseResumeGame(client.id)}
                              className={`${
                                client.isPaused
                                  ? "text-orange-500 hover:text-green-500"
                                  : "text-gray-500 hover:text-orange-500"
                              }`}
                              title={
                                client.isPaused ? "Wznów grę" : "Wstrzymaj grę"
                              }
                            >
                              {client.isPaused ? <FaPlay /> : <FaPause />}
                            </button>
                            <button
                              onClick={() => {
                                setClientToDelete(client);
                                setShowDeleteModal(true);
                              }}
                              className="text-gray-500 hover:text-red-600"
                              title="Usuń"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subpage === "stats" && statsSubPage === "statystyki_podstawowe" && (
            <div className="bg-[#1e2636] p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-3">Statystyki podstawowe</h3>

              {(() => {
                const day = computeStatsSummary("day");
                const week = computeStatsSummary("week");
                const month = computeStatsSummary("month");
                const dayChart = buildDaySeries();
                const weekChart = buildWeekSeries();
                const monthChart = buildMonthSeries();
                const heatmap = buildHeatmapSeries();
                return (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300">Ostatnia doba</h4>
                        <div className="text-2xl font-bold mt-2">{day.sessionsCount}</div>
                        <div className="text-sm text-gray-400">sesji</div>
                        <div className="mt-2">Suma minut: <b>{day.totalMinutes}</b></div>
                        <div>Średnio: <b>{day.avgMinutes} min</b></div>
                      </div>

                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300">Ostatni tydzień</h4>
                        <div className="text-2xl font-bold mt-2">{week.sessionsCount}</div>
                        <div className="text-sm text-gray-400">sesji</div>
                        <div className="mt-2">Suma minut: <b>{week.totalMinutes}</b></div>
                        <div>Średnio: <b>{week.avgMinutes} min</b></div>
                      </div>

                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300">Ostatni miesiąc</h4>
                        <div className="text-2xl font-bold mt-2">{month.sessionsCount}</div>
                        <div className="text-sm text-gray-400">sesji</div>
                        <div className="mt-2">Suma minut: <b>{month.totalMinutes}</b></div>
                        <div>Średnio: <b>{month.avgMinutes} min</b></div>
                      </div>
                    </div>

                    {/* Hourly heatmap (day) */}
              <div className="mt-4">
                <h4 className="text-sm text-gray-300 mb-2">Najpopularniejsze godziny (ostatnia doba)</h4>
                {(() => {
                  const { hourCounts } = computeStatsSummary("day");
                  const max = Math.max(...hourCounts, 1);
                  return (
                    <div className="flex gap-1 flex-wrap">
                      {hourCounts.map((c, h) => (
                        <div key={h} className="flex flex-col items-center text-xs w-10">
                          <div
                            title={`${h}:00 — ${c} sesji`}
                            className="w-8 h-6 rounded"
                            style={{ background: `rgba(0,213,255, ${c / max})` }}
                          />
                          <div className="mt-1">{h}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

                    <div className="flex flex-col gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Sesje — doba</h4>
                        <Apex options={dayChart.options} series={dayChart.series} type="area" height={320} />
                        <HourBlocks hourCounts={computeStatsSummary("day").hourCounts} />
                      </div>

                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Sesje — tydzień</h4>
                        <Apex options={weekChart.options} series={weekChart.series} type="area" height={320} />
                        <HourBlocks hourCounts={computeStatsSummary("week").hourCounts} />
                      </div>

                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Sesje — miesiąc</h4>
                        <Apex options={monthChart.options} series={monthChart.series} type="area" height={320} />
                        <HourBlocks hourCounts={computeStatsSummary("month").hourCounts} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Heatmapa — ostatni tydzień</h4>
                      <Apex options={heatmap.options} series={heatmap.series} type="heatmap" height={220} />
                    </div>
                  </div>
                );
              })()}

              
            </div>
          )}

          {subpage === "stats" && statsSubPage === "wykorzystanie_stanowisk" && (
            <div className="bg-[#1e2636] p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-3">Wykorzystanie stanowisk</h3>

              {(() => {
                const percentChart = buildStationPercentSeries();
                const avgChart = buildStationAvgSeries();
                const stats = computeStationStats();
                return (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Wykorzystanie (%)</h4>
                        <Apex options={percentChart.options} series={percentChart.series} type="bar" height={300} />
                      </div>

                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Średni czas na stanowisko (min)</h4>
                        <Apex options={avgChart.options} series={avgChart.series} type="bar" height={300} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Heatmapa stanowisk (średnie minuty)</h4>
                      <StationBlocks values={[0, ...stats.totalMinutesPer.slice(1, 9)]} />
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Top gry na stanowiskach</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }, (_, i) => i + 1).map((st) => {
                          const prefs = stats.gamePrefs[st] || {};
                          const items = Object.entries(prefs).sort((a, b) => b[1] - a[1]).slice(0, 5);
                          return (
                            <div key={st} className="p-2 bg-[#151e33] rounded">
                              <div className="text-sm text-gray-300 font-semibold mb-1">{stanowiskoLabels[st] || `St ${st}`}</div>
                              {items.length === 0 ? (
                                <div className="text-xs text-gray-400">Brak danych</div>
                              ) : (
                                <ul className="text-xs text-gray-200 list-inside space-y-1">
                                  {items.map(([game, mins]) => (
                                    <li key={game} className="flex justify-between">
                                      <span className="truncate pr-2">{game}</span>
                                      <span className="font-semibold">{Math.round(mins)}m</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {subpage === "stats" && statsSubPage === "analiza_finansowa" && (
            <div className="bg-[#1e2636] p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-3">Analiza finansowa</h3>
              {(() => {
                const stats = loadStats();
                const sessions: any[] = stats.sessions || [];
                if (!sessions.length) return <div className="text-sm text-gray-400">Brak danych</div>;

                const toDayKey = (iso: string) => {
                  try { return DateTime.fromISO(iso).toFormat('yyyy-LL-dd'); } catch { return '??'; }
                };
                const isWeekend = (iso: string) => {
                  try { const d = DateTime.fromISO(iso).weekday; return d === 6 || d === 7; } catch { return false; }
                };
                const getRevenue = (s: any) => {
                  if (typeof s.revenue === 'number') return s.revenue; // already computed total
                  if (Array.isArray(s.perSegmentRevenue) && s.perSegmentRevenue.length) {
                    return s.perSegmentRevenue.reduce((a: number, seg: any) => a + (seg.revenue || 0), 0);
                  }
                  if (typeof s.customPrice === 'number') return s.customPrice;
                  const minutes = s.playedMinutes || s.duration || 0;
                  try { return getPaymentAmount(minutes, s.startTime, s.players || 1); } catch { return 0; }
                };

                const now = DateTime.now();
                const dayCut = now.minus({ days: 1 });
                const weekCut = now.minus({ weeks: 1 });
                const monthCut = now.minus({ months: 1 });

                let dayRevenue = 0, weekRevenue = 0, monthRevenue = 0;
                let daySessions = 0, weekSessions = 0, monthSessions = 0;
                let weekendRevenue = 0, weekdayRevenue = 0, weekendSessions = 0, weekdaySessions = 0;
                let customPriceSessions = 0;
                const dayBuckets: Record<string, number> = {};
                const priceValues: number[] = [];
                const revenuePerGame: Record<string, number> = {};
                const revenuePerGameHour: Record<string, number[]> = {};
                let totalPlayerMinutes = 0;

                sessions.forEach(s => {
                  const rev = getRevenue(s);
                  priceValues.push(rev);
                  if (s.wasCustomPrice) customPriceSessions++;
                  const start = DateTime.fromISO(s.startTime);
                  const players = s.players || 1;
                  const minutesPlayer = (s.perPlayerMinutes && Array.isArray(s.perPlayerMinutes) && s.perPlayerMinutes.length)
                    ? s.perPlayerMinutes.reduce((a: number, b: number) => a + (b||0), 0)
                    : ( (s.playedMinutes || s.duration || 0) * players );
                  totalPlayerMinutes += minutesPlayer;

                  if (start >= dayCut) { dayRevenue += rev; daySessions += players; }
                  if (start >= weekCut) { weekRevenue += rev; weekSessions += players; }
                  if (start >= monthCut) { monthRevenue += rev; monthSessions += players; }

                  if (isWeekend(s.startTime)) { weekendRevenue += rev; weekendSessions += players; } else { weekdayRevenue += rev; weekdaySessions += players; }

                  const dk = toDayKey(s.startTime);
                  dayBuckets[dk] = (dayBuckets[dk] || 0) + rev;

                  if (s.gameSegments && s.gameSegments.length) {
                    s.gameSegments.forEach((seg: any) => {
                      if (!seg.gameType) return;
                      const segMinutes = seg.duration || (() => { try { return Math.max(0, Math.floor((DateTime.fromISO(seg.endTime).toMillis() - DateTime.fromISO(seg.startTime).toMillis())/60000)); } catch { return 0; } })();
                      if (!segMinutes) return;
                      let segRevenue = 0;
                      if (Array.isArray(s.perSegmentRevenue)) {
                        const found = s.perSegmentRevenue.find((r: any) => r.gameType === seg.gameType && r.minutes === segMinutes);
                        if (found) segRevenue = found.revenue;
                      }
                      if (!segRevenue) {
                        const playersInSeg = (seg.players && seg.players.length) || players;
                        const singleRate = segMinutes ? (getSinglePlayerAmount(segMinutes, seg.startTime) / segMinutes) : 0;
                        segRevenue = singleRate * segMinutes * playersInSeg;
                      }
                      revenuePerGame[seg.gameType] = (revenuePerGame[seg.gameType] || 0) + segRevenue;
                      const hour = DateTime.fromISO(seg.startTime).hour;
                      revenuePerGameHour[seg.gameType] = revenuePerGameHour[seg.gameType] || Array.from({length:24},()=>0);
                      revenuePerGameHour[seg.gameType][hour] += segRevenue;
                    });
                  }
                });

                const avgSessionValueDay = daySessions ? (dayRevenue / daySessions) : 0;
                const avgSessionValueWeek = weekSessions ? (weekRevenue / weekSessions) : 0;
                const avgSessionValueMonth = monthSessions ? (monthRevenue / monthSessions) : 0;
                const customPct = sessions.length ? (customPriceSessions / sessions.length * 100) : 0;
                const totalRevenueAll = sessions.reduce((a,s)=> a + getRevenue(s), 0);
                const pricePerMinute = totalPlayerMinutes ? (totalRevenueAll / totalPlayerMinutes) : 0;

                const topDays = Object.entries(dayBuckets).sort((a,b)=> b[1]-a[1]).slice(0,5);

                // Histogram of session revenue (bucket 50 zł)
                const bucketSize = 50;
                const hist: Record<string, number> = {};
                priceValues.forEach(v => {
                  const base = Math.floor(v / bucketSize) * bucketSize;
                  const key = `${base}-${base + bucketSize - 1}`;
                  hist[key] = (hist[key] || 0) + 1;
                });
                const histCategories = Object.keys(hist).sort((a,b)=> parseInt(a)-parseInt(b));
                const histSeries = [{ name: 'Sesje', data: histCategories.map(c => hist[c]) }];

                const gameRevEntries = Object.entries(revenuePerGame).sort((a,b)=> b[1]-a[1]);
                const gameRevCategories = gameRevEntries.map(e=>e[0]);
                const gameRevData = gameRevEntries.map(e=> Math.round(e[1]));

                const gameHourSeries = Object.entries(revenuePerGameHour).map(([game, arr]) => ({ name: game, data: arr.map((v,i)=> ({ x: `${i}:00`, y: Math.round(v) })) }));
                const weekendWeekdaySeries = [{ name: 'Przychód', data: [Math.round(weekdayRevenue), Math.round(weekendRevenue)] }];
                const weekendWeekdayCategories = ['Dni robocze','Weekend'];

                return (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">Przychód 24h</h4>
                        <div className="text-2xl font-bold mt-1">{Math.round(dayRevenue)} zł</div>
                        <div className="text-[11px] text-gray-500">Śr/sesja: {avgSessionValueDay.toFixed(2)} zł</div>
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">Przychód 7 dni</h4>
                        <div className="text-2xl font-bold mt-1">{Math.round(weekRevenue)} zł</div>
                        <div className="text-[11px] text-gray-500">Śr/sesja: {avgSessionValueWeek.toFixed(2)} zł</div>
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">Przychód 30 dni</h4>
                        <div className="text-2xl font-bold mt-1">{Math.round(monthRevenue)} zł</div>
                        <div className="text-[11px] text-gray-500">Śr/sesja: {avgSessionValueMonth.toFixed(2)} zł</div>
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">Śr. cena / minuta</h4>
                        <div className="text-2xl font-bold mt-1">{pricePerMinute.toFixed(2)} zł</div>
                        <div className="text-[11px] text-gray-500">Custom: {customPct.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Weekend vs Dni robocze</h4>
                      <Apex type="bar" height={240} series={weekendWeekdaySeries} options={{ ...buildLineOptions('weekendWeekday'), xaxis: { categories: weekendWeekdayCategories }, colors: ['#00d9ff'] }} />
                      <div className="text-xs text-gray-400 mt-2">Weekend: {Math.round(weekendRevenue)} zł / {weekendSessions} sesji | Dni robocze: {Math.round(weekdayRevenue)} zł / {weekdaySessions} sesji</div>
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Rozkład cen sesji</h4>
                      <Apex type="bar" height={260} series={histSeries} options={{ ...buildLineOptions('histPrices'), xaxis: { categories: histCategories }, colors: ['#ffb86b'] }} />
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Przychód na grę</h4>
                      <Apex type="bar" height={300} series={[{ name: 'Przychód', data: gameRevData }]} options={{ ...buildLineOptions('gameRev'), xaxis: { categories: gameRevCategories }, colors: ['#7c4dff'] }} />
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Przychód na grę / godzinę</h4>
                      <Apex type="heatmap" height={260} series={gameHourSeries} options={{ ...buildHeatmapOptions(), plotOptions: { heatmap: { shadeIntensity: 0.6 } } }} />
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Top dni (przychód)</h4>
                      {topDays.length === 0 ? <div className="text-xs text-gray-400">Brak danych</div> : (
                        <ul className="text-xs text-gray-200 space-y-1">
                          {topDays.map(([d,val]) => <li key={d} className="flex justify-between"><span>{d}</span><span className="font-semibold">{Math.round(val)} zł</span></li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {subpage === "stats" && statsSubPage === "analiza_graczy" && (
            <div className="bg-[#1e2636] p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-3">Analiza graczy</h3>
              {(() => {
                const stats = loadStats();
                const sessions: any[] = stats.sessions || [];
                if (!sessions.length) return <div className="text-sm text-gray-400">Brak danych</div>;

                // Group size distribution (1-8)
                const maxGroup = 8;
                const groupCounts = Array.from({length: maxGroup},()=>0); // index size-1
                const groupMinutes: number[] = Array.from({length:maxGroup},()=>0);
                const groupRevenue: number[] = Array.from({length:maxGroup},()=>0);
                const sessionDurations: number[] = []; // playedMinutes (group level)
                const plannedDurations: number[] = []; // planned
                const extensionRecords: Array<{planned:number; played:number; delta:number; players:number}> = [];

                sessions.forEach(s => {
                  const size = s.players || 1;
                  const sizeIdx = Math.min(Math.max(size,1), maxGroup) - 1;
                  groupCounts[sizeIdx] += 1;
                  const played = s.playedMinutes || s.duration || 0;
                  const totalPlayerMinutes = (s.perPlayerMinutes && s.perPlayerMinutes.length) ? s.perPlayerMinutes.reduce((a:number,b:number)=>a+(b||0),0) : played * size;
                  groupMinutes[sizeIdx] += totalPlayerMinutes; // player-minutes for fairness
                  const revenue = typeof s.revenue === 'number' ? s.revenue : (s.perSegmentRevenue ? s.perSegmentRevenue.reduce((a:number,seg:any)=>a+(seg.revenue||0),0):0);
                  groupRevenue[sizeIdx] += revenue;
                  sessionDurations.push(played);
                  if (typeof s.plannedMinutes === 'number') {
                    plannedDurations.push(s.plannedMinutes);
                    const delta = played - s.plannedMinutes;
                    extensionRecords.push({ planned: s.plannedMinutes, played, delta, players: size });
                  }
                });

                const mostPopularSizeIdx = groupCounts.reduce((bestIdx, val, idx, arr) => val > arr[bestIdx] ? idx : bestIdx, 0);
                const mostPopularSize = mostPopularSizeIdx + 1;

                // Average play time by group size (convert player-minutes back to per-player average minutes and also group total)
                const avgMinutesPerPlayerSize = groupCounts.map((count, idx) => count ? Math.round(groupMinutes[idx] / (count * (idx+1))) : 0);
                // Revenue by group size
                const revenuePerGroupSize = groupRevenue.map(v=> Math.round(v));

                // Session length histogram (bucket 15 min)
                const bucketSize = 15;
                const histMap: Record<string, number> = {};
                sessionDurations.forEach(min => {
                  const base = Math.floor(min / bucketSize) * bucketSize;
                  const key = `${base}-${base+bucketSize-1}`;
                  histMap[key] = (histMap[key] || 0) + 1;
                });
                const histCategories = Object.keys(histMap).sort((a,b)=> parseInt(a)-parseInt(b));
                const histSeries = [{ name: 'Sesje', data: histCategories.map(k=> histMap[k]) }];

                // Most common planned durations (najczęściej wybierane czasy gry)
                const plannedFreq: Record<number, number> = {};
                plannedDurations.forEach(p => { plannedFreq[p] = (plannedFreq[p] || 0)+1; });
                const popularPlanned = Object.entries(plannedFreq).sort((a,b)=> b[1]-a[1]).slice(0,5);

                // Extensions analysis (delta > 0 = przedłużenie)
                const extensions = extensionRecords.filter(r => r.delta > 3); // >3 min tolerance
                const shortened = extensionRecords.filter(r => r.delta < -3);
                const avgExtensionMinutes = extensions.length ? (extensions.reduce((a,r)=>a+r.delta,0)/extensions.length) : 0;
                const extensionRate = extensionRecords.length ? (extensions.length / extensionRecords.length * 100) : 0;

                // Charts
                const sizeCategories = Array.from({length:maxGroup},(_,i)=> `${i+1}`);
                const sizeDistSeries = [{ name: 'Sesje', data: groupCounts }];
                const avgSizeSeries = [{ name: 'Śr. min (na gracza)', data: avgMinutesPerPlayerSize }];
                const revenueSizeSeries = [{ name: 'Przychód', data: revenuePerGroupSize }];

                return (
                  <div className="flex flex-col gap-6">
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">Najpopularniejsza wielkość</h4>
                        <div className="text-2xl font-bold mt-1">{mostPopularSize}</div>
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">Liczba sesji</h4>
                        <div className="text-2xl font-bold mt-1">{sessions.length}</div>
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">% z przedłużeniem</h4>
                        <div className="text-2xl font-bold mt-1">{extensionRate.toFixed(1)}%</div>
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">Śr. przedłużenie (min)</h4>
                        <div className="text-2xl font-bold mt-1">{avgExtensionMinutes.toFixed(1)}</div>
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-xs text-gray-400">Przedł./Skrócenia</h4>
                        <div className="text-2xl font-bold mt-1">{extensions.length}/{shortened.length}</div>
                      </div>
                    </div>

                    {/* Group size distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Rozkład wielkości grup</h4>
                        <Apex type="bar" height={280} series={sizeDistSeries} options={{ ...buildLineOptions('groupDist'), xaxis: { categories: sizeCategories }, colors:['#00d9ff'] }} />
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Średni czas wg wielkości (min / gracz)</h4>
                        <Apex type="bar" height={280} series={avgSizeSeries} options={{ ...buildLineOptions('avgGroupTime'), xaxis: { categories: sizeCategories }, colors:['#ffb86b'] }} />
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Przychód wg wielkości grupy</h4>
                        <Apex type="bar" height={280} series={revenueSizeSeries} options={{ ...buildLineOptions('revGroup'), xaxis: { categories: sizeCategories }, colors:['#7c4dff'] }} />
                      </div>
                    </div>

                    {/* Session length histogram */}
                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Rozkład długości sesji (min)</h4>
                      <Apex type="bar" height={260} series={histSeries} options={{ ...buildLineOptions('sessionLen'), xaxis: { categories: histCategories }, colors:['#34d399'] }} />
                    </div>

                    {/* Most chosen planned times */}
                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Najczęściej wybierane czasy gry (planowane)</h4>
                      {popularPlanned.length === 0 ? <div className="text-xs text-gray-400">Brak danych planowanych czasów</div> : (
                        <ul className="text-xs text-gray-200 space-y-1">
                          {popularPlanned.map(([mins,count]) => (
                            <li key={mins} className="flex justify-between"><span>{mins} min</span><span className="font-semibold">{count}</span></li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Extensions detail list */}
                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Analiza przedłużeń (top 10)</h4>
                      {extensions.length === 0 ? <div className="text-xs text-gray-400">Brak przedłużeń</div> : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 text-left">
                              <th className="py-1 pr-2">Graczy</th>
                              <th className="py-1 pr-2">Plan</th>
                              <th className="py-1 pr-2">Zagrano</th>
                              <th className="py-1 pr-2">+Min</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extensions.sort((a,b)=> b.delta - a.delta).slice(0,10).map((e,i)=>(
                              <tr key={i} className="border-t border-gray-700">
                                <td className="py-1 pr-2">{e.players}</td>
                                <td className="py-1 pr-2">{e.planned}</td>
                                <td className="py-1 pr-2">{e.played}</td>
                                <td className="py-1 pr-2 text-green-400 font-semibold">+{e.delta}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {subpage === "stats" && statsSubPage === "analiza_gier" && (
            <div className="bg-[#1e2636] p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-3">Analiza gier</h3>
              {(() => {
                const stats = loadStats();
                const sessions: any[] = stats.sessions || [];
                if (!sessions.length) return <div className="text-sm text-gray-400">Brak danych</div>;

                interface GameAgg {
                  game: string;
                  sessionsCount: number; // liczba sesji w których gra wystąpiła
                  segmentsCount: number;
                  totalSegmentMinutes: number; // suma minut segmentowych (bez mnożenia przez graczy)
                  totalPlayerMinutes: number; // suma (segmentMin * playersInSeg)
                  revenue: number;
                  extensionSessions: number; // ile sesji z przedłużeniem zawierało grę
                  pausePlayerMinutes: number; // rozdzielone pauzy (player-min)
                  groupSizeSum: number; // suma wielkości grup w sesjach występowania
                }
                const gameAgg: Record<string, GameAgg> = {};

                // Pre-calc session level extension and pause deltas
                type SessionInfo = { games: Set<string>; extension: boolean; playerMinutes: number; plannedPlayerMinutes: number; pausePlayerMinutes: number; groupSize: number; segments: any[] };
                const sessionInfos: SessionInfo[] = [];
                sessions.forEach(s => {
                  const groupSize = s.players || 1;
                  const played = s.playedMinutes || s.duration || 0;
                  const playerMinutes = (s.perPlayerMinutes && s.perPlayerMinutes.length)
                    ? s.perPlayerMinutes.reduce((a:number,b:number)=>a+(b||0),0)
                    : played * groupSize;
                  const plannedMinutes = typeof s.plannedMinutes === 'number' ? s.plannedMinutes : played; // fallback
                  const plannedPlayerMinutes = plannedMinutes * groupSize;
                  const pausePlayerMinutes = Math.max(0, plannedPlayerMinutes - playerMinutes);
                  const extension = played > plannedMinutes + 3; // tolerance
                  const games = new Set<string>();
                  (s.gameSegments || []).forEach((seg:any)=> { if (seg.gameType) games.add(seg.gameType); });
                  sessionInfos.push({ games, extension, playerMinutes, plannedPlayerMinutes, pausePlayerMinutes, groupSize, segments: s.gameSegments || [] });
                });

                // Helper to extract segment revenue
                const getSegRevenue = (session: any, seg: any, segMinutes: number, playersInSeg: number) => {
                  if (Array.isArray(session.perSegmentRevenue)) {
                    const found = session.perSegmentRevenue.find((r:any)=> r.gameType === seg.gameType && r.minutes === segMinutes);
                    if (found) return found.revenue || 0;
                  }
                  if (segMinutes <=0) return 0;
                  const singleRate = segMinutes ? (getSinglePlayerAmount(segMinutes, seg.startTime) / segMinutes) : 0;
                  return singleRate * segMinutes * playersInSeg;
                };

                sessions.forEach((s, idx) => {
                  const info = sessionInfos[idx];
                  (s.gameSegments || []).forEach((seg:any) => {
                    if (!seg.gameType) return;
                    const playersInSeg = (seg.players && seg.players.length) || (s.players || 1);
                    const segMinutes = seg.duration || (() => { try { return Math.max(0, Math.floor((DateTime.fromISO(seg.endTime).toMillis() - DateTime.fromISO(seg.startTime).toMillis())/60000)); } catch { return 0; } })();
                    if (!gameAgg[seg.gameType]) {
                      gameAgg[seg.gameType] = { game: seg.gameType, sessionsCount: 0, segmentsCount: 0, totalSegmentMinutes: 0, totalPlayerMinutes: 0, revenue: 0, extensionSessions: 0, pausePlayerMinutes: 0, groupSizeSum: 0 };
                    }
                    const g = gameAgg[seg.gameType];
                    g.segmentsCount += 1;
                    g.totalSegmentMinutes += segMinutes;
                    g.totalPlayerMinutes += segMinutes * playersInSeg;
                    g.revenue += getSegRevenue(s, seg, segMinutes, playersInSeg);
                  });
                  info.games.forEach(game => {
                    const g = gameAgg[game];
                    g.sessionsCount += 1;
                    g.groupSizeSum += info.groupSize;
                    if (info.extension) g.extensionSessions += 1;
                  });
                });

                // Distribute pause minutes proportionally to player-minutes within each session
                sessionInfos.forEach((info, idx) => {
                  if (info.pausePlayerMinutes <= 0) return;
                  // compute total player-minutes per game in this session
                  const perGamePlayerMin: Record<string, number> = {};
                  (sessions[idx].gameSegments || []).forEach((seg:any)=>{
                    if (!seg.gameType) return;
                    const playersInSeg = (seg.players && seg.players.length) || (sessions[idx].players || 1);
                    const segMinutes = seg.duration || (() => { try { return Math.max(0, Math.floor((DateTime.fromISO(seg.endTime).toMillis() - DateTime.fromISO(seg.startTime).toMillis())/60000)); } catch { return 0; } })();
                    perGamePlayerMin[seg.gameType] = (perGamePlayerMin[seg.gameType] || 0) + segMinutes * playersInSeg;
                  });
                  const total = Object.values(perGamePlayerMin).reduce((a,b)=>a+b,0) || 1;
                  Object.entries(perGamePlayerMin).forEach(([game, pm]) => {
                    const share = pm / total;
                    gameAgg[game].pausePlayerMinutes += info.pausePlayerMinutes * share;
                  });
                });

                // Build derived metrics arrays
                const gamesList = Object.values(gameAgg);
                if (!gamesList.length) return <div className="text-sm text-gray-400">Brak segmentów gier</div>;

                const popularitySorted = [...gamesList].sort((a,b)=> b.totalPlayerMinutes - a.totalPlayerMinutes);
                const revenueSorted = [...gamesList].sort((a,b)=> b.revenue - a.revenue);
                const roiSorted = [...gamesList].sort((a,b)=> (b.revenue/(b.totalPlayerMinutes||1)) - (a.revenue/(a.totalPlayerMinutes||1)));
                const extensionSorted = [...gamesList].sort((a,b)=> (b.extensionSessions/(b.sessionsCount||1)) - (a.extensionSessions/(a.sessionsCount||1)));
                const rotationSorted = [...gamesList].sort((a,b)=> (b.totalSegmentMinutes/(b.segmentsCount||1)) - (a.totalSegmentMinutes/(a.segmentsCount||1)));

                // Chart data: popularity (top 15)
                const safeNumber = (v:any) => (Number.isFinite(v) && !isNaN(v)) ? v : 0;
                const topPop = popularitySorted.slice(0,15);
                const popCategories = topPop.map(g=>g.game);
                const popSeries = [{ name: 'Player-minuty', data: topPop.map(g=> safeNumber(Math.round(g.totalPlayerMinutes))) }];

                // Pie (donut) popularity share using player-minutes
                const donutSeries = popSeries[0].data.map(safeNumber);

                // Revenue per game (top 15)
                const topRev = revenueSorted.slice(0,15);
                const revCategories = topRev.map(g=>g.game);
                const revSeries = [{ name: 'Przychód', data: topRev.map(g=> safeNumber(Math.round(g.revenue))) }];

                // ROI per game (top 15 up to ROI)
                const topROI = roiSorted.slice(0,15);
                const roiCategories = topROI.map(g=>g.game);
                const roiSeries = [{ name: 'zł / player-min', data: topROI.map(g=> safeNumber(+(g.revenue/(g.totalPlayerMinutes||1)).toFixed(2))) }];

                // Average session time per game (segment minutes per session)
                const avgSessionTimeSeries = [{ name: 'Śr. min / sesja', data: topPop.map(g=> safeNumber(+(g.totalSegmentMinutes/(g.sessionsCount||1)).toFixed(1))) }];

                // Average session value per game (revenue / sessionsCount)
                const avgValueSeries = [{ name: 'Śr. wartość sesji', data: topRev.map(g=> safeNumber(+(g.revenue/(g.sessionsCount||1)).toFixed(2))) }];

                // Extensions rate per game (top 10)
                const topExt = extensionSorted.slice(0,10);
                const extCategories = topExt.map(g=>g.game);
                const extSeries = [{ name: '% sesji z przedłużeniem', data: topExt.map(g=> safeNumber(+(g.extensionSessions/(g.sessionsCount||1)*100).toFixed(1))) }];

                // Rotation (avg segment duration) top 10
                const topRot = rotationSorted.slice(0,10);
                const rotCategories = topRot.map(g=>g.game);
                const rotSeries = [{ name: 'Śr. min segmentu', data: topRot.map(g=> safeNumber(+(g.totalSegmentMinutes/(g.segmentsCount||1)).toFixed(1))) }];

                // Group size correlation: average group size
                const groupSizeSorted = [...gamesList].sort((a,b)=> (b.groupSizeSum/(b.sessionsCount||1)) - (a.groupSizeSum/(a.sessionsCount||1))).slice(0,15);
                const groupSizeCategories = groupSizeSorted.map(g=>g.game);
                const groupSizeSeries = [{ name: 'Śr. wielkość grupy', data: groupSizeSorted.map(g=> safeNumber(+(g.groupSizeSum/(g.sessionsCount||1)).toFixed(2))) }];

                // Pause percentage per game (approx)
                const pausePercSeries = [{ name: '% pauzy', data: topPop.map(g=> {
                  const perc = g.pausePlayerMinutes > 0 ? (g.pausePlayerMinutes / (g.pausePlayerMinutes + g.totalPlayerMinutes) * 100) : 0; return safeNumber(+perc.toFixed(1)); }) }];

                // Top 10 most profitable games list (revenue)
                const top10Prof = revenueSorted.slice(0,10);

                // Stations preference: compute per game station minutes
                const stationMinutesPerGame: Record<string, number[]> = {};
                sessions.forEach(s => {
                  (s.gameSegments || []).forEach((seg:any)=>{
                    if (!seg.gameType) return;
                    const segMinutes = seg.duration || (() => { try { return Math.max(0, Math.floor((DateTime.fromISO(seg.endTime).toMillis() - DateTime.fromISO(seg.startTime).toMillis())/60000)); } catch { return 0; } })();
                    const players = (seg.players && seg.players.length) ? seg.players : [...Array((s.players||1))].map((_,i)=>i);
                    players.forEach((pi:number) => {
                      const station = s.stations?.[pi];
                      if (!station) return;
                      stationMinutesPerGame[seg.gameType] = stationMinutesPerGame[seg.gameType] || Array.from({length:9},()=>0);
                      stationMinutesPerGame[seg.gameType][station] += segMinutes;
                    });
                  });
                });

                // For each top game get top station
                const stationPref = Object.entries(stationMinutesPerGame).map(([game, arr]) => {
                  const bestIdx = arr.reduce((bi, val, idx, a)=> val > a[bi] ? idx : bi, 0);
                  return { game, station: bestIdx, minutes: arr[bestIdx] };
                }).sort((a,b)=> b.minutes - a.minutes).slice(0,10);

                return (
                  <div className="flex flex-col gap-6">
                    {/* Popularność */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Popularność (player-minuty)</h4>
                        <Apex type="bar" height={300} series={popSeries} options={{ ...buildLineOptions('gamePop'), xaxis: { categories: popCategories }, colors:['#00d9ff'] }} />
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Udział popularności (Top 15)</h4>
                        <Apex type="donut" height={300} series={donutSeries} options={{ labels: popCategories, theme:{mode:'dark'}, legend:{show:false} }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Średni czas sesji na grę (min)</h4>
                        <Apex type="bar" height={280} series={avgSessionTimeSeries} options={{ ...buildLineOptions('avgSessGame'), xaxis:{ categories: popCategories }, colors:['#ffb86b'] }} />
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Śr. wartość sesji wg gry</h4>
                        <Apex type="bar" height={280} series={avgValueSeries} options={{ ...buildLineOptions('avgValGame'), xaxis:{ categories: revCategories }, colors:['#7c4dff'] }} />
                      </div>
                    </div>

                    {/* Finansowa */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Przychód na grę (Top 15)</h4>
                        <Apex type="bar" height={300} series={revSeries} options={{ ...buildLineOptions('revGame'), xaxis:{ categories: revCategories }, colors:['#34d399'] }} />
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">ROI (zł / player-min)</h4>
                        <Apex type="bar" height={300} series={roiSeries} options={{ ...buildLineOptions('roiGame'), xaxis:{ categories: roiCategories }, colors:['#f78c6c'] }} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Top 10 najbardziej dochodowych gier</h4>
                      <ul className="text-xs text-gray-200 space-y-1">
                        {top10Prof.map(g => (
                          <li key={g.game} className="flex justify-between"><span className="truncate pr-2">{g.game}</span><span className="font-semibold">{Math.round(g.revenue)} zł</span></li>
                        ))}
                      </ul>
                    </div>

                    {/* Zachowania */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">% sesji z przedłużeniem (Top 10)</h4>
                        <Apex type="bar" height={280} series={extSeries} options={{ ...buildLineOptions('extGame'), xaxis:{ categories: extCategories }, colors:['#ff79c6'] }} />
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">% pauzy (szacowane) – Top 15</h4>
                        <Apex type="bar" height={280} series={pausePercSeries} options={{ ...buildLineOptions('pauseGame'), xaxis:{ categories: popCategories }, colors:['#c792ea'] }} />
                      </div>
                    </div>
                    <div className="p-3 bg-[#0f1525] rounded text-xs text-gray-400">Przypomnienia per gra: brak danych historycznych (nie są zapisywane w statystykach – można dodać w przyszłości).</div>

                    {/* Stanowiska & korelacje */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Preferowane stanowiska (Top 10 gier)</h4>
                        <ul className="text-xs text-gray-200 space-y-1 max-h-72 overflow-auto pr-1">
                          {stationPref.map(sp => (
                            <li key={sp.game} className="flex justify-between"><span className="truncate pr-2">{sp.game}</span><span className="font-semibold">St {sp.station} ({Math.round(sp.minutes)}m)</span></li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-[#0f1525] rounded">
                        <h4 className="text-sm text-gray-300 mb-2">Śr. wielkość grupy (Top 15)</h4>
                        <Apex type="bar" height={300} series={groupSizeSeries} options={{ ...buildLineOptions('grpSizeGame'), xaxis:{ categories: groupSizeCategories }, colors:['#82aaff'] }} />
                      </div>
                    </div>

                    <div className="p-3 bg-[#0f1525] rounded">
                      <h4 className="text-sm text-gray-300 mb-2">Rotacja – gry o najdłuższych segmentach</h4>
                      <Apex type="bar" height={300} series={rotSeries} options={{ ...buildLineOptions('rotGame'), xaxis:{ categories: rotCategories }, colors:['#ffcb6b'] }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {subpage === "stats" && statsSubPage === "operacyjne" && (
            <div className="">
              operacyjne
            </div>
          )}

          {subpage === "stats" && statsSubPage === "wskazniki" && (
            <div className="">
              wskazniki
            </div>
          )}


        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && clientToDelete && (
        <div
          className="fixed left-0 top-0 w-full h-full z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => {
            setShowDeleteModal(false);
            setClientToDelete(null);
          }}
        >
          <div
            className="bg-[#1e2636] p-6 rounded-lg shadow-lg min-w-[320px] border border-[#00d9ff]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-[#00d9ff]">
              Potwierdź usunięcie
            </h3>
            <p className="mb-2 text-white">
              Czy na pewno chcesz usunąć klienta?
            </p>
            <p className="mb-6 text-white">
              Stanowiska:{" "}
              <span className="font-semibold text-[#00d9ff]">
                {clientToDelete.stations
                  .map((s) => stanowiskoLabels[s])
                  .join(", ")}
              </span>
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  if (clientToDelete) {
                    handleDeleteClientWithoutStats(clientToDelete.id);
                  }
                  setShowDeleteModal(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-800 hover:scale-105 hover:shadow-lg font-semibold transition"
                title="Usuń klienta bez zapisywania do statystyk"
              >
                Usuń bez statystyk
              </button>
              <button
                onClick={() => {
                  handleDeleteClient(clientToDelete.id);
                  setShowDeleteModal(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-900 hover:scale-105 hover:shadow-lg font-bold transition"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder modal */}
      {showReminderModal && activeReminder && (
        <div
          className="fixed left-0 top-0 w-full h-full z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => {
            setShowReminderModal(false);
            setActiveReminder(null);
          }}
        >
          <div
            className="bg-[#1e2636] p-6 rounded-lg shadow-lg min-w-[320px] border border-pink-500"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-[#00d9ff]">
              Przypomnienie
            </h3>
            <p className="mb-2 text-white">
              {activeReminder?.client?.reminderText || "Czas przypomnienia:"}
            </p>
            <p className="mb-6 text-white">
              Stanowiska:{" "}
              <span className="font-semibold text-[#00d9ff]">
                {activeReminder?.client?.stations
                  .map((s) => stanowiskoLabels[s])
                  .join(", ")}
              </span>
            </p>
            <p className="mb-6 text-white">
              Pozostało:{" "}
              <span className="font-semibold text-[#00d9ff]">
                {activeReminder?.time} minut
              </span>
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  // Jeśli aktywne przypomnienie jest trybu 'every', zarejestruj jego potwierdzenie
                  if (activeReminder?.client?.reminderMode === "every") {
                    const c = activeReminder.client;
                    const start = DateTime.fromISO(c.startTime);
                    const now = DateTime.now();
                    const elapsedMinutes = Math.floor(
                      now.diff(start, "minutes").minutes
                    );
                    setClients((prev) =>
                      prev.map((pc) =>
                        pc.id === c.id
                          ? { ...pc, lastEveryTriggeredMinute: elapsedMinutes }
                          : pc
                      )
                    );
                  }

                  setShowReminderModal(false);
                  setActiveReminder(null);
                }}
                className="px-4 py-2 rounded bg-[#00d9ff] text-[#1e2636] hover:bg-[#00a0c0] hover:scale-105 hover:shadow-lg font-bold transition"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floatujący dymek stopera */}
      {showStopwatchBubble && (
        <div
          className="fixed bg-[#1e2636] border border-gray-500 rounded-lg p-4 shadow-lg z-50 cursor-move"
          style={{
            left: stopwatchBubblePosition.x,
            top: stopwatchBubblePosition.y,
            width: "250px",
          }}
          onMouseDown={handleStopwatchMouseDown}
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-[#00d9ff]">Stoper</h4>
            <button
              onClick={() => setShowStopwatchBubble(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="text-center mb-3">
            <div className="text-xl  font-bold text-white">
              {formatTime(stopwatchTime)}
            </div>
          </div>

          <div className="flex gap-1 mb-3 font-semibold">
            {!stopwatchRunning ? (
              <button
                onClick={startStopwatch}
                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
              >
                Start
              </button>
            ) : (
              <button
                onClick={pauseStopwatch}
                className="flex-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition "
              >
                Pauza
              </button>
            )}

            <button
              onClick={measureStopwatch}
              disabled={!stopwatchRunning}
              className="flex-1 px-2 py-1 bg-indigo-700 hover:bg-indigo-800 disabled:bg-gray-600 text-white rounded text-sm transition"
            >
              Pomiar
            </button>

            <button
              onClick={resetStopwatch}
              className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-800 text-white rounded text-sm transition"
            >
              Reset
            </button>
          </div>

          <button
            onClick={() => setShowStopwatchBubble(false)}
            className="w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition"
          >
            Ukryj
          </button>
        </div>
      )}

      {/* Floatujący dymek minutnika */}
      {showTimerBubble && (
        <div
          className="fixed bg-[#1e2636] border border-gray-500 rounded-lg p-4 shadow-lg z-50 cursor-move"
          style={{
            left: timerBubblePosition.x,
            top: timerBubblePosition.y,
            width: "250px",
          }}
          onMouseDown={handleTimerMouseDown}
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-[#00d9ff]">Minutnik</h4>
            <button
              onClick={() => setShowTimerBubble(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="text-center mb-3">
            <div className="text-xl  font-bold text-white">
              {formatTime(timerRemainingSeconds)}
            </div>
          </div>

          <div className="flex gap-1 mb-3 font-semibold">
            {!timerRunning ? (
              <button
                onClick={startTimer}
                disabled={timerMinutes === 0 && timerSeconds === 0}
                className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm transition"
              >
                <FaPlay className="inline mr-1" size={12} />
                Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition"
              >
                <FaPause className="inline mr-1" size={12} />
                Pauza
              </button>
            )}

            <button
              onClick={resetTimer}
              className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-800 text-white rounded text-sm transition"
            >
              Reset
            </button>
          </div>

          <button
            onClick={() => setShowTimerBubble(false)}
            className="w-full px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition"
          >
            Ukryj
          </button>
        </div>
      )}

      {/* Modal końca minutnika */}
      {showTimerModal && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e2636] border border-[#00d9ff] rounded-lg p-6 max-w-md w-full mx-4 relative">
            <h3 className="text-lg font-bold mb-4 text-[#00d9ff]">
              Czas upłynął!
            </h3>
            <p className="mb-6 text-white">Minutnik zakończył odliczanie.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowTimerModal(false);
                  resetTimer();
                }}
                className="px-4 py-2 rounded bg-[#00d9ff] text-[#1e2636] hover:bg-[#00a0c0] hover:scale-105 hover:shadow-lg font-bold transition"
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

export default AdminClientManager;
