import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import jsPDF from "jspdf";
import { Download } from "lucide-react";

const VOUCHER_WIDTH = 2000;
const VOUCHER_HEIGHT = 2000;

import voucherBg from "../assets/VOUCHER/voucherGGVR.png";

const durationOptions = [
  { value: 30, label: "30 MIN" },
  { value: 60, label: "60 MIN" },
  { value: 90, label: "90 MIN" },
  { value: 120, label: "120 MIN" },
];

const playersOptions = Array.from({ length: 8 }, (_, i) => i + 1);

// Dla dodatkowych informacji
const infoPlayersOptions = [
  { value: "", label: "Wybierz ilość osób" },
  { value: 1, label: "1 osoba" },
  { value: 2, label: "2 osoby" },
];
const ridesOptions = [
  { value: "", label: "Wybierz ilość przejazdów" },
  { value: 1, label: "1 przejazd 5D" },
  { value: 2, label: "2 przejazdy 5D" },
  { value: 3, label: "3 przejazdy 5D" },
  { value: 4, label: "4 przejazdy 5D" },
  { value: 5, label: "5 przejazdów 5D" },
];

const AdminVoucher: React.FC = () => {
  const stageRef = useRef<any>(null);

  const [name, setName] = useState("");
  const [players, setPlayers] = useState(1);
  const [duration, setDuration] = useState(30);
  const [code, setCode] = useState("");
  const [timeText, setTimeText] = useState(""); // pole tekstowe tylko na czas gry
  const [timeEdited, setTimeEdited] = useState(false);

  // Dodatkowe informacje
  const [info, setInfo] = useState(""); // pole tekstowe tylko na dodatkowe info
  const [infoPlayers, setInfoPlayers] = useState(""); // "" = brak wyboru
  const [rides, setRides] = useState(""); // "" = brak wyboru
  const [infoEdited, setInfoEdited] = useState(false);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  // Ładowanie obrazu tła
  useEffect(() => {
    const img = new window.Image();
    img.src = voucherBg;
    img.onload = () => setBgImage(img);
  }, []);

  useEffect(() => {
    const font = new FontFace(
      "Tektur",
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100..700&family=Tektur:wght@400..900&display=swap"
    );
    font.load().then(function (loadedFont) {
      document.fonts.add(loadedFont);
    });
  }, []);

  // Automatyczna aktualizacja pola czas gry, jeśli nie było ręcznie edytowane
  useEffect(() => {
    if (!timeEdited) {
      const durationLabel =
        durationOptions.find((opt) => opt.value === duration)?.label || "";
      const autoText =
        players === 1 ? `${durationLabel}` : `${players} x ${durationLabel}`;
      setTimeText(autoText);
    }
  }, [players, duration]);

  // Automatyczna aktualizacja pola dodatkowych informacji, jeśli nie było ręcznie edytowane
  useEffect(() => {
    if (!infoEdited) {
      let autoInfo = "";
      if (infoPlayers && rides) {
        if (infoPlayers === "1") {
          autoInfo =
            ridesOptions.find((opt) => String(opt.value) === rides)?.label ||
            "";
        } else if (infoPlayers === "2") {
          const rideLabel =
            ridesOptions.find((opt) => String(opt.value) === rides)?.label ||
            "";
          const [przejazdy] = rideLabel.split(" 5D");
          autoInfo = `2 x ${przejazdy.trim()} 5D`;
        }
      }
      setInfo(autoInfo);
    }
  }, [infoPlayers, rides]);

  // Eksport do PNG
  const handleExportPNG = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 1 });
    const fileName = code ? `${code}_VOUCHER_GGVR.png` : "VOUCHER_GGVR.png";
    const link = document.createElement("a");
    link.download = fileName;
    link.href = uri;
    link.click();
  };

  // Eksport do PDF
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
        {/* LEWA STRONA: Formularz */}
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
          {/* DODATKOWE INFORMACJE */}
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
        {/* PRAWA STRONA: Podgląd vouchera */}
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
