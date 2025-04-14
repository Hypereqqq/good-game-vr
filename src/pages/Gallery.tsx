import React from "react";

// Możesz podmienić obrazki na własne lokalne lub z hostingu
const images = [
  "https://placehold.co/600x400?text=Salon+1",
  "https://placehold.co/600x400?text=Salon+2",
  "https://placehold.co/600x400?text=Stanowisko+VR",
  "https://placehold.co/600x400?text=Recepcja",
  "https://placehold.co/600x400?text=Symulator",
  "https://placehold.co/600x400?text=Grajacy-klient",
];

const Gallery: React.FC = () => {
  return (
    <div className="bg-[#0f1525] text-white py-16 px-6 min-h-screen">
        
      <h1 className="text-4xl font-bold text-center text-[#00d9ff] uppercase mb-12">
        Galeria
      </h1>

      {/* Sekcja Spaceru 3D */}
      <section className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-[#00d9ff]">Spacer 3D po salonie</h2>
        <div className="w-full rounded-lg shadow-lg overflow-hidden bg-[#1e2636] aspect-[16/9]">
  <iframe
    src="https://www.google.com/maps/embed?pb=!4v1711723876012!6m8!1m7!1sCAoSLEFGMVFpcE1XT1R1Z3FMRWlORVZSU3lxWjYxUzhDRTlmWHN4SHlkR2U4Wjd1!2m2!1d52.4007114!2d16.9138931!3f85.2!4f69.93!5f0.7820865974627469"
    title="Spacer 3D po salonie"
    allowFullScreen
    loading="lazy"
    className="w-full h-full border-none"
  ></iframe>
</div>
      </section>

      {/* Sekcja zdjęć */}
      <section className="max-w-7xl mx-auto mb-20">
        <h2 className="text-2xl mt-10 font-bold mb-6 text-[#00d9ff]">Zdjęcia z naszego salonu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((src, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg shadow-lg hover:scale-[1.03] transition duration-300 bg-[#1e2636]"
            >
              <img src={src} alt={`Zdjęcie ${index + 1}`} className="w-full h-60 object-cover" />
            </div>
          ))}
        </div>
      </section>

      
    </div>
  );
};

export default Gallery;
