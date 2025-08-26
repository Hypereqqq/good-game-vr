// This code defines a React component for managing clients in a game setting, allowing for adding, editing,
// and removing clients, as well as handling various configurations like custom start times, durations, and payment options.
// It uses Jotai for state management and Luxon for date handling.

// Import necessary libraries and types
import React, { useEffect, useRef, useState } from "react";
//import { HexColorPicker } from "react-colorful";
import { useAtom } from "jotai";
import { clientsAtom } from "../store/clients";
import { v4 as uuidv4 } from "uuid";
import { ClientGame } from "../types/types";
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
  // Key for local storage to persist clients and queue clients
  const LOCAL_STORAGE_KEY = "ggvr_clients";
  const QUEUE_LOCAL_STORAGE_KEY = "ggvr_queueClients";

  // State management using Jotai atoms
  const [subpage, setSubpage] = useState<SubpageType>("main");
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

  // Stoper states
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0); // czas w sekundach
  const [stopwatchStartTime, setStopwatchStartTime] = useState<number | null>(null);
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
  const [stopwatchBubblePosition, setStopwatchBubblePosition] = useState({ x: 20, y: 20 });
  const [timerBubblePosition, setTimerBubblePosition] = useState({ x: 300, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeBox, setActiveBox] = useState<'stopwatch' | 'timer' | null>(null);

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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset.x, dragOffset.y]);

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
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    setMeasurements(prev => [...prev, stopwatchTime]);
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

  // Bubble dragging functions
  const handleStopwatchMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setActiveBox('stopwatch');
    setDragOffset({
      x: e.clientX - stopwatchBubblePosition.x,
      y: e.clientY - stopwatchBubblePosition.y
    });
  };

  const handleTimerMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setActiveBox('timer');
    setDragOffset({
      x: e.clientX - timerBubblePosition.x,
      y: e.clientY - timerBubblePosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && activeBox) {
      if (activeBox === 'stopwatch') {
        setStopwatchBubblePosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      } else if (activeBox === 'timer') {
        setTimerBubblePosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
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
              }
            : client
        )
      );
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
      };
      setClients((prev) => [...prev, newClient]);
    }

    resetForm();
  };

  // Function to handle deleting a client
  const handleDeleteClient = (id: string) => {
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

          return {
            ...client,
            startTime: newStartTime,
            isPaused: false,
            pauseStartTime: undefined,
            reminderSetTime: newReminderSetTime,
          } as ClientGame;
        } else {
          // Wstrzymanie gry
          return {
            ...client,
            isPaused: true,
            pauseStartTime: now.toISO(),
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
                <h3 className="text-lg font-semibold text-white mb-2">Stoper</h3>
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

                  {!showStopwatchBubble && (stopwatchRunning || measurements.length > 0) && (
                    <button
                      onClick={() => setShowStopwatchBubble(true)}
                      className="w-full px-4 py-2 bg-[#1e2636] hover:bg-[#147a8f] text-white rounded transition"
                    >
                      Pokaż
                    </button>
                  )}

                  {measurements.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-300 mb-2">Pomiary:</h4>
                      <div className="max-h-32 overflow-y-auto bg-[#1e2636] p-2 rounded">
                        {measurements.map((time, index) => (
                          <div key={index} className="text-sm text-gray-300 font-mono">
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
                <h3 className="text-lg font-semibold text-white mb-2">Minutnik</h3>
                <div className="bg-[#0f1525] p-4 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-2xl  font-bold text-white">
                      {timerRunning ? formatTime(timerRemainingSeconds) : formatTime(timerMinutes * 60 + timerSeconds)}
                    </div>
                  </div>

                  {!timerRunning && (
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-300 mb-1">Minuty</label>
                        <input
                          type="number"
                          value={timerMinutes}
                          onChange={(e) => setTimerMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full p-2 rounded bg-[#1e2636] border border-gray-600 text-white"
                          min="0"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm text-gray-300 mb-1">Sekundy</label>
                        <input
                          type="number"
                          value={timerSeconds}
                          onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                          className="w-full p-2 rounded bg-[#1e2636] border border-gray-600 text-white"
                          min="0"
                          max="59"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-center font-semibold">
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

          {subpage === "stats" && <div className="mb-4">Statystyki</div>}
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
                              <div className="font-semibold text-blue-300">
                                {client.duration} min
                              </div>
                              <div className="text-sm mt-2 text-gray-400">
                                {DateTime.fromISO(client.startTime).toFormat(
                                  "HH:mm"
                                )}{" "}
                                –{" "}
                                {calculateEndTime(
                                  client.startTime,
                                  client.duration
                                ).toFormat("HH:mm")}
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
                                    className={`text-sm mt-1 ${colorClass} ${blinkClass}`}
                                  >
                                    Pozostało: {text}
                                  </div>
                                );
                              })()}
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
                              <div className="flex justify-end gap-2 mt-4 text-[15px] h-[17px]">
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

          {subpage === "stats" && (
            <div className="mt-4">
              <h3 className="text-lg font-bold mb-2 text-[#00d9ff]">
                Statystyki
              </h3>
              <p className="mb-2 text-white">
                Liczba aktywnych klientów:{" "}
                <span className="font-semibold text-[#00d9ff]">
                </span>
              </p>
              <p className="mb-2 text-white">
                Liczba wstrzymanych klientów:{" "}
                <span className="font-semibold text-[#00d9ff]">
                </span>
              </p>
              <p className="mb-2 text-white">
                Liczba klientów z przypomnieniami:{" "}
                <span className="font-semibold text-[#00d9ff]">
                </span>
              </p>
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
            width: '250px'
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
            width: '250px'
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
            <p className="mb-6 text-white">
              Minutnik zakończył odliczanie.
            </p>
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
