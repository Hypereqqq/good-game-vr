import React, { useState } from "react";

import el from "../assets/gry/el.jpg";
import bs from "../assets/gry/bs.jpg";
import pa from "../assets/gry/pa.jpg";
import ar from "../assets/gry/ar.jpg";
import pri from "../assets/gry/pri.jpg";
import spi from "../assets/gry/spi.jpg";
import spo from "../assets/gry/spo.jpg";
import ss from "../assets/gry/ss.jpg";
import su from "../assets/gry/su.jpg";
import gt from "../assets/gry/gt.jpg";
import pw from "../assets/gry/pw.jpg";
import ww from "../assets/gry/ww.png";

const gameData = [
  {
    id: "elven-assassin",
    title: "Elven Assassin",
    img: el,
    yt: "_nPI1W248TY",
    desc:
      "Gracze wcielają się w łuczników i bronią swojej twierdzy przed najazdem orków i smoków. Fale wrogów stają się większe oraz trudniejsze z każdą turą. Oprócz zwykłych strzał, gracze mają do dyspozycji umiejętności specjalne. Dostępny jest również tryb PvP (gracz vs gracz).",
    players: "1-8",
    modes: "kooperacja / rywalizacja",
  },
  {
    id: "serious-sam",
    title: "Serious Sam",
    img: ss,
    yt: "3-Qgx70_P8E",
    desc:
      "Ta gra jest klasyką strzelanek pierwszoosobowych, w której gracz, dysponując dużym arsenałem wszelkiego typu broni, musi stawić czoła falom kosmitów, pająków, robotów i szkieletów. Dostępny jest również tryb kooperacji dla dwóch graczy, gdzie walczycie ramię w ramię.",
    players: "1-2",
    modes: "kooperacja",
  },
  {
    id: "beat-saber",
    title: "Beat Saber",
    img: bs,
    yt: "pa4vrynwkwY",
    desc:
      "Niesamowicie popularna gra rytmiczna na VR, w której w rytm muzyki przecinamy lecące w naszym kierunku kwadraty. Brzmi banalnie, jednak w połączeniu z najpopularniejszymi hitami muzycznymi potrafi zapewnić niesamowitą frajdę, wciągając na długie godziny.",
    players: "1-4",
    modes: "konkurencja",
  },
  {
    id: "gorilla-tag",
    title: "Gorilla Tag",
    img: gt,
    yt: "ivwQ2DUjcHI",
    desc:
      "Jest to dynamiczna gra, w której gracze wcielają się w goryle. Poruszanie odbywa się za pomocą rąk, co dodaje rozgrywce realizmu i sprawia, że każda rozgrywka jest pełna wyzwań. Gra oferuje tryby rywalizacji i współpracy, zapewniając rozrywkę dla graczy w różnym wieku.",
    players: "1-8",
    modes: "kooperacja / rywalizacja",
  },
  {
    id: "waltz-wizard",
    title: "Waltz of the Wizard",
    img: ww,
    yt: "6aGMzvCYfXc",
    desc:
      "To immersyjna gra VR, w której gracze wcielają się w rolę czarodzieja. Rozgrywka polega na eksperymentowaniu z różnymi zaklęciami i przedmiotami, które pozwalają manipulować otoczeniem w zaskakujący sposób. Waltz of the Wizard łączy elementy przygody i łamigłówek.",
    players: "1",
    modes: "eksploracja / przygoda",
  },
  {
    id: "spiderman",
    title: "Spiderman Far From Home VR",
    img: spi,
    yt: "9uiZiNBcc9g",
    desc:
      "To gra osadzona w uniwersum Spider-Mana. Rozgrywka polega na lataniu pomiędzy wieżowcami, używając pajęczych sieci. W grze można spotkać wyzwania w postaci wyścigu oraz walki z robotami najeżdżającymi na miasto. Ubierz strój Spidermana i ruszaj na przygodę. Miasto potrzebuje bohatera!",
    players: "1",
    modes: "eksploracja",
  },
  {
    id: "all-in-one-sports",
    title: "All In One Sports VR",
    img: spo,
    yt: "Lva5G1a0kB0",
    desc:
      "W tej grze możesz spróbować swoich sił w różnych dyscyplinach sportowych, w tym koszykówce, siatkówce, tenisie i wielu innych. Dzięki zaawansowanej technologii VR poczujesz się jak prawdziwy zawodnik, zdobywając punkty i rywalizując z przyjaciółmi online.",
    players: "1-2",
    modes: "rywalizacja",
  },
  {
    id: "superhot",
    title: "Superhot VR",
    img: su,
    yt: "g067s_2L6OU",
    desc:
      "Jest to jednoosobowa gra akcji, w której przejmujesz kontrolę nad czasem i otoczeniem. Wrogowie, pociski i noże ruszają się tylko, kiedy ty się ruszasz, co daje ci czas na planowanie akcji. Pokoje wypełnione przeciwnikami i bronią palną zapewniają zabawę na długie godziny.",
    players: "1",
    modes: "kampania",
  },
  {
    id: "pistol-whip",
    title: "Pistol Whip",
    img: pw,
    yt: "mA75FYv6Nzg",
    desc:
      "To dynamiczna gra akcji w VR, która łączy strzelanie z rytmiczną rozgrywką. Gracze przemierzają kolejne etapy, strzelając do wrogów w takcie muzyki, unikając pocisków i przeszkód. Każdy poziom to wyzwanie pełne adrenaliny, gdzie precyzja i rytm odegrają kluczową rolę.",
    players: "1",
    modes: "rytmiczna / akcja",
  },
  {
    id: "arizona",
    title: "Arizona Sunshine 1 | 2",
    img: ar,
    yt: "9g5HESiBx84",
    desc:
      "Postapokaliptyczny świat opanowany przez zombie czeka na graczy gotowych odkryć jego tajemnice. Ocalali muszą zmierzyć się z armią setek nieumarłych oraz nieprzyjaznym klimatem. Dostępny jest tryb fabularny dla 2 osób oraz tryb hordy (obrona przed falami) dla 4 osób.",
    players: "1-4",
    modes: "kampania (dla 2 graczy) / horda",
  },
  {
    id: "pavlov",
    title: "Pavlov VR",
    img: pa,
    yt: "eSLm7s34g7U",
    desc:
      "Niesamowicie realistyczna strzelanka przypominająca gry typu Counter Strike lub Call of Duty. Tę pozycję wyróżnia zaawansowana mechanika obsługi broni. Dostępne są takie tryby jak Deathmatch zwykły oraz drużynowy, wyścig zbrojeń, tryb bomby, czy obrona przed falami zombie (dla 4 graczy).",
    players: "1-8",
    modes: "kooperacja / rywalizacja",
  },
  {
    id: "private-property",
    title: "Private Property",
    img: pri,
    yt: "Gq0LHRQzWcQ",
    desc:
      "Wcielając się w rolę ostatniego obrońcy swojej posiadłości, gracze muszą stawić czoła niekończącym się falom zombie, które próbują przejąć kontrolę nad ich bazą. Masz do dyspozycji różnorodny arsenał broni, od strzelb po granatnik, które pomogą ci bronić swojego terytorium.",
    players: "1-8",
    modes: "kooperacja / rywalizacja",
  },
];

const Games: React.FC = () => {
  const [viewModes, setViewModes] = useState(
    Object.fromEntries(gameData.map((g) => [g.id, "video"]))
  );

  const toggleView = (id: string) => {
    setViewModes((prev) => ({
      ...prev,
      [id]: prev[id] === "video" ? "image" : "video",
    }));
  };

  return (
    <>
      <h1 className="text-4xl font-bold mt-12 text-center text-[#00d9ff] uppercase mb-12">
        Gry
      </h1>

      {gameData.map((game) => (
        <div
          key={game.id}
          className="max-w-4xl mx-auto mt-10 bg-[#1e2636] text-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-[#00d9ff] mb-4">
                {game.title}
              </h2>
              <button
                onClick={() => toggleView(game.id)}
                className=" text-sm px-3 py-1 mb-3 bg-[#00d9ff] text-black rounded hover:bg-[#ffcc00] transition"
              >
                {viewModes[game.id] === "video"
                  ? "Pokaż zdjęcie"
                  : "Pokaż film"}
              </button>
            </div>

            {viewModes[game.id] === "video" ? (
              <iframe
                className="w-full h-96 rounded mb-4"
                src={`https://www.youtube.com/embed/${game.yt}`}
                title={game.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <img
                className="w-full h-96 object-cover rounded-lg mb-4"
                src={game.img}
                alt={game.title}
              />
            )}

            <p className="text-gray-300 mb-4">{game.desc}</p>
            <div className="flex justify-between items-center">
              <span className="text-[#ffcc00] font-semibold">
                Liczba graczy: {game.players}
              </span>
              <span className="text-[#ffcc00] font-semibold">
                Tryby gry: {game.modes}
              </span>
            </div>
          </div>
        </div>
      ))}

      <div className="max-w-6xl mx-auto mt-10 mb-10 bg-[#1e2636] text-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Powyższa lista przedstawia najbardziej popularne gry. W naszej
            ofercie znajdziecie też dwadzieścia gier z trybem jednoosobowym.
            Jeśli zastanawiasz się czy konkretna gra której chcesz spróbować jet
            dostępna, nie bój się zadzwonić do salonu lub napisać do nas na
            messengerze. Rozgrywka smakuje najlepiej, kiedy możesz dzielić się
            wrażeniami z innymi. Na koniec porównaj swoje wyniki z innymi
            graczami i sprawdź, kto wypadł najlepiej w rywalizacji. Jeżeli
            jednak jesteś samotnym wilkiem, nic nie stoi na przeszkodzie, abyś
            ruszył do akcji w pojedynkę. W salonie Good Game VR znajduje się
            osiem boksów. Z każdego stanowiska może korzystać jedna osoba. Do
            dyspozycji użytkowników oddaliśmy wydajne komputery wyposażone w
            podzespoły najnowszej generacji. Dzięki temu nawet najbardziej
            wymagające gry działają bez zarzutów. Głównym elementem ekwipunku są
            oczywiście gogle HTC Vive, które uchodzą za jedno z najlepszych
            urządzeń w swojej kategorii. Wszystkie wymienione atrakcje są do
            Twojej dyspozycji. Wystarczy tylko skontaktować się z nami i
            zarezerwować dogodny termin. Pamiętaj, że to nie jest zwykła gra
            wideo. Podczas rozgrywki jesteś cały czas w ruchu i można się
            solidnie zmęczyć. W związku z tym polecamy założyć wygodne obuwie,
            aby czuć się swobodnie i komfortowo.
          </p>
          <div className="flex justify-between items-center"></div>
        </div>
      </div>
    </>
  );
};

export default Games;
