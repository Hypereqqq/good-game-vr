import React, { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { addReservationAtom } from "../store/store";
import { reservationsAtom } from "../store/store";
import { v4 as uuidv4 } from "uuid";

const Reservation: React.FC = () => {
  const [people, setPeople] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [service, setService] = useState("Stanowisko VR");
  const [duration, setDuration] = useState(
    "30 min - 39 zł za osobę (Pon. - Czw.) | 45 zł za osobę (Pt. - Niedz.)"
  );
  const [step, setStep] = useState<"form" | "summary" | "confirmation">("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+48");
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
  });

  const addReservation = useSetAtom(addReservationAtom);
  const reservations = useAtomValue(reservationsAtom);

  useEffect(() => {
    console.log("Aktualne rezerwacje:", reservations);
  }, [reservations]);

  useEffect(() => {
    if (service === "Symulator VR - 1 osoba") {
      setPeople(1); // pokazujemy 1
      setDuration("15");
    } else if (service === "Symulator VR - 2 osoby") {
      setPeople(2);
      setDuration("15");
    } else {
      // domyślna wartość dla Stanowiska VR
      setDuration("30");
    }
  }, [service]);

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const lastDayPrevMonth = getDaysInMonth(year, month - 1);

    const calendarDays = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push({ day: lastDayPrevMonth - i, isPrevMonth: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({ day: i, isPrevMonth: false });
    }
    return calendarDays;
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (month === 0) {
        setMonth(11);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    } else {
      if (month === 11) {
        setMonth(0);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    }
    setSelectedHour(null);
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setService(selected);
    if (selected === "Stanowisko VR") setPeople(1);
    if (selected === "Symulator VR - 1 osoba") setPeople(1);
    if (selected === "Symulator VR - 2 osoby") setPeople(2);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedHour(null);
  };

  const isPastHour = (hour: string) => {
    if (!selectedDate) return false;

    const [day, monthNum, yearNum] = selectedDate.split("-").map(Number);

    const now = new Date();
    const nowDateOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const selectedDateOnly = new Date(yearNum, monthNum - 1, day);

    if (selectedDateOnly < nowDateOnly) return true;

    if (selectedDateOnly.getTime() === nowDateOnly.getTime()) {
      const [hourPart, minutePart] = hour.split(":").map(Number);
      const selectedHourTime = new Date(
        yearNum,
        monthNum - 1,
        day,
        hourPart,
        minutePart
      );

      return selectedHourTime <= now;
    }

    return false;
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateSummary = () => {
    return (
      firstName.trim() !== "" && lastName.trim() !== "" && validateEmail(email)
    );
  };

  const handleReservation = () => {
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    const peopleToStore = service === "Symulator VR - 1 osoba" ? 2 : people;
    if (validateSummary()) {
      const newReservation = {
        id: uuidv4(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: `${countryCode}${phone.trim()}`,
        createdAt: new Date().toISOString(),
        reservationDate: `${selectedDate}T${selectedHour}`,
        service: service as
          | "Stanowisko VR"
          | "Symulator VR - 1 osoba"
          | "Symulator VR - 2 osoby",
        people: peopleToStore,
        duration: parseInt(duration),
      };

      addReservation(newReservation);
      alert("Rezerwacja została dodana!");
      setStep("confirmation");
    }
  };

  const resetForm = () => {
    setPeople(1);
    setSelectedDate(null);
    setSelectedHour(null);
    setMonth(new Date().getMonth());
    setYear(new Date().getFullYear());
    setService("Stanowisko VR");
    setDuration(
      "30 min - 39 zł za osobę (Pon. - Czw.) | 45 zł za osobę (Pt. - Niedz.)"
    );
    setStep("form");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCountryCode("+48");
    setTouched({
      firstName: false,
      lastName: false,
      email: false,
      phone: false,
    });
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];

  const generateHourSlots = () => {
    const isSimulator =
      service === "Symulator VR - 1 osoba" ||
      service === "Symulator VR - 2 osoby";
    const step = isSimulator ? 15 : 30;

    const slots: string[] = [];
    const start = 9 * 60; // zawsze od 09:00
    const end = isSimulator ? 20 * 60 + 45 : 20 * 60 + 30;

    for (let time = start; time <= end; time += step) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      slots.push(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      );
    }

    return slots;
  };

  const getDayOfWeek = (dateString: string | null) => {
    if (!dateString) return null;
    const [day, monthNum, yearNum] = dateString.split("-").map(Number);
    const date = new Date(yearNum, monthNum - 1, day);
    return date.getDay();
  };

  const isHourAvailable = (hour: string) => {
    if (!selectedDate) return false;

    const [h, m] = hour.split(":").map(Number);
    const now = new Date();
    const [dayD, monthD, yearD] = selectedDate.split("-").map(Number);
    const selected = new Date(yearD, monthD - 1, dayD, h, m);
    const isSunday = getDayOfWeek(selectedDate) === 0;

    const serviceIsSimulator = service.includes("Symulator");
    const startHour = isSunday ? 10 * 60 : 9 * 60;
    const endHour = isSunday
      ? serviceIsSimulator
        ? 19 * 60 + 45 // 19:45
        : 19 * 60 + 30 // 19:30
      : serviceIsSimulator
      ? 20 * 60 + 45 // 20:45
      : 20 * 60 + 30; // 20:30

    const currentTimeMinutes = h * 60 + m;

    // ograniczenie dnia + godziny + przeszłość
    return (
      currentTimeMinutes >= startHour &&
      currentTimeMinutes <= endHour &&
      selected >= now
    );
  };

  return (
    <section className="bg-[#0f1525] text-white px-6 py-16">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-1/2 bg-[#1e2636] p-8 rounded-lg shadow-lg">
          {step === "form" ? (
            <form className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold text-[#00d9ff] mb-4 text-center uppercase">
                Zarezerwuj termin
              </h1>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Wybierz usługę<span className="text-red-500"> *</span>
                </label>
                <select
                  className="w-full p-3 rounded bg-[#0f1525] border border-gray-600 text-white"
                  value={service}
                  onChange={handleServiceChange}
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
                    className="w-full p-3 rounded bg-[#0f1525] border border-gray-600 text-white"
                  >
                    <option value="30">
                      30 min - 39 zł za osobę (Pon. - Czw.) | 45 zł za osobę
                      (Pt. - Niedz.)
                    </option>
                    <option value="60">
                      60 min - 78 zł za osobę (Pon. - Czw.) | 90 zł za osobę
                      (Pt. - Niedz.)
                    </option>
                    <option value="90">
                      90 min - 117 zł za osobę (Pon. - Czw.) | 135 zł za osobę
                      (Pt. - Niedz.)
                    </option>
                    <option value="120">
                      120 min - 156 zł za osobę (Pon. - Czw.) | 180 zł za osobę
                      (Pt. - Niedz.)
                    </option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="15 min"
                    className="w-full p-3 rounded bg-[#1a1a1a] border border-gray-600 text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Liczba osób<span className="text-red-500"> *</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPeople((prev) => {
                        if (service === "Symulator VR - 1 osoba") return 1;
                        if (service === "Symulator VR - 2 osoby") return 2;
                        return Math.max(1, prev - 1);
                      })
                    }
                    className="bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-2 py-1 rounded text-xs hover:bg-[#1a1a1a]"
                  >
                    –
                  </button>
                  <span className="text-lg">{people}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPeople((prev) => {
                        if (service === "Symulator VR - 1 osoba") return 1;
                        if (service === "Symulator VR - 2 osoby") return 2;
                        return Math.min(8, prev + 1);
                      })
                    }
                    className="bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-2 py-1 rounded text-xs hover:bg-[#1a1a1a]"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {service === "Stanowisko VR" &&
                    "Preferowana liczba osób: 1 - 8"}
                  {service === "Symulator VR - 1 osoba" &&
                    "Preferowana liczba osób: 1"}
                  {service === "Symulator VR - 2 osoby" &&
                    "Preferowana liczba osób: 2"}
                </p>
              </div>

              <h2 className="text-xl font-semibold text-white mt-6 mb-2">
                Termin
              </h2>

              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => handleMonthChange("prev")}
                  className="bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-3 py-1 rounded hover:bg-[#1a1a1a]"
                >
                  &#8592;
                </button>
                <span className="text-white font-bold text-lg">
                  {monthNames[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={() => handleMonthChange("next")}
                  className="bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-3 py-1 rounded hover:bg-[#1a1a1a]"
                >
                  &#8594;
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-sm text-[#d1d5db] font-semibold mb-2">
                <div>Pn.</div>
                <div>Wt.</div>
                <div>Śr.</div>
                <div>Cz.</div>
                <div>Pt.</div>
                <div>So.</div>
                <div>Nd.</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((dayObj, index) => (
                  <div
                    key={index}
                    onClick={() =>
                      handleDateSelect(`${dayObj.day}-${month + 1}-${year}`)
                    }
                    className={`p-2 text-center rounded cursor-pointer transition text-sm font-medium
                    ${
                      dayObj.isPrevMonth
                        ? "bg-[#1a1a1a] text-gray-600"
                        : selectedDate === `${dayObj.day}-${month + 1}-${year}`
                        ? "bg-[#00d9ff] text-black"
                        : "bg-[#0f1525] border border-gray-600 text-white hover:bg-[#00d9ff] hover:text-black"
                    }`}
                  >
                    {dayObj.day}
                  </div>
                ))}
              </div>

              <h2 className="text-xl font-semibold text-white mt-6 mb-2">
                Wybierz godzinę
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {generateHourSlots().map((hour) => {
                  const isAvailable = selectedDate
                    ? isHourAvailable(hour) && !isPastHour(hour)
                    : false;
                  const isSelected = selectedHour === hour;
                  return (
                    <div
                      key={hour}
                      onClick={() => isAvailable && setSelectedHour(hour)}
                      className={`p-2 text-center rounded cursor-pointer text-sm font-medium transition
                      ${
                        !isAvailable
                          ? "bg-[#1a1a1a] text-gray-600"
                          : isSelected
                          ? "bg-[#00d9ff] text-black"
                          : "bg-[#0f1525] border border-gray-600 text-white hover:bg-[#00d9ff] hover:text-black"
                      }`}
                    >
                      {hour}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setStep("summary")}
                disabled={!selectedDate || !selectedHour}
                className={`w-full mt-10 font-bold py-3 rounded transition duration-300 uppercase ${
                  selectedDate && selectedHour
                    ? "bg-[#00d9ff] hover:bg-[#ffcc00] text-black"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                Przejdź do podsumowania
              </button>
            </form>
          ) : step === "summary" ? (
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-[#00d9ff] text-center">
                Twoje zamówienie
              </h2>
              <div className="bg-[#0f1525] p-4 rounded border border-gray-600">
                <p>
                  <span className="text-[#00d9ff] font-semibold">Termin:</span>{" "}
                  {selectedDate} o godzinie {selectedHour}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Usługa:</span>{" "}
                  {service}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">
                    Czas trwania:
                  </span>{" "}
                  {duration}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">
                    Liczba osób:
                  </span>{" "}
                  {people}
                </p>
              </div>

              <h2 className="text-xl font-semibold text-white mt-4">
                Twoje dane
              </h2>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">
                    Imię <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Jan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`w-full p-3 rounded bg-[#0f1525] border ${
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
                    className={`w-full p-3 rounded bg-[#0f1525] border ${
                      touched.lastName && !lastName
                        ? "border-red-500"
                        : "border-gray-600"
                    } text-white`}
                  />
                </div>
              </div>
              <label className="text-sm font-semibold mb-1 mt-2">
                Adres email<span className="text-red-500"> *</span>
              </label>
              <input
                type="email"
                placeholder="Adres email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                className={`w-full p-3 rounded bg-[#0f1525] border ${
                  touched.email && !validateEmail(email)
                    ? "border-red-500"
                    : "border-gray-600"
                } text-white`}
              />
              {touched.email && !validateEmail(email) && (
                <p className="text-red-500 text-sm">
                  Wprowadź poprawny adres email
                </p>
              )}
              <label className="text-sm font-semibold mb-1 mt-2">
                Numer telefonu<span className="text-red-500"> *</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="p-3 rounded bg-[#0f1525] border border-gray-600 text-white w-28"
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
                  onBlur={() => setTouched({ ...touched, phone: true })}
                  className={`flex-1 p-3 rounded bg-[#0f1525] border ${
                    touched.phone && !phone
                      ? "border-red-500"
                      : "border-gray-600"
                  } text-white`}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">* - pole wymagane</p>

              <div className="flex gap-4 mt-4 items-center">
                <div className="w-1/5">
                  <button
                    onClick={() => setStep("form")}
                    className="w-full bg-[#0f1525] border border-[#00d9ff] text-[#00d9ff] px-3 py-2 rounded text-sm hover:bg-[#1a1a1a] transition"
                  >
                    Wróć
                  </button>
                </div>
                <div className="w-2/5"></div>
                <div className="w-2/5">
                  <button
                    onClick={handleReservation}
                    className="w-full bg-[#00d9ff] hover:bg-[#ffcc00] text-black font-bold py-2 rounded transition duration-300"
                  >
                    Zarezerwuj
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-[#00d9ff] text-center">
                Dziękujemy za rezerwację!
              </h2>

              <div className="bg-[#0f1525] p-4 rounded border border-gray-600 text-sm">
                <p>
                  <span className="text-[#00d9ff] font-semibold">Termin:</span>{" "}
                  {selectedDate} o {selectedHour}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Usługa:</span>{" "}
                  {service}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">
                    Czas trwania:
                  </span>{" "}
                  {duration} minut
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">
                    Liczba osób:
                  </span>{" "}
                  {people}
                </p>
                <hr className="my-2 border-gray-600" />
                <p>
                  <span className="text-[#00d9ff] font-semibold">
                    Imię i nazwisko:
                  </span>{" "}
                  {firstName} {lastName}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Telefon:</span>{" "}
                  {countryCode} {phone}
                </p>
                <p>
                  <span className="text-[#00d9ff] font-semibold">Email:</span>{" "}
                  {email}
                </p>
              </div>

              <p className="text-sm text-gray-400 mt-2">
                W razie jakichkolwiek pytań prosimy o kontakt: <br />
                tel.{" "}
                <span className="text-white font-semibold">
                  +48 664 133 082
                </span>{" "}
                <br />
                e-mail:{" "}
                <span className="text-white font-semibold">
                  salon@goodgamevr.pl
                </span>
              </p>

              <button
                onClick={resetForm}
                className="w-full bg-[#00d9ff] hover:bg-[#ffcc00] text-black font-bold py-3 rounded transition duration-300 uppercase mt-4"
              >
                Wróć do rezerwacji
              </button>
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/2 flex flex-col gap-5 lg:gap-10">
          <div className="bg-[#1e2636] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-[#ff9900] mb-2">Oferta:</h3>
            <p className="mb-2">
              <span className="text-[#00d9ff] font-bold">Stanowisko VR</span> –
              gry w wirtualnej rzeczywistości z wykorzystaniem gogli VR i
              kontrolerów. Zagraj w takie tytuły jak Serious Sam, Elven
              Assassin, Beat Saber i wiele innych.
            </p>
            <p>
              <span className="text-[#00d9ff] font-bold">Symulator VR</span> –
              oglądanie filmów w wirtualnej rzeczywistości na ruchomych fotelach
              z wiejącym na nas wiatrem. Wsiądź do górskiej kolejki z wesołego
              miasteczka, przemierzaj galaktykę statkiem kosmicznym lub oglądaj
              dinozaury z bliska. To tylko część dostępnych opcji!
            </p>
          </div>

          <div className="bg-[#1e2636] p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-[#ff9900] mb-2">Cennik:</h3>
            <div className="mt-2">
              <p className="font-bold text-[#00d9ff]">
                Stanowisko VR – 1 stanowisko:
              </p>
              <ul className="list-disc list-inside text-sm ml-4 mt-1">
                <li>
                  <span className="font-medium text-white">
                    Poniedziałek – Czwartek:
                  </span>{" "}
                  30 min – <span className=" font-bold">39 zł / osoba</span>
                </li>
                <li>
                  <span className="font-medium text-white">
                    Piątek – Niedziela:
                  </span>{" "}
                  30 min – <span className=" font-bold">45 zł / osoba</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <p className="font-bold text-[#00d9ff]">
                Symulator VR – 1 osoba:
              </p>
              <ul className="list-disc list-inside text-sm ml-4 mt-1">
                <li>
                  Pierwszy przejazd – <span className=" font-bold">20 zł</span>
                </li>
                <li>
                  Drugi przejazd – <span className=" font-bold">10 zł</span>
                </li>
                <li>
                  Trzeci przejazd –{" "}
                  <span className="text-green-400 font-bold">GRATIS</span>
                </li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="font-bold text-[#00d9ff]">
                Symulator VR – 2 osoby:
              </p>
              <ul className="list-disc list-inside text-sm ml-4 mt-1">
                <li>
                  Pierwszy przejazd – <span className=" font-bold">30 zł</span>
                </li>
                <li>
                  Drugi przejazd – <span className=" font-bold">20 zł</span>
                </li>
                <li>
                  Trzeci przejazd –{" "}
                  <span className="text-green-400 font-bold">GRATIS</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reservation;

// TO DO:
// - sprawdzenie dostępności terminu (czy nie jest już zajęty)
// poprawienie strony glownej
