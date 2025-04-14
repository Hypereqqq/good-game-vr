import React from "react";

import wizytowka from "../assets/MATERIAŁY/WIZYTÓWKA/WIZYTÓWKA 2.png"

const promoPosts = [
  {
    id: 1,
    title: "🎉 Promocja urodzinowa!",
    image: "https://placehold.co/600x300",
    description: "Z okazji urodzin -15% na wszystkie rezerwacje przez cały weekend!",
    date: "2025-04-10",
  },
  {
    id: 2,
    title: "Happy Hours",
    image: "https://placehold.co/600x300",
    description: "Od poniedziałku do czwartku, od 13:00 do 15:00 – 2x więcej czasu w tej samej cenie!",
    date: "2025-04-01",
  },
  {
    id: 3,
    title: "Darmowy przejazd w symulatorze",
    image: "https://placehold.co/600x300",
    description: "Co trzeci przejazd w naszym symulatorze – całkowicie za darmo!",
    date: "2025-03-28",
  },
];

const constantPosts = [
  {
    id: 1,
    title: "🎮 Karta Stałego Klienta",
    image: wizytowka,
    description: "Po pierwszej wizycie otrzymujesz kartę klienta. Zbieraj naklejki i odbieraj zniżki na kolejne gry!",
    date: "2025-04-15",
  },
  {
    id: 2,
    title: "🎓 Zniżka studencka",
    image: "https://placehold.co/600x300",
    description: "Pokaż legitymację studencką i zyskaj 5 zł zniżki na Box VR lub Symulator!",
    date: "2025-04-15",
  },
  {
    id: 3,
    title: "🎢 50% zniżki na symulator",
    image: "https://placehold.co/600x300",
    description: "Po grze na stanowisku VR – skorzystaj z symulatora z 50% rabatem!",
    date: "2025-04-15",
  },
];

const Discount: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white py-16 px-8 min-h-screen">
      <h1 className="text-4xl font-bold text-center text-[#00d9ff] uppercase mb-12">
        Promocje stałe
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {constantPosts.map((constantPosts) => (
          <div
            key={constantPosts.id}
            className="bg-[#1e2636] rounded-lg overflow-hidden shadow-lg hover:scale-[1.02] transition duration-300"
          >
            <img src={constantPosts.image} alt={constantPosts.title} className="w-full object-cover" />
            <div className="p-4 flex flex-col gap-2">
              <p className="text-sm text-[#ffcc00]">{constantPosts.date}</p>
              <h2 className="text-xl font-bold">{constantPosts.title}</h2>
              <p className="text-gray-300 text-sm">{constantPosts.description}</p>
            </div>
          </div>
        ))}
      </div>

      <h1 className="text-4xl pt-16 pb-12 font-bold text-center text-[#00d9ff] uppercase mb-12">
        Promocje
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {promoPosts.map((promo) => (
          <div
            key={promo.id}
            className="bg-[#1e2636] rounded-lg overflow-hidden shadow-lg hover:scale-[1.02] transition duration-300"
          >
            <img src={promo.image} alt={promo.title} className="w-full h-48 object-cover" />
            <div className="p-4 flex flex-col gap-2">
              <p className="text-sm text-[#ffcc00]">{promo.date}</p>
              <h2 className="text-xl font-bold">{promo.title}</h2>
              <p className="text-gray-300 text-sm">{promo.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Discount;
