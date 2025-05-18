import React, { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { clientsAtom } from "../store/clients";
import { v4 as uuidv4 } from "uuid";
import { ClientGame } from "../types/types";
import { DateTime } from "luxon";
import { FaTrash, FaEdit, FaCommentDots } from "react-icons/fa";

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

const AdminClientManager: React.FC = () => {
  const [clients, setClients] = useAtom(clientsAtom);
  const [peopleCount, setPeopleCount] = useState(1);
  const [name, setName] = useState("");
  const [slots, setSlots] = useState<number[]>([1]);
  const [duration, setDuration] = useState(30);
  const [paid, setPaid] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [customStartEnabled, setCustomStartEnabled] = useState(false);
  const [customHour, setCustomHour] = useState(10); // domyślnie 10:00
  const [customMinute, setCustomMinute] = useState(0); // domyślnie 0 min
  const [customPriceEnabled, setCustomPriceEnabled] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [addComment, setAddComment] = useState(false);
  const [comment, setComment] = useState<string>("");
  const [duplicateSlots, setDuplicateSlots] = useState<number[]>([]);
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitGroupsCount, setSplitGroupsCount] = useState<number | "">("");
  const [splitGroups, setSplitGroups] = useState<
    { players: number; stations: number[] }[]
  >([]);
  const [splitError, setSplitError] = useState(false);

  const [, setTick] = useState(0); // tylko do triggerowania re-renderu
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientGame | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });
  const [, setOriginalClients] = useState<ClientGame[]>([]);

  const LOCAL_STORAGE_KEY = "ggvr_clients";

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    setOriginalClients(clients);
  }, [clients]);

  useEffect(() => {
    if (editId && !clients.some((c) => c.id === editId)) {
      setEditId(null);
      resetForm();
    }
  }, [clients, editId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1); // wymusza re-render
    }, 1000); // co 1 sekunda

    return () => clearInterval(interval); // czyszczenie przy unmount
  }, []);

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

  useEffect(() => {
    if (customPriceEnabled && customPrice === null) {
      setCustomPrice(getSinglePlayerAmount(duration, new Date().toISOString()));
    }
  }, [customPriceEnabled, duration, peopleCount]);

  useEffect(() => {
    // UWAGA: jeśli edytujemy klienta, NIE nadpisuje godziny startowej
    if (customStartEnabled && !editId) {
      const now = DateTime.now();
      setCustomHour(now.hour);
      setCustomMinute(now.minute);
    }
  }, [customStartEnabled, editId]);

  const resetForm = () => {
    setName("");
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
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    return DateTime.fromISO(startTime).plus({ minutes: duration });
  };

  const getRemainingTime = (
    startTime: string,
    duration: number
  ): { text: string; minutes: number; isOver: boolean } => {
    const now = DateTime.now();
    const end = DateTime.fromISO(startTime).plus({ minutes: duration });
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

  const getSinglePlayerAmount = (
    duration: number,
    startTime: string
  ): number => {
    const start = DateTime.fromISO(startTime);
    const isWeekend = [5, 6, 7].includes(start.weekday);
    const rate = isWeekend ? 45 : 39;
    return (rate / 30) * duration;
  };

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
                name,
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
              }
            : client
        )
      );
      setEditId(null);
    } else {
      const newClient: ClientGame = {
        id: uuidv4(),
        name,
        stations,
        players: peopleCount,
        duration,
        startTime: now.toISOString(),
        paid,
        customPrice: customPriceEnabled ? customPrice ?? undefined : undefined,
        customStart: customStartEnabled,
        comment: addComment ? comment : undefined,
      };
      setClients((prev) => [...prev, newClient]);
    }

    resetForm();
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
  };

  const handleEditClient = (client: ClientGame) => {
    if (editId === client.id) {
      // Jeśli klikamy edycję tego samego klienta -> wyłącz edycję
      setEditId(null);
      resetForm(); // pełne resetowanie
    } else {
      setEditId(client.id);
      setName(client.name);
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
    }
  };

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

  const occupiedStations = clients
    .filter((c) => c.id !== editId)
    .flatMap((client) => client.stations);

  const takenStationsCount = clients.reduce(
    (total, client) => total + client.stations.length,
    0
  );

  const allStationsTaken = !editId && takenStationsCount >= 8;

  const sortedStationOrder = [1, 2, 5, 6, 8, 7, 3, 4];

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
          const aRem = getRemainingTime(a.startTime, a.duration).minutes;
          const bRem = getRemainingTime(b.startTime, b.duration).minutes;
          return sortConfig.direction === "asc" ? aRem - bRem : bRem - aRem;
        case "paid":
          // Najpierw opłacone, potem nieopłacone (asc), odwrotnie (desc)
          if (a.paid !== b.paid) {
            return sortConfig.direction === "asc"
              ? a.paid
                ? -1
                : 1
              : a.paid
              ? 1
              : -1;
          }
          // Jeśli oba nieopłacone, sortuj po kwocie malejąco
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

  const handleSort = (key: string, twoWay = false) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        // Pierwsze kliknięcie: sortowanie domyślne (rosnąco lub wg specyfikacji)
        return { key, direction: "asc" };
      } else if (prev.direction === "asc") {
        // Drugie kliknięcie: sortowanie odwrotne
        return { key, direction: twoWay ? "desc" : null };
      } else if (prev.direction === "desc") {
        // Trzecie kliknięcie: powrót do domyślnego
        return { key: null, direction: null };
      } else {
        // Powrót do domyślnego
        return { key: null, direction: null };
      }
    });
  };

  return (
    <section className="bg-[#0f1525] text-white px-6 py-10 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 bg-[#1e2636] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-[#00d9ff] mb-4 uppercase">
            Zarządzaj klientami
          </h2>

          <div className="mb-4">
            <label className="block mb-1 text-sm">Liczba osób:</label>
            <div className="flex items-center gap-2">
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

          <div className="mb-4">
            <label className="block text-sm">Nazwa grupy / klienta:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white mb-2"
              placeholder="Wpisz nazwę"
            />
          </div>

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
                  setDuplicateSlots([]); // reset błędu po zmianie
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

          {showDuplicateError && (
            <div className="mb-4 text-red-500 text-sm">
              Wszystkie stanowiska muszą być unikalne!
            </div>
          )}

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
                  onClick={() => setDuration((prev) => Math.max(1, prev - val))}
                  className="px-3 py-1 bg-[#911e1e] hover:bg-red-600 text-white text-sm rounded"
                  type="button"
                >
                  -{val}
                </button>
              ))}
            </div>
          </div>

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
                        setCustomPrice((prev) => Math.max(0, (prev ?? 0) - val))
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
                          e.target.value === "" ? "" : Number(e.target.value);
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
                            stations: Array(i < rest ? base + 1 : base).fill(
                              null
                            ),
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
                            <tr key={idx} className="border-b border-gray-700">
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
                                      ].stations.slice(0, updated[idx].players);
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
                                  {Array.from({ length: group.players }).map(
                                    (_, pIdx) => {
                                      const stationValue = group.stations[pIdx];
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
                                    }
                                  )}
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
                      {splitGroups.some((g) => g.stations.some((s) => !s)) && (
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

        {/* PRAWA STRONA: Kafelki stanowisk */}
        <div className="w-full md:w-2/3 px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => {
              const slotIndex = index + 1;
              const clientsInSlot = clients.filter((client) =>
                client.stations.includes(slotIndex)
              );

              const isEditing = clientsInSlot.some(
                (client) => editId === client.id
              );

              return (
                <div
                  key={index}
                  className={`bg-[#1e2636] rounded-lg p-4 shadow-md flex flex-col h-50 break-words transition
                              ${isEditing ? "ring-1 ring-[#00d9ff] z-10" : ""}`}
                  style={{
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-bold text-[#00d9ff]">
                      {stanowiskoLabels[slotIndex]}
                    </div>
                    {clientsInSlot.length > 0 && (
                      <div className="flex gap-2">
                        <span className="relative group flex items-center mr-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleEditClient(clientsInSlot[0]);
                              if (!clientsInSlot[0].comment) {
                                setAddComment(true);
                                setTimeout(() => {
                                  commentInputRef.current?.focus();
                                }, 0);
                              } else {
                                setTimeout(() => {
                                  commentInputRef.current?.focus();
                                }, 0);
                              }
                            }}
                            className={`text-gray-500 hover:text-green-500/80 ${
                              clientsInSlot[0].comment
                                ? "text-green-500"
                                : "text-gray-500"
                            }`}
                            title={
                              clientsInSlot[0].comment ? "" : "Dodaj komentarz"
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
                      return (
                        <div key={i} className="text-sm text-blue-300 mb-2">
                          <div className="font-semibold">
                            {client.name} – {client.duration} min
                          </div>
                          <div className="text-sm mt-4 text-gray-400">
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
                            const { text, minutes, isOver } = getRemainingTime(
                              client.startTime,
                              client.duration
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

          <div className="overflow-x-auto lg:overflow-x-visible mt-10">
            <table className="w-full table-auto text-sm bg-[#1e2636] rounded-lg shadow-md">
              <thead>
                <tr className="text-left border-b border-gray-600 text-[#00d9ff]">
                  <th className="p-3">Nazwa</th>
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
                    client.duration
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
                      <td className="p-3 text-white">{client.name}</td>
                      <td className="p-3 text-white">{client.players}</td>
                      <td className="p-3 text-white">
                        {client.stations
                          .map((s) => `${stanowiskoLabels[s]}`)
                          .join(", ")}
                      </td>
                      <td className="p-3 text-white">{client.duration} min</td>
                      <td className="p-3 text-white">
                        {DateTime.fromISO(client.startTime).toFormat("HH:mm")}
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
                      <td className="p-3 flex gap-2 items-center">
                        <span className="relative group flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              handleEditClient(client);
                              if (!client.comment) {
                                setAddComment(true);
                                setTimeout(() => {
                                  commentInputRef.current?.focus();
                                }, 0);
                              } else {
                                setTimeout(() => {
                                  commentInputRef.current?.focus();
                                }, 0);
                              }
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
      </div>
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
              Czy na pewno chcesz usunąć klienta
              {clientToDelete.name ? (
                <>
                  {" "}
                  <span className="font-semibold">{clientToDelete.name}</span>?
                </>
              ) : (
                "?"
              )}
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
    </section>
  );
};

export default AdminClientManager;
