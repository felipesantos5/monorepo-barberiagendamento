import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PriceFormater } from "@/helper/priceFormater";
import { Service, Barber } from "@/types/barberShop";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Interface de props que o componente espera receber do componente pai
interface ServiceSelectionProps {
  selectedService: string;
  selectedBarber: string;
  onSelectService: (id: string) => void;
  onSelectBarber: (id: string) => void;
  services: Service[];
  barbers: Barber[];
}

const sectionAnimation = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3, ease: "easeInOut" },
};

export default function ServiceSelection({
  selectedService,
  selectedBarber,
  onSelectService,
  onSelectBarber,
  services,
  barbers,
}: ServiceSelectionProps) {
  // Estado para controlar qual visualização está ativa: 'services' ou 'barbers'
  const [view, setView] = useState<"services" | "barbers">("services");

  const handleServiceClick = (serviceId: string) => {
    onSelectService(serviceId);
    // Ao selecionar um serviço, muda para a visualização de barbeiros
    setView("barbers");
  };

  const handleBarberClick = (barberId: string) => {
    onSelectBarber(barberId);
  };

  const handleBackToServices = () => {
    // Ao voltar, limpa a seleção de barbeiro e muda a visualização
    onSelectBarber("");
    setView("services");
  };

  return (
    <div className="space-y-4">
      {/* O AnimatePresence gerencia as animações de entrada e saída dos componentes filhos */}
      <AnimatePresence mode="wait">
        {/* --- VISUALIZAÇÃO DE SERVIÇOS --- */}
        {view === "services" && (
          <motion.div
            key="services" // Chave única para o AnimatePresence identificar o elemento
            initial={sectionAnimation.initial}
            animate={sectionAnimation.animate}
            exit={sectionAnimation.exit}
            // transition={sectionAnimation.transition}
            className="space-y-4"
          >
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-semibold text-gray-900">Escolha o Serviço</h2>
              {/* <p className="mt-1 text-sm text-gray-500">Clique no serviço que você deseja agendar.</p> */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((service) => {
                const isSelected = service._id === selectedService;
                return (
                  <Button
                    key={service._id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleServiceClick(service._id)}
                    className={`h-auto p-4 flex justify-between items-center w-full text-left transition-all ${
                      isSelected
                        ? "bg-[var(--loja-theme-color)] text-white hover:bg-[var(--loja-theme-color)]/90 border-transparent shadow-lg"
                        : "bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className={`text-xs ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>{service.duration} min</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${isSelected ? "text-white" : "text-[var(--loja-theme-color)]"}`}>
                        {PriceFormater(service.price)}
                      </span>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-white" />}
                    </div>
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* --- VISUALIZAÇÃO DE BARBEIROS --- */}
        {view === "barbers" && (
          <motion.div
            key="barbers" // Chave única
            initial={sectionAnimation.initial}
            animate={sectionAnimation.animate}
            exit={sectionAnimation.exit}
            // transition={sectionAnimation.transition}
            className="space-y-4"
          >
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-semibold text-gray-900">Escolha o Profissional</h2>
              {/* <p className="mt-1 text-sm text-gray-500 md:ml-12">Selecione com quem você quer ser atendido.</p> */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {barbers.map((barber) => {
                const isSelected = barber._id === selectedBarber;
                return (
                  <Button
                    key={barber._id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleBarberClick(barber._id)}
                    className={`h-auto p-3 flex justify-start items-center gap-4 w-full text-left transition-all ${
                      isSelected
                        ? "bg-[var(--loja-theme-color)] text-white hover:bg-[var(--loja-theme-color)]/90 border-transparent shadow-lg"
                        : "bg-white"
                    }`}
                  >
                    <Avatar>
                      <AvatarImage src={barber.image} />
                      <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{barber.name}</span>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-white ml-auto" />}
                  </Button>
                );
              })}
              <Button type="button" variant="outline" size="icon" onClick={handleBackToServices}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
