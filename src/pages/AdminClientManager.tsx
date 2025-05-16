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
  const [, setTick] = useState(0); // tylko do triggerowania re-renderu
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientGame | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const [, setOriginalClients] = useState<ClientGame[]>([]);

  useEffect(() => {
    setOriginalClients(clients);
  }, [clients]);

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
    if (customStartEnabled) {
      const now = DateTime.now(); // Używamy UTC zamiast lokalnego czasu
      setCustomHour(now.hour); // Ustawiamy godzinę na bieżącą w UTC
      setCustomMinute(now.minute); // Ustawiamy minutę na bieżącą w UTC
    }
  }, [customStartEnabled]);

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

    const diffMinutes = Math.floor(diffSeconds / 60);

    return {
      text: diffMinutes > 0 ? `${diffMinutes} min` : "mniej niż minutę",
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
      alert("Wszystkie stanowiska muszą być unikalne!");
      return;
    }

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
                className="px-2 py-1 bg-[#00d9ff] text-black font-bold rounded disabled:opacity-50"
                disabled={peopleCount <= 1}
              >
                -
              </button>
              <span>{peopleCount}</span>
              <button
                onClick={() => handlePeopleChange(1)}
                className="px-2 py-1 bg-[#00d9ff] text-black font-bold rounded disabled:opacity-50"
                disabled={peopleCount >= 8 || allStationsTaken}
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
                }}
                className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
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

          <div className="mb-4">
            <label className="block mb-1 text-sm">Czas gry (minuty):</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm mb-2">
              <input
                type="checkbox"
                checked={customStartEnabled}
                onChange={() => setCustomStartEnabled(!customStartEnabled)}
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
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded"
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
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded"
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

        {/* PRAWA STRONA: Kafelki stanowisk */}
        <div className="w-full md:w-2/3 px-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => {
              const slotIndex = index + 1;
              const clientsInSlot = clients.filter((client) =>
                client.stations.includes(slotIndex)
              );

              return (
                <div
                  key={index}
                  className="bg-[#1e2636] rounded-lg p-4 shadow-md flex flex-col h-50 break-words"
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
                              clientsInSlot[0].comment
                                ? ""
                                : "Dodaj komentarz"
                            }
                          >
                            <FaCommentDots />
                          </button>
                          {clientsInSlot[0].comment && (
                            <span className="absolute left-7 top-1/2 -translate-y-1/2 bg-[#222] text-white px-3 py-1 rounded z-10 text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-pre-line min-w-[180px] max-w-[400px] transition-opacity duration-200">
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
                      const isEditing = editId === client.id;
                      return (
                        <div
                          key={i}
                          className={`text-sm text-blue-300 mb-2 ${
                            isEditing ? "bg-[#2a354a] rounded " : ""
                          }`}
                        >
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
                            title={
                              client.comment
                                ? ""
                                : "Dodaj komentarz"
                            }
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
