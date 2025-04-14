import React from "react";
import { Link } from "react-router-dom";

import bg from "../assets/tlo.png";
import bg2 from "../assets/tlo2.png";
import logo from "../assets/2.png";
import ave from "../assets/ave.png";
import book from "../assets/book.png";
import logoave from "../assets/MATERIAŁY/LOGA/AVENIDA.png"

const videos = [
  { id: "a1", title: "Pavlov", yt: "9uGn-mdzbAo" },
  { id: "a2", title: "Arizona Sunshine 2", yt: "9g5HESiBx84" },
  { id: "a3", title: "Beat Saber", yt: "pa4vrynwkwY" },
  { id: "a4", title: "Elven Assassin", yt: "D94cNMNyMy4" },
  { id: "a5", title: "Private Property", yt: "_QKDmwr4_Vo" },
  { id: "a6", title: "Super Hot", yt: "g067s_2L6OU" },
  { id: "a7", title: "Wizard of The Wizard", yt: "6aGMzvCYfXc" },
  { id: "a8", title: "Superman", yt: "9uiZiNBcc9g" },
];

const Home: React.FC = () => {
  return (
    <>
      {/* SEKCJA 1 */}
      <div
        className="w-full min-h-screen bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="mx-auto px-4 py-16 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="w-full lg:w-1/3" />
          <div className="w-full lg:w-1/3 flex flex-col items-center text-center">
            <img src={logo} alt="Good Game VR Logo" className="w-80 lg:w-100  mb-10" />
            <div className="bg-black/60 px-6 py-6 rounded-xl shadow-lg">
              <p className="text-2xl md:text-3xl font-bold tracking-wider text-white">
                MIEJSCE W KTÓRYM CZAS
              </p>
              <p className="text-2xl md:text-3xl font-bold tracking-wider text-white">
                MA INNY WYMIAR
              </p>
            </div>
          </div>
          <div className="w-full lg:w-1/3 flex justify-center">
            <div className="bg-black/60 text-white px-6 py-5 rounded-xl shadow-lg w-full max-w-sm">
              <img src={ave} alt="Good Game VR" className="w-full mb-2 rounded-lg" />
              <div className="flex flex-row mt-2">
                <div className="">
                <p><span className="font-bold text-[#ffcc00]">Adres:</span> Centrum Avenida</p>
              <p className="ml-14">ul. Matyi 2, </p>
              <p className="ml-14">61-586 Poznań</p>
                </div>
                <div className="">
                <img src={logoave} alt="ave" className="w-30 ml-4 mt-4" />
                </div>
              </div>
              <p className="mt-4"><span className="font-bold text-[#ffcc00]">Email:</span> salon@goodgamevr.pl</p>
              <p><span className="font-bold text-[#ffcc00]">Telefon:</span> 664 133 082</p>
              <div className="mt-4">
                <p className="font-bold text-[#ffcc00]">Godziny otwarcia:</p>
                <p>Poniedziałek - Sobota: <span className="text-[#00d9ff] font-medium">9:00 – 21:00</span></p>
                <p>Niedziela: <span className="text-[#00d9ff] font-medium">10:00 – 20:00</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TYTUŁ */}
      <div className="bg-[#1e2636] text-white text-center py-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-wide uppercase">W co u nas zagrasz?</h2>
      </div>

      {/* SEKCJA GRY */}
      <div
        className="w-full bg-cover bg-center text-white py-16 px-4"
        style={{ backgroundImage: `url(${bg2})` }}
      >
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video, index) => (
            <div key={video.id} className="bg-black/60 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 hover:shadow-2xl transition duration-300">
              <iframe
                width="100%"
                height="200"
                src={`https://www.youtube.com/embed/${video.yt}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <p className="text-center py-2 text-sm font-bold">
                <span className="text-[#ffcc00]">#{index + 1}:</span>{" "}
                <span className="text-white">{video.title.toUpperCase()}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Link
            to="/gry-vr"
            className="bg-[#00d9ff] hover:bg-[#ffcc00] hover:text-black text-black font-bold py-3 px-6 rounded hover:scale-105 hover:shadow-xl transition duration-300 uppercase"
          >
            Zobacz więcej
          </Link>
        </div>
      </div>

      {/* OPINIE */}
      <div className="bg-[#1e2636] text-white text-center py-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-wide uppercase">Co mówią o nas klienci?</h2>
      </div>
      <script src="https://static.elfsight.com/platform/platform.js" async></script>
      <div className="elfsight-app-4780e361-129c-4ba0-86b1-477ad7cde398" data-elfsight-app-lazy></div>

      {/* REZERWACJA */}
      <div className="bg-[#1e2636] text-white text-center py-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-wide uppercase">Rezerwacja</h2>
      </div>

      <section className="bg-[#0f1525] text-white px-4 py-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-1/2 bg-[#1a1a1a] rounded shadow-lg p-4">
            <img src={book} alt="Booksy" className="w-full h-auto" />
          </div>
          <div className="w-full lg:w-1/2 flex flex-col">
            <h3 className="text-lg font-bold text-[#ff9900] mb-2">Oferta:</h3>
            <p>
              <span className="text-[#00d9ff] font-bold">Box VR</span> – gry w
              wirtualnej rzeczywistości z wykorzystaniem gogli VR i kontrolerów.
              Zagraj w takie tytuły jak Serious Sam, Elven Assassin, Beat Saber
              i wiele innych.
            </p>

            <p>
              <span className="text-[#00d9ff] font-bold">Symulator VR</span> –
              oglądanie filmów w wirtualnej rzeczywistości na ruchomych fotelach
              z wiejącym na nas wiatrem. Wsiądź do górskiej kolejki z wesołego
              miasteczka, przemierzaj galaktykę statkiem kosmicznym lub oglądaj
              dinozaury z bliska. To tylko część dostępnych opcji!
            </p>

            <h3 className="text-lg font-bold text-[#ff9900] mt-6">Cennik:</h3>

            <div className="mt-2">
              <p className="font-bold text-[#00d9ff]">Box VR – 1 stanowisko:</p>
              <ul className="list-disc ml-5 text-sm mt-1">
                <li><span className="text-white">Poniedziałek – Czwartek:</span> 30 min – <strong>39 zł</strong></li>
                <li><span className="text-white">Piątek – Niedziela:</span> 30 min – <strong>45 zł</strong></li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="font-bold text-[#00d9ff]">Symulator VR – 1 osoba:</p>
              <ul className="list-disc ml-5 text-sm mt-1">
                <li>Pierwszy przejazd – <strong>20 zł</strong></li>
                <li>Drugi przejazd – <strong>10 zł</strong></li>
                <li>Trzeci przejazd – <span className="text-green-400 font-bold">GRATIS</span></li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="font-bold text-[#00d9ff]">Symulator VR – 2 osoby:</p>
              <ul className="list-disc ml-5 text-sm mt-1">
                <li>Pierwszy przejazd – <strong>30 zł</strong></li>
                <li>Drugi przejazd – <strong>20 zł</strong></li>
                <li>Trzeci przejazd – <span className="text-green-400 font-bold">GRATIS</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
