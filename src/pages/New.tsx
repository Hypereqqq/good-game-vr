import React from "react";

const dummyPosts = [
  {
    id: 1,
    title: "Nowa gra już dostępna!",
    image: "https://placehold.co/600x300",
    description: "Wprowadziliśmy nowy tytuł do naszego salonu – sprawdź sam!",
    date: "2025-03-26",
  },
  {
    id: 2,
    title: "Event weekendowy!",
    image: "https://placehold.co/600x300",
    description: "Zbliża się wielki event VR – nie może Cię zabraknąć!",
    date: "2025-03-20",
  },
  {
    id: 3,
    title: "Zniżki na rezerwacje",
    image: "https://placehold.co/600x300",
    description: "Tylko w tym tygodniu: -20% na wszystkie stanowiska!",
    date: "2025-03-18",
  },
  {
    id: 4,
    title: "Nowe gogle VR już dostępne",
    image: "https://placehold.co/600x300",
    description: "Testuj najnowsze urządzenia w naszym salonie!",
    date: "2025-03-15",
  },
  {
    id: 5,
    title: "Turniej Beat Saber",
    image: "https://placehold.co/600x300",
    description: "Zgarnij nagrody i pokaż kto tu rządzi rytmem!",
    date: "2025-03-10",
  },
  {
    id: 6,
    title: "Urodziny salonu 🎉",
    image: "https://placehold.co/600x300",
    description: "Świętuj z nami kolejny rok! Niespodzianki dla wszystkich!",
    date: "2025-03-01",
  },
];

const New: React.FC = () => {
  return (
    <div className=" text-white py-16 px-8 min-h-screen">

<h1 className=" bg-[#0f1525] text-4xl font-bold text-center text-[#00d9ff] uppercase mb-12">
    Aktualności
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {dummyPosts.map((post) => (
          <div
            key={post.id}
            className="bg-[#1e2636] rounded-lg overflow-hidden shadow-lg hover:scale-[1.02] transition duration-300"
          >
            <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
            <div className="p-4 flex flex-col gap-2">
              <p className="text-sm text-[#ffcc00]">{post.date}</p>
              <h2 className="text-xl font-bold">{post.title}</h2>
              <p className="text-gray-300 text-sm">{post.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default New;
