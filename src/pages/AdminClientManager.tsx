import React, { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { clientsAtom } from "../store/clients";
import { v4 as uuidv4 } from "uuid";
import { ClientGame } from "../types/types";
import { DateTime } from "luxon";
import { FaTrash, FaEdit } from "react-icons/fa";

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
  const [, setTick] = useState(0); // tylko do triggerowania re-renderu

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1); // wymusza re-render
    }, 1000); // co 1 sekunda

    return () => clearInterval(interval); // czyszczenie przy unmount
  }, []);

  useEffect(() => {
    // Jeśli edytujemy — nie modyfikujemy slots
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
    const diff = Math.floor(end.diff(now, "minutes").minutes);
    return {
      text: diff > 0 ? `${diff} min` : "Koniec gry",
      minutes: diff,
      isOver: diff <= 0,
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
    const newCount = Math.max(1, Math.min(8, peopleCount + delta));
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
      };
      setClients((prev) => [...prev, newClient]);
    }

    resetForm();
  };

  const handleDeleteClient = (id: string) => {
    const confirmDelete = window.confirm(
      "Czy na pewno chcesz usunąć tego klienta?"
    );
    if (confirmDelete) {
      setClients((prev) => prev.filter((client) => client.id !== id));
    }
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
                disabled={peopleCount >= 8}
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
                    min={0}
                    max={23}
                    value={customHour}
                    onChange={(e) => setCustomHour(Number(e.target.value))}
                    className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm mb-1">Minuty:</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={customMinute}
                    onChange={(e) => setCustomMinute(Number(e.target.value))}
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
                          onClick={() =>
                            handleDeleteClient(clientsInSlot[0].id)
                          }
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

          <div className="overflow-x-auto mt-10">
            <table className="w-full table-auto text-sm bg-[#1e2636] rounded-lg shadow-md">
              <thead>
                <tr className="text-left border-b border-gray-600 text-[#00d9ff]">
                  <th className="p-3">Nazwa</th>
                  <th className="p-3">Liczba graczy</th>
                  <th className="p-3">Stanowiska</th>
                  <th className="p-3">Czas</th>
                  <th className="p-3">Start</th>
                  <th className="p-3">Koniec</th>
                  <th className="p-3">Pozostało</th>
                  <th className="p-3">Płatność</th>
                  <th className="p-3">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
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
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => handleEditClient(client)}
                          className={`text-gray-500 hover:text-yellow-500 ${
                            isEditing ? "animate-blink-slow text-yellow-500" : ""
                          }`}
                          title="Edytuj"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className=" text-gray-500 hover:text-red-600"
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
    </section>
  );
};

export default AdminClientManager;
