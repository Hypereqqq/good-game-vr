import React, { useState } from "react";

const Contact: React.FC = () => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    setOpenQuestion((prev) => (prev === id ? null : id));
  };

  const renderQuestion = (id: string, question: string, answer: string) => (
    <div
      className={`bg-[#1e2636] rounded-lg p-4 mb-3 shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${openQuestion === id ? "bg-[#243040]" : ""}`}
      onClick={() => toggleQuestion(id)}
    >
      <h4 className="text-md font-semibold text-white flex justify-between items-center">
        {question}
        <span className="text-[#00d9ff] text-xl font-bold">{openQuestion === id ? "–" : "+"}</span>
      </h4>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${openQuestion === id ? "max-h-[1000px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}
      >
        <p className="text-gray-300 text-sm whitespace-pre-wrap">{answer}</p>
      </div>
    </div>
  );

  const universalFAQ = [
    { id: "u1", q: "Czy mogę zakupić voucher prezentowy?", a: "Tak, oferujemy vouchery prezentowe! Możesz je zakupić na miejscu w naszym salonie lub zamówić online. Aby kupić voucher przez internet, wystarczy napisać do nas maila. Po ustaleniu szczegółów dokonujesz przelewu bankowego, a my wysyłamy voucher w formie elektronicznej na podany adres e-mail." },
    { id: "u2", q: "Czy muszę rezerwować termin wcześniej, by móc zagrać?", a: "Rezerwacja nie jest obowiązkowa, ale zalecana, szczególnie w weekendy i wieczorami, gdy mamy więcej klientów. Możesz zarezerwować stanowisko online lub telefonicznie." },
    { id: "u3", q: "Czy można organizować u was imprezy?", a: "Tak! Oferujemy możliwość organizacji urodzin, imprez firmowych i innych wydarzeń. Skontaktuj się z nami, aby poznać szczegóły." },
    { id: "u4", q: "Jak mogę zapłacić za grę?", a: "Akceptujemy płatności gotówką, kartą oraz BLIK-iem." },
    { id: "u5", q: "Czy są dostępne zniżki dla studentów i uczniów?", a: "Tak! Za okazaniem legitymacji studenckiej / uczniowskiej przysługuje Ci 5 zł zniżki na półgodzinną sesję." },
    { id: "u6", q: "Czy są dostępne zniżki dla stałego klienta?", a: "Tak! Po pierwszej wizycie dostajesz wizytówkę z naklejką, dzięki której na kolejnej wizycie przysługuje Ci 5 zł zniżki. Po kolejnych wizytach dostajesz kolejne naklejki, które zwiększają zniżkę kolejno do 10 zł i 15 zł." },
    { id: "u7", q: "Ile stanowisk posiadacie?", a: "Posiadamy 8 stanowisk przeznaczonch do gry na goglach VR oraz 2 stanowiska na symulatorze 5D." },
    { id: "u8", q: "Czy VR powoduje zawroty głowy lub nudności?", a: "Niektóre osoby mogą odczuwać dyskomfort, zwłaszcza podczas pierwszego kontaktu z VR. Wybieramy gry minimalizujące takie efekty, a w razie potrzeby możesz zrobić przerwę." },
    { id: "u9", q: "Czy salon gier jest przystosowany dla osób z niepełnosprawnościami?", a: "Tak, dla osób poruszających się przy pomocy wózka dostępna jest winda. W salonie nie ma żadnych podestów czy stopni. W przypadku wielu gier dostępna jest również rozgrywka w pozycji siedzącej. W przypadku innych pytań w tym temacie zapraszamy do kontaktu pod numerem telefonu - 664 133 082." },
    { id: "u10", q: "Co w przypadku gdy osoba jest chora na epilepsję lub ma poważne problemy z błędnikiem?", a: "W takim przypadku zdecydowanie odradzamy grę na VR, soczewki z obrazem znajdują się stosunkowo blisko oczu i w przypadku wielu gier występuje migające światło." },
    { id: "u11", q: "Czy można rozdzielić voucher lub wykorzystać go na kilka razy?", a: "Tak, czas na voucherze możemy rozdzielić pomiędzy kilka osób oraz nie musimy wykorzystywać całego czasu od razu." },
    { id: "u12", q: "Jak dbamy o higienę sprzętu?", a: "Gąbki dotykające naszej twarzy są wymieniane po każdym kliencie. Cały sprzęt jest dezynfekowany, a gąbki dodatkowo są regularnie czyszczone." },
    { id: "u13", q: "Gdzie mogę zostawić rzeczy osobiste?", a: "Na miejscu znajdują się szafki zamykane na klucz, w których można bezpiecznie przechować swoje przedmioty." },
    { id: "u14", q: "W jakie dni i w jakich godzinach jesteście otwarci?", a: "Jesteśmy otwarci w każdy dzień tygodnia od 09:00 do 21:00 z wyjątkiem niedzieli, w którą jesteśmy otwarci od 10:00 do 20:00. W dni świąteczne godziny otwarcia mogą ulec zmianie." },
    { id: "u15", q: "Czy na miejscu w salonie jest toaleta?", a: "Niestety w salonie nie posiadamy toalety, ale możesz skorzystać z toalety znajdującej się w galerii Avenida." }
  ];

  const boxVrFAQ = [
    { id: "b1", q: "Jak działa salon gier VR?", a: "W naszym salonie kupujesz określoną ilość czasu na grę w wirtualnej rzeczywistości. Po wybraniu gry zakładasz gogle VR i przenosisz się do innego świata!" },
    { id: "b2", q: "Czy mogę grać razem z przyjaciółmi?", a: "Tak! Mamy gry wieloosobowe, w których możesz rywalizować lub współpracować ze znajomymi nawet do 8 osób w tym samym czasie." },
    { id: "b3", q: "Czy są jakieś ograniczenia wiekowe podczas grania na VR?", a: "Zalecamy, aby gracze mieli co najmniej 7 lat. Niektóre gry mogą mieć wyższy limit wiekowy, zgodnie z klasyfikacją PEGI, jednak jest to jedynie wskazówka, a nie wymagane ograniczenie." },
    { id: "b4", q: "Jakie gry macie w ofercie?", a: "Mamy szeroki wybór gier: od strzelanek i przygodówek, przez gry sportowe, aż po doświadczenia edukacyjne i symulatory. Możesz zobaczyć pełną listę gier na naszej stronie internetowej." },
    { id: "b5", q: "Czy w trakcie rozgrywki mogę zmienić grę?", a: "Tak, podczas sesji jest możliwa zmiana gry, jednak pamiętaj, że częsta zmiana gier skutkuje krótszym czasem faktycznej rozgrywki. Wynika to z konieczności uruchomienia i tłumaczenia gier." },
    { id: "b6", q: "Czy mogę grać, jeśli nigdy nie używałem VR?", a: "Oczywiście! Nasz personel wytłumaczy Ci zasady działania sprzętu oraz danej gry. W razie jakichkolwiek wątpliwości czy pytań podczas rozgrywki również służymy pomocą." },
    { id: "b7", q: "Czy mogę grać w VR, jeśli noszę okulary?", a: "Tak! Nasze gogle VR są przystosowane do większości okularów korekcyjnych. Jeśli jednak masz bardzo duże oprawki, warto rozważyć soczewki kontaktowe dla większego komfortu." },
    { id: "b8", q: "Czy mogę przynieść własne gry?", a: "Na ten moment korzystamy wyłącznie z naszego katalogu gier, ale regularnie go aktualizujemy na podstawie opinii klientów." },
    { id: "b9", q: "Jak długo mogę grać?", a: "Minimalny czas gry to 30 minut, ale możesz wykupić dowolny dłuższy pakiet. Możesz też przedłużyć sesję, jeśli stanowisko jest dostępne." },
    { id: "b10", q: "Czy mogę nagrać swoją rozgrywkę?", a: "Tak, możesz nagrywać swoje rozgrywki. Na miejscu dostępny mamy również statyw." },
    { id: "b11", q: "Czy mogę otrzymać fakturę przy płatności?", a: "Tak, wystawiamy faktury za płatność. Jeśli potrzebujesz faktury, poinformuj nas o tym przy zakupie na miejscu lub w wiadomości e-mail przy zamówieniu online. W przypadku płatności przelewem prosimy o podanie danych do faktury w tytule przelewu lub w wiadomości." }
  ];

  const simulatorFAQ = [
    { id: "s1", q: "Jak działa oferta symulator 5D?", a: "Symulator 5D łączy ze sobą wirtualną rzeczywistość z ruchomymi fotelami, dzięki którym możemy wsiąść za kółko wyścigowego auta, statku kosmicznego czy też przejechać się po parku dinozaurów." },
    { id: "s2", q: "Czy symulator 5D jest bezpieczny?", a: "Tak, symulator 5D jest bezpieczny, każdy użytkownik jest zapinany w pasy bezpieczeństwo, które uniemożliwiają wyjście podczas przejazdu. Dodatkowo w razie komplikacji (przykładowo zawrotów głowy), każdy użytkownik w zasięgu ręki ma przycisk awaryjny, który zatrzymuje ruch foteli." },
    { id: "s3", q: "Czy są jakieś ograniczenia wiekowe na symulatorze 5D?", a: "---" }
  ];



  return (
    <div className="bg-[#0f1525] text-white min-h-screen py-16 px-6">
      <h1 className="text-4xl font-bold text-center text-[#00d9ff] uppercase mb-12">
        Kontakt
      </h1>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEWA STRONA - Informacje + Mapa */}
        <div className="bg-[#1e2636] p-6 rounded-lg shadow-lg flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-[#00d9ff] mb-2">Może się przydać!</h2>
          <p>
            <span className="font-bold ">⏱ Godziny otwarcia:</span>{" "}
            <p>Poniedziałek - Sobota: <span className="text-[#00d9ff] font-medium">9:00 – 21:00</span></p>
                <p>Niedziela: <span className="text-[#00d9ff] font-medium">10:00 – 20:00</span></p>
          </p>
          <p>
            <span className="font-bold ">📌 Adres:</span>{" "}
            Centrum Avenida, ul. Matyi 2, 61-586 Poznań
          </p>
          <p>
            <span className="font-bold ">📞 Telefon:</span>{" "}
            <span className="text-[#ffcc00] font-bold">664 133 082</span>
          </p>
          <p>
            <span className="font-bold ">✉️ Email:</span>{" "}
            salon@goodgamevr.pl
          </p>

          <div className="mt-4">
            <iframe
              title="Mapa Good Game VR"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2442.012041014988!2d16.919605215797398!3d52.3988665797916!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47045b37323ed11b%3A0xb4fd90b91f2a6d09!2sAvenida%20Pozna%C5%84!5e0!3m2!1spl!2spl!4v1711700000000!5m2!1spl!2spl"
              className="w-full h-64 rounded-lg border-none"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        </div>

        {/* PRAWA STRONA - Formularz */}
        <form className="bg-[#1e2636] p-6 rounded-lg shadow-lg flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-[#00d9ff] mb-2">Napisz do nas</h2>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-1">
              Imię i nazwisko
            </label>
            <input
              type="text"
              id="name"
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              placeholder="Jan Kowalski"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              placeholder="jan@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold mb-1">
              Wiadomość
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full p-2 rounded bg-[#0f1525] border border-gray-600 text-white"
              placeholder="Wpisz swoją wiadomość..."
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="bg-[#00d9ff] text-black font-bold py-2 px-4 rounded hover:bg-[#ffcc00] hover:pointer hover:text-black transition duration-300"
          >
            Wyślij wiadomość
          </button>
        </form>
      </div>

      {/* FAQ */}
      <div className="max-w-6xl mx-auto mt-20">
        <h2 className="text-3xl font-bold text-center text-[#00d9ff] uppercase mb-10">FAQ</h2>

        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-[#ffcc00] mb-6">Uniwersalne</h3>
          {universalFAQ.map((item) => renderQuestion(item.id, item.q, item.a))}
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-[#ffcc00] mb-6">Box VR</h3>
          {boxVrFAQ.map((item) => renderQuestion(item.id, item.q, item.a))}
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-[#ffcc00] mb-6">Symulator 5D</h3>
          {simulatorFAQ.map((item) => renderQuestion(item.id, item.q, item.a))}
        </div>
      </div>
    </div>
  );
};

export default Contact;
