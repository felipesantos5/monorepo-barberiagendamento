import { useEffect, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  View,
  EventProps,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import useMediaQuery from "@/hooks/useMediaQuery";
interface AgendaEvent {
  _id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
}

const CustomEvent = ({ event }: EventProps<AgendaEvent>) => {
  const isCanceled = event.resource?.status === "canceled";
  const containerClasses = "relative w-full h-full p-1 text-xs overflow-hidden";

  if (event.resource?.type === "block") {
    return (
      <div className="p-1 text-sm text-gray-700 font-semibold h-full overflow-hidden">
        <p>{event.resource.barberName}</p>
        <p>{event.title}</p>
      </div>
    );
  }

  return (
    <div
      className={
        containerClasses + (isCanceled ? " text-white/50" : " text-white")
      }
    >
      <div className={isCanceled ? "opacity-70" : ""}>
        <strong className="font-bold block truncate">
          {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
        </strong>
        <div className="block truncate">{event.resource.customer?.name}</div>
        <div className="block truncate opacity-80">
          {event.resource.service?.name}
        </div>
      </div>

      {isCanceled && (
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/80 transform -rotate-6" />
      )}
      {isCanceled && (
        <div className="absolute top-1/2 right-0 w-full h-0.5 bg-red-500/80 transform rotate-6" />
      )}
    </div>
  );
};

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales,
});
const messages = {
  allDay: "Dia todo",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Não há agendamentos neste período.",
  showMore: (total: number) => `+ ver mais (${total})`,
};

const minTime = new Date();
minTime.setHours(5, 0, 0);
const maxTime = new Date();
maxTime.setHours(23, 0, 0);

interface AgendaViewProps {
  events: AgendaEvent[];
  onSelectEvent: (event: AgendaEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
  currentDate: Date;
  onNavigate: (newDate: Date) => void;
}

export function AgendaView({
  events,
  onSelectEvent,
  onSelectSlot,
  currentDate,
  onNavigate,
}: AgendaViewProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [currentView, setCurrentView] = useState<View>(
    isMobile ? Views.DAY : Views.WEEK
  );

  console.log("events", events);

  useEffect(() => {
    setCurrentView(isMobile ? Views.DAY : Views.WEEK);
  }, [isMobile]);

  const hexToRgba = (hex: string, alpha: number) => {
    const hexValue = hex.startsWith("#") ? hex.slice(1) : hex;

    const r = parseInt(hexValue.slice(0, 2), 16);
    const g = parseInt(hexValue.slice(2, 4), 16);
    const b = parseInt(hexValue.slice(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return "rgba(51, 51, 51, " + alpha + ")";
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="h-[75vh] bg-white p-2 md:p-4 rounded-lg shadow">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="pt-BR"
        messages={messages}
        onSelectEvent={onSelectEvent}
        view={currentView}
        onView={(view) => setCurrentView(view)}
        scrollToTime={new Date()}
        style={{ height: "100%" }}
        min={minTime}
        max={maxTime}
        date={currentDate}
        onNavigate={onNavigate}
        selectable
        onSelectSlot={onSelectSlot}
        components={{
          event: CustomEvent,
        }}
        eventPropGetter={(event) => {
          const style: React.CSSProperties = {
            backgroundColor: (event.resource as any)?.color || "#333333",
            border: "none",
            borderRadius: "4px",
            color: "white",
            opacity: 1,
          };

          if (event.resource?.type === "block") {
            return {
              style: {
                backgroundColor: "transparent",
                backgroundImage:
                  "repeating-linear-gradient(45deg, #e9ecef, #e9ecef 10px, #f8f9fa 10px, #f8f9fa 20px)",
                color: "#495057",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
                opacity: event.resource?.isPast ? 0.7 : 1,
              },
            };
          }

          if (event.resource?.isPast) {
            style.backgroundColor = hexToRgba(
              (event.resource as any)?.color || "#333333",
              0.5
            );
          }

          if (event.resource?.status === "canceled") {
            style.textDecoration = "line-through";
          }

          return { style };
        }}
      />
    </div>
  );
}
