// Admin panel for managing reservations, clients, and updates in a VR gaming center.
// It includes real-time updates, statistics, and a detailed log of changes.

// Import necessary libraries and components
import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import jsPDF from "jspdf";
import { Download } from "lucide-react";

const VOUCHER_WIDTH = 2000; // Size of the voucher in pixels
const VOUCHER_HEIGHT = 2000; // Size of the voucher in pixels

import voucherBg from "../assets/VOUCHER/voucherGGVR.png";

// Options for duration and players
const durationOptions = [
  { value: 30, label: "30 MIN" },
  { value: 60, label: "60 MIN" },
  { value: 90, label: "90 MIN" },
  { value: 120, label: "120 MIN" },
];

// Options for number of players (1 to 8)
const playersOptions = Array.from({ length: 8 }, (_, i) => i + 1);

// Options for additional information about players and rides
const infoPlayersOptions = [
  { value: "", label: "Wybierz ilość osób" },
  { value: 1, label: "1 osoba" },
  { value: 2, label: "2 osoby" },
];

// Options for number of rides (1 to 5)
const ridesOptions = [
  { value: "", label: "Wybierz ilość przejazdów" },
  { value: 1, label: "1 przejazd 5D" },
  { value: 2, label: "2 przejazdy 5D" },
  { value: 3, label: "3 przejazdy 5D" },
  { value: 4, label: "4 przejazdy 5D" },
  { value: 5, label: "5 przejazdów 5D" },
];

// AdminVoucher component for generating and previewing vouchers
// It allows users to input voucher details and export it as PNG or PDF
const AdminVoucher: React.FC = () => {
  const stageRef = useRef<any>(null); // Reference to the Konva stage for exporting

  const [name, setName] = useState(""); // State for user's name input
  const [players, setPlayers] = useState(1); // State for number of players, default is 1
  const [duration, setDuration] = useState(30); // State for game duration, default is 30 minutes
  const [code, setCode] = useState(""); // State for voucher code input
  const [timeText, setTimeText] = useState(""); // State for displaying the time text on the voucher
  const [timeEdited, setTimeEdited] = useState(false); // Flag to check if time text was manually edited

  // Dodatkowe informacje
  const [info, setInfo] = useState(""); // State for additional information input
  const [infoPlayers, setInfoPlayers] = useState(""); // "" = no choice
  const [rides, setRides] = useState(""); //  "" = no choice
  const [infoEdited, setInfoEdited] = useState(false); // Flag to check if additional info was manually edited

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null); // State for background image

  // Load the voucher background image when the component mounts
  useEffect(() => {
    const img = new window.Image();
    img.src = voucherBg;
    img.onload = () => setBgImage(img);
  }, []);

  // Load custom font for the voucher
  useEffect(() => {
    const font = new FontFace(
      "Tektur",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100..700&family=Tektur:wght@400..900&display=swap"
    );
    font.load().then(function (loadedFont) {
      document.fonts.add(loadedFont);
    });
  }, []);

  // Automatic update of time text if not manually edited
  // It generates a default text based on the number of players and duration
  useEffect(() => {
    if (!timeEdited) {
      const durationLabel =
        durationOptions.find((opt) => opt.value === duration)?.label || "";
      const autoText =
        players === 1 ? `${durationLabel}` : `${players} x ${durationLabel}`;
      setTimeText(autoText);
    }
  }, [players, duration]);

  // Atomic update of additional info if not manually edited
  // It generates a default text based on the number of players and rides
  useEffect(() => {
    if (!infoEdited) {
      let autoInfo = "";
      if (infoPlayers && rides) {
        if (infoPlayers === "1") {
          const rideLabel =
            ridesOptions.find((opt) => String(opt.value) === rides)?.label ||
            "";
          const [przejazdy] = rideLabel.split(" 5D");
          autoInfo = `1 os. | ${przejazdy.trim()} 5D`;
        } else if (infoPlayers === "2") {
          const rideLabel =
            ridesOptions.find((opt) => String(opt.value) === rides)?.label ||
            "";
          const [przejazdy] = rideLabel.split(" 5D");
          autoInfo = `2 os. | ${przejazdy.trim()} 5D`;
        }
      }
      setInfo(autoInfo);
    }
  }, [infoPlayers, rides]);

  // Export to PNG
  const handleExportPNG = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 1 });
    const fileName = code ? `${code}_VOUCHER_GGVR.png` : "VOUCHER_GGVR.png";
    const link = document.createElement("a");
    link.download = fileName;
    link.href = uri;
    link.click();
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 1 });
    const fileName = code ? `${code}_VOUCHER_GGVR.pdf` : "VOUCHER_GGVR.pdf";
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [VOUCHER_WIDTH, VOUCHER_HEIGHT],
    });
    pdf.addImage(uri, "PNG", 0, 0, VOUCHER_WIDTH, VOUCHER_HEIGHT);
    pdf.save(fileName);
  };

  return (
    <section className="bg-[#0f1525] text-white px-6 py-10 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* LEFT SIDE: FORM */}
        <div className="w-full md:w-1/3 bg-[#1e2636] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-[#00d9ff] mb-4 uppercase">
            Generuj voucher
          </h2>
          <div className="mb-4">
            <label className="block text-sm mb-1">Imię i nazwisko:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              placeholder="Wpisz imię i nazwisko"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Czas gry:</label>
            <input
              type="text"
              value={timeText}
              onChange={(e) => {
                setTimeText(e.target.value);
                setTimeEdited(true);
              }}
              onFocus={() => setTimeEdited(true)}
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              placeholder="Np. 2 x 60 MIN lub własny tekst"
            />
          </div>
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Ilość graczy:</label>
              <select
                value={players}
                onChange={(e) => {
                  setPlayers(Number(e.target.value));
                  setTimeEdited(false);
                }}
                className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              >
                {playersOptions.map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">Czas gry:</label>
              <select
                value={duration}
                onChange={(e) => {
                  setDuration(Number(e.target.value));
                  setTimeEdited(false);
                }}
                className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Kod vouchera:</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              placeholder="Wklej kod"
            />
          </div>
          {/* ADDITIONAL INFORMATION */}
          <div className="mb-4">
            <label className="block text-sm mb-1">Dodatkowe informacje:</label>
            <input
              type="text"
              value={info}
              onChange={(e) => {
                setInfo(e.target.value);
                setInfoEdited(true);
              }}
              onFocus={() => setInfoEdited(true)}
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              placeholder="Np. 2 x 3 przejazdy 5D lub własny tekst"
            />
          </div>
          <div className="mb-6 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Ilość osób:</label>
              <select
                value={infoPlayers}
                onChange={(e) => {
                  setInfoPlayers(e.target.value);
                  setInfoEdited(false);
                }}
                className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              >
                {infoPlayersOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1">Ilość przejazdów:</label>
              <select
                value={rides}
                onChange={(e) => {
                  setRides(e.target.value);
                  setInfoEdited(false);
                }}
                className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              >
                {ridesOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 w-full">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-5 py-2 bg-[#00d9ff] hover:bg-[#ffcc00] text-black font-bold rounded transition w-full justify-center"
            >
              <Download className="w-5 h-5" />
              PDF
            </button>
            <button
              onClick={handleExportPNG}
              className="flex items-center gap-2 px-5 py-2 bg-[#00d9ff] hover:bg-[#ffcc00] text-black font-bold rounded transition w-full justify-center"
            >
              <Download className="w-5 h-5" />
              PNG
            </button>
          </div>
        </div>
        {/* RIGHT SIDE: VOUCHER PREVIEW */}
        <div className="w-full md:w-2/3 flex flex-col items-center gap-6">
          <div
            className="flex justify-center items-center bg-transparent p-0 w-full"
            style={{
              background: "none",
              boxShadow: "none",
              padding: 0,
              margin: 0,
              width: "100%",
              overflowX: "auto",
              overflowY: "visible",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 700,
                aspectRatio: "1 / 1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minWidth: 320,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  transform: `scale(${700 / VOUCHER_WIDTH})`,
                  transformOrigin: "top left",
                  ...(window.innerWidth < 768
                    ? {
                        transform: "none",
                        width: VOUCHER_WIDTH,
                        height: VOUCHER_HEIGHT,
                        minWidth: VOUCHER_WIDTH,
                        minHeight: VOUCHER_HEIGHT,
                      }
                    : {}),
                }}
              >
                <Stage
                  width={VOUCHER_WIDTH}
                  height={VOUCHER_HEIGHT}
                  ref={stageRef}
                  className="bg-transparent rounded"
                  style={{
                    width: VOUCHER_WIDTH,
                    height: VOUCHER_HEIGHT,
                    background: "none",
                    pointerEvents: "none",
                  }}
                >
                  <Layer>
                    {bgImage && (
                      <KonvaImage
                        image={bgImage}
                        x={0}
                        y={0}
                        width={VOUCHER_WIDTH}
                        height={VOUCHER_HEIGHT}
                      />
                    )}
                    {name && (
                      <Text
                        text={name}
                        x={525}
                        y={1075}
                        width={VOUCHER_WIDTH}
                        align="center"
                        fontSize={35}
                        fill="#000000"
                        fontStyle="bold"
                        fontFamily="Tektur"
                      />
                    )}
                    {timeText && (
                      <Text
                        text={timeText}
                        x={525}
                        y={1193}
                        width={VOUCHER_WIDTH}
                        align="center"
                        fontSize={35}
                        fill="#000000"
                        fontStyle="bold"
                        fontFamily="Tektur"
                      />
                    )}
                    {code && (
                      <Text
                        text={code}
                        x={525}
                        y={1312}
                        width={VOUCHER_WIDTH}
                        align="center"
                        fontSize={35}
                        fill="#000000"
                        fontStyle="bold"
                        fontFamily="Tektur"
                      />
                    )}
                    {info && (
                      <Text
                        text={info}
                        x={1340}
                        y={1430}
                        width={375}
                        align="center"
                        fontSize={35}
                        fill="#000000"
                        fontStyle="bold"
                        fontFamily="Tektur"
                      />
                    )}
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminVoucher;
