import { MapPin, Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Barbershop, Availability } from "@/types/barberShop"; // Importando suas tipagens

// Ícone do WhatsApp
const WhatsAppIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className="fill-[var(--loja-theme-color)]"
  >
    <path d="M12.01,2C6.5,2,2.02,6.48,2.02,11.99c0,1.76,0.46,3.48,1.34,4.99l-1.36,4.99l5.1-1.34c1.45,0.8,3.09,1.23,4.79,1.23h0.01c5.5,0,9.98-4.48,9.98-9.99c0-5.52-4.48-9.99-9.98-9.99z M12.01,4c4.42,0,8,3.58,8,8c0,4.42-3.58,8-8,8c-1.55,0-3.04-0.44-4.33-1.25l-0.35-0.21l-3.1,0.81l0.83-3.03l-0.23-0.36c-0.86-1.32-1.32-2.86-1.32-4.43C4.02,7.58,7.59,4,12.01,4z M8.48,7.38c-0.17,0-0.33,0.05-0.46,0.18c-0.13,0.13-0.54,0.54-0.54,1.51c0,0.97,0.55,1.91,0.63,2.02c0.08,0.11,1.58,2.5,3.78,3.35c1.8,0.7,2.2,0.6,2.6,0.5c0.4-0.1,1.2-0.5,1.4-0.9c0.2-0.4,0.2-0.8,0.1-0.9c-0.1-0.1-0.2-0.2-0.4-0.3c-0.2-0.1-1.2-0.6-1.4-0.7c-0.2-0.1-0.3-0.1-0.5,0.1c-0.2,0.2-0.6,0.7-0.7,0.9c-0.1,0.1-0.2,0.2-0.4,0.1c-0.2-0.1-1-0.4-1.9-1.2c-0.7-0.6-1.2-1.4-1.3-1.6c-0.1-0.2,0-0.3,0.1-0.4c0.1-0.1,0.2-0.2,0.4-0.4c0.1-0.1,0.2-0.2,0.2-0.4c0-0.1,0-0.3-0.1-0.4c-0.1-0.1-0.6-1.4-0.8-1.9C9.11,7.46,8.95,7.38,8.78,7.38H8.48z" />
  </svg>
);

// A interface de props agora espera o objeto barbershop e a disponibilidade
interface ShopInfoProps {
  barbershop: Barbershop;
  availability: Availability[];
}

export function ShopInfo({ barbershop, availability }: ShopInfoProps) {
  // Monta o endereço completo e o link para o Google Maps
  const fullAddress = `${barbershop.address.rua}, ${barbershop.address.numero} - ${barbershop.address.bairro}, ${barbershop.address.cidade}/${barbershop.address.estado}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddress
  )}`;

  // Formata os links de redes sociais
  const whatsappLink = barbershop.contact
    ? `https://wa.me/55${barbershop.contact.replace(/\D/g, "")}`
    : null;

  // Descobre o nome do dia da semana atual para destacar
  const todayName = new Date().toLocaleDateString("pt-BR", { weekday: "long" });

  return (
    <div className="space-y-6 px-4 text-gray-600 mt-4">
      <h2 className="text-gray-700 text-xl font-semibold mb-7 text-center">
        Conheça um pouco sobre nós
      </h2>

      {barbershop.description && (
        <>
          <section className="space-y-2">
            <h3 className="text-lg font-semibold">Descrição</h3>
            <div className="flex items-start justify-between gap-4">
              <p className="">{barbershop.description}</p>
            </div>
          </section>

          <hr className="border-gray-200" />
        </>
      )}

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Localização</h3>
        <div className="flex items-start justify-between gap-4">
          <p className="">{fullAddress}</p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver no mapa"
            className="flex-shrink-0 p-2 rounded-full   transition-colors"
          >
            <MapPin className="h-5 w-5 text-[var(--loja-theme-color)]" />
          </a>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Seção de Horário de Atendimento */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Horário de atendimento</h3>
        <div className="space-y-2 ">
          {availability.map((wh) => (
            <div key={wh.day} className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                {wh.day}
                {wh.day.toLowerCase() === todayName.toLowerCase() && (
                  <Badge className="bg-[var(--loja-theme-color)] text-white px-2 py-0.5 text-xs">
                    Hoje
                  </Badge>
                )}
              </span>
              <span className="font-mono">{`${wh.start} - ${wh.end}`}</span>
            </div>
          ))}
        </div>
      </section>

      {/* A Seção de Pagamentos foi REMOVIDA, pois não existe no schema */}

      <hr className="border-gray-200" />

      {/* Seção de Redes Sociais */}
      <section className="flex justify-between items-center pb-4">
        <h3 className="text-lg font-semibold">Conheça nossas redes sociais!</h3>
        <div className="flex items-center gap-4">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="fill-[var(--loja-theme-color)]"
                width="24px"
                height="24px"
                viewBox="-1.66 0 740.824 740.824"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M630.056 107.658C560.727 38.271 468.525.039 370.294 0 167.891 0 3.16 164.668 3.079 367.072c-.027 64.699 16.883 127.855 49.016 183.523L0 740.824l194.666-51.047c53.634 29.244 114.022 44.656 175.481 44.682h.151c202.382 0 367.128-164.689 367.21-367.094.039-98.088-38.121-190.32-107.452-259.707m-259.758 564.8h-.125c-54.766-.021-108.483-14.729-155.343-42.529l-11.146-6.613-115.516 30.293 30.834-112.592-7.258-11.543c-30.552-48.58-46.689-104.729-46.665-162.379C65.146 198.865 202.065 62 370.419 62c81.521.031 158.154 31.81 215.779 89.482s89.342 134.332 89.311 215.859c-.07 168.242-136.987 305.117-305.211 305.117m167.415-228.514c-9.176-4.591-54.286-26.782-62.697-29.843-8.41-3.061-14.526-4.591-20.644 4.592-6.116 9.182-23.7 29.843-29.054 35.964-5.351 6.122-10.703 6.888-19.879 2.296-9.175-4.591-38.739-14.276-73.786-45.526-27.275-24.32-45.691-54.36-51.043-63.542-5.352-9.183-.569-14.148 4.024-18.72 4.127-4.11 9.175-10.713 13.763-16.07 4.587-5.356 6.116-9.182 9.174-15.303 3.059-6.122 1.53-11.479-.764-16.07-2.294-4.591-20.643-49.739-28.29-68.104-7.447-17.886-15.012-15.466-20.644-15.746-5.346-.266-11.469-.323-17.585-.323-6.117 0-16.057 2.296-24.468 11.478-8.41 9.183-32.112 31.374-32.112 76.521s32.877 88.763 37.465 94.885c4.587 6.122 64.699 98.771 156.741 138.502 21.891 9.45 38.982 15.093 52.307 19.323 21.981 6.979 41.983 5.994 57.793 3.633 17.628-2.633 54.285-22.19 61.932-43.616 7.646-21.426 7.646-39.791 5.352-43.617-2.293-3.826-8.41-6.122-17.585-10.714"
                />
              </svg>
            </a>
          )}
          {barbershop.instagram && (
            <a
              href={barbershop.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-full transition-colors"
            >
              <Instagram className="text-[var(--loja-theme-color)]" />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
