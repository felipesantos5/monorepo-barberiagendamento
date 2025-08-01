// src/routes/barberRoutes.js
import express from "express";
import mongoose from "mongoose";
import Barber from "../models/Barber.js";
import AdminUser from "../models/AdminUser.js";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import {
  barberCreationSchema,
  barberUpdateSchema,
} from "../validations/barberValidation.js";
import { z } from "zod";
import {
  startOfDay,
  endOfDay,
  parseISO,
  format as formatDateFns,
} from "date-fns";
import { protectAdmin } from "../middleware/authAdminMiddleware.js";
import { requireRole } from "../middleware/authAdminMiddleware.js";
import { ptBR } from "date-fns/locale";
import crypto from "crypto";
import { checkIsHoliday } from "../services/holidayService.js";
import BlockedDay from "../models/BlockedDay.js";
import TimeBlock from "../models/TimeBlock.js";
import { toZonedTime } from "date-fns-tz";

import "dotenv/config";

const router = express.Router({ mergeParams: true }); // mergeParams é importante para acessar :barbershopId

const BRAZIL_TIMEZONE = "America/Sao_Paulo";

// Adicionar Barbeiro a uma Barbearia
// Rota: POST /barbershops/:barbershopId/barbers
router.post("/", protectAdmin, requireRole("admin"), async (req, res) => {
  try {
    // ... (sua validação de autorização) ...
    const data = barberCreationSchema.parse(req.body);

    const existingAdminUser = await AdminUser.findOne({ email: data.email });
    if (existingAdminUser) {
      return res.status(409).json({ error: "Este email já está em uso." });
    }

    const newBarber = await Barber.create({
      name: data.name,
      image: data.image,
      availability: data.availability,
      commission: data.commission,
      barbershop: req.params.barbershopId,
    });

    // ✅ GERAÇÃO DO TOKEN
    const setupToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(setupToken)
      .digest("hex");

    // O token expira em, por exemplo, 72 horas
    const tokenExpiration = Date.now() + 72 * 60 * 60 * 1000;

    if (newBarber) {
      await AdminUser.create({
        email: data.email,
        role: "barber",
        barbershop: req.params.barbershopId,
        barberProfile: newBarber._id,
        status: "pending",
        accountSetupToken: hashedToken,
        accountSetupTokenExpires: new Date(tokenExpiration),
      });
    }

    // ✅ Retorna o link de configuração para o admin frontend
    // Em um app real, você enviaria este link por email para data.email
    const setupLink = `${process.env.ADMIN_FRONTEND_URL}/configurar-senha/${setupToken}`;

    res.status(201).json({
      barber: newBarber,
      setupLink: setupLink, // O admin pode copiar e enviar este link para o barbeiro
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Dados inválidos.", details: e.errors });
    }
    console.error("Erro ao criar funcionário:", e);
    res.status(500).json({ error: e.message || "Erro ao criar funcionário." });
  }
});

// Listar Barbeiros de uma Barbearia
// Rota: GET /barbershops/:barbershopId/barbers
router.get("/", async (req, res) => {
  try {
    const barbershopId = new mongoose.Types.ObjectId(req.params.barbershopId);

    const barbers = await Barber.aggregate([
      // 1. Encontra todos os barbeiros que pertencem a esta barbearia
      {
        $match: { barbershop: barbershopId },
      },
      // 2. Faz o "JOIN" com a coleção 'adminusers'
      {
        $lookup: {
          from: "adminusers", // O nome da coleção no MongoDB (geralmente plural e minúsculo)
          localField: "_id", // O campo no modelo 'Barber'
          foreignField: "barberProfile", // O campo correspondente no modelo 'AdminUser'
          as: "loginInfo", // O nome do novo array que será adicionado com os dados do usuário
        },
      },
      // 3. O $lookup retorna um array. $unwind descontrói esse array para podermos acessar os campos.
      {
        $unwind: {
          path: "$loginInfo",
          preserveNullAndEmptyArrays: true, // Mantém barbeiros na lista mesmo que não tenham um login (importante!)
        },
      },
      // 4. Projeta (seleciona) os campos que queremos retornar para o frontend
      {
        $project: {
          _id: 1, // 1 significa incluir o campo
          name: 1,
          image: 1,
          availability: 1,
          email: "$loginInfo.email",
          commission: 1,
          // Pega o email de dentro do objeto 'loginInfo' que foi juntado
        },
      },
    ]);

    res.json(barbers);
  } catch (e) {
    console.error("Erro ao buscar funcionários:", e);
    res.status(500).json({ error: "Erro ao buscar funcionários." });
  }
});

// Rota: GET /barbershops/:barbershopId/barbers/:barberId/free-slots
router.get("/:barberId/free-slots", async (req, res) => {
  try {
    const { date } = req.query;
    const serviceId = req.query.serviceId;

    const { barberId, barbershopId } = req.params;

    const requestedDate = new Date(date);
    // Adiciona o fuso horário para evitar problemas de "um dia antes"
    requestedDate.setMinutes(
      requestedDate.getMinutes() + requestedDate.getTimezoneOffset()
    );

    const holidayCheck = await checkIsHoliday(requestedDate);
    if (holidayCheck.isHoliday) {
      return res.json({
        isHoliday: true,
        holidayName: holidayCheck.holidayName,
        slots: [], // Retorna uma lista de horários vazia
      });
    }

    const dayIsBlocked = await BlockedDay.findOne({
      barbershop: barbershopId,
      date: { $gte: startOfDay(requestedDate), $lte: endOfDay(requestedDate) },
      // Verifica se o dia está bloqueado para a loja toda (barber: null)
      // OU para este barbeiro específico ($in: [null, barberId])
      barber: { $in: [null, barberId] },
    });

    if (dayIsBlocked) {
      return res.json({
        isBlocked: true,
        reason: dayIsBlocked.reason || "Dia indisponível para agendamento.",
        slots: [],
      });
    }

    // Buscar o serviço para obter a duração
    const serviceDoc = await Service.findById(serviceId).lean();
    if (!serviceDoc)
      return res.status(404).json({ error: "Serviço não encontrado." });
    const serviceDuration = serviceDoc.duration;
    if (isNaN(serviceDuration) || serviceDuration <= 0)
      return res.status(400).json({ error: "Duração do serviço inválida." });

    const barber = await Barber.findById(barberId).lean();
    if (!barber || barber.barbershop.toString() !== barbershopId) {
      /* ... erro ... */
    }

    // selectedDateInput é "YYYY-MM-DD"
    // parseISO cria uma data UTC à meia-noite desse dia.
    // Ex: "2025-06-10" -> 2025-06-10T00:00:00.000Z
    const dateObjectFromQuery = parseISO(date);

    const tempDateForDayName = new Date(`${date}T12:00:00`);
    const dayOfWeekName = formatDateFns(tempDateForDayName, "EEEE", {
      locale: ptBR,
    });

    const workHours = barber.availability.find(
      (a) => a.day.toLowerCase() === dayOfWeekName.toLowerCase()
    );
    if (!workHours) return res.json([]);

    const allLocalSlots = [];
    const [startWorkHour, startWorkMinute] = workHours.start
      .split(":")
      .map(Number);
    const [endWorkHour, endWorkMinute] = workHours.end.split(":").map(Number);
    const slotInterval = 15;

    let currentHour = startWorkHour;
    let currentMinute = startWorkMinute;

    while (true) {
      const slotEndHour =
        currentHour + Math.floor((currentMinute + serviceDuration - 1) / 60); // Hora que o serviço terminaria
      const slotEndMinute = ((currentMinute + serviceDuration - 1) % 60) + 1; // Minuto que o serviço terminaria

      // Verifica se o fim do serviço ultrapassa o fim do expediente
      if (
        slotEndHour > endWorkHour ||
        (slotEndHour === endWorkHour && slotEndMinute > endWorkMinute)
      ) {
        break;
      }

      const timeString = `${String(currentHour).padStart(2, "0")}:${String(
        currentMinute
      ).padStart(2, "0")}`;
      allLocalSlots.push(timeString);

      currentMinute += slotInterval;
      while (currentMinute >= 60) {
        // Use while para caso o intervalo seja > 60
        currentHour++;
        currentMinute -= 60;
      }
      // Para o loop se a próxima hora de início já ultrapassa o limite
      if (
        currentHour > endWorkHour ||
        (currentHour === endWorkHour && currentMinute >= endWorkMinute)
      ) {
        break;
      }
    }

    // Agendamentos existentes (armazenados em UTC)
    const existingBookings = await Booking.find({
      barber: barberId,
      barbershop: barbershopId,
      // Usamos dateObjectFromQuery que é meia-noite UTC para startOfDay e endOfDay
      time: {
        $gte: startOfDay(dateObjectFromQuery),
        $lt: endOfDay(dateObjectFromQuery),
      },
      status: { $ne: "canceled" },
    })
      .populate("service", "duration")
      .lean();

    const timeBlocks = await TimeBlock.find({
      barber: barberId,
      // A busca precisa encontrar blocos que *se sobrepõem* ao dia, não apenas que começam nele
      startTime: { $lt: endOfDay(dateObjectFromQuery) },
      endTime: { $gt: startOfDay(dateObjectFromQuery) },
    }).lean();

    // bookedIntervalsLocal: Array de objetos { start: string HH:mm, end: string HH:mm } no horário local
    const bookedIntervalsLocal = existingBookings.map((booking) => {
      // bookedTimeIsUTC é o objeto Date do banco (UTC)
      const bookedTimeIsUTC = booking.time;
      const localBookingStartTimeStr = new Date(
        bookedTimeIsUTC
      ).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: BRAZIL_TIMEZONE,
      });

      const bookingDuration = booking.service?.duration || slotInterval;

      const [bookedStartH, bookedStartM] = localBookingStartTimeStr
        .split(":")
        .map(Number);

      let bookedEndH = bookedStartH;
      let bookedEndM = bookedStartM + bookingDuration;
      while (bookedEndM >= 60) {
        bookedEndH++;
        bookedEndM -= 60;
      }
      // Garantir que a hora não passe de 23 (embora improvável para durações normais)
      bookedEndH = bookedEndH % 24;

      const localBookingEndTimeStr = `${String(bookedEndH).padStart(
        2,
        "0"
      )}:${String(bookedEndM).padStart(2, "0")}`;

      return { start: localBookingStartTimeStr, end: localBookingEndTimeStr };
    });

    timeBlocks.forEach((block) => {
      // Converte o startTime (UTC) do bloqueio para uma string de hora local "HH:mm"
      const localBlockStartTimeStr = new Date(
        block.startTime
      ).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: BRAZIL_TIMEZONE,
      });

      // Converte o endTime (UTC) do bloqueio para uma string de hora local "HH:mm"
      const localBlockEndTimeStr = new Date(block.endTime).toLocaleTimeString(
        "pt-BR",
        {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: BRAZIL_TIMEZONE,
        }
      );

      // Adiciona o intervalo do bloqueio à lista de indisponíveis
      bookedIntervalsLocal.push({
        start: localBlockStartTimeStr,
        end: localBlockEndTimeStr,
      });
    });

    const slotsWithStatus = [];

    for (const potentialStartSlot of allLocalSlots) {
      // "09:00", "09:15", etc. (local)
      const [startSlotH, startSlotM] = potentialStartSlot
        .split(":")
        .map(Number);

      let endSlotH = startSlotH;
      let endSlotM = startSlotM + serviceDuration;
      while (endSlotM >= 60) {
        endSlotH++;
        endSlotM -= 60;
      }
      endSlotH = endSlotH % 24;
      const potentialEndSlot = `${String(endSlotH).padStart(2, "0")}:${String(
        endSlotM
      ).padStart(2, "0")}`;

      let hasConflict = false;
      for (const booked of bookedIntervalsLocal) {
        // Comparação de strings de horário "HH:mm"
        // Conflito se: (InícioSlot < FimBooked) E (FimSlot > InícioBooked)
        if (
          potentialStartSlot < booked.end &&
          potentialEndSlot > booked.start
        ) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        slotsWithStatus.push({
          time: potentialStartSlot,
          isBooked: false,
        });
      }
    }

    res.json({
      isHoliday: false,
      holidayName: null,
      slots: slotsWithStatus, // Substitua com seus horários reais
    });
  } catch (error) {
    console.error("Erro ao buscar status dos horários:", error);
    res.status(500).json({ error: "Erro interno ao processar a solicitação." });
  }
});

router.get("/bookings/barber", protectAdmin, async (req, res) => {
  try {
    const { role, barberProfileId, barbershopId } = req.adminUser; // Dados do token JWT

    let query = { barbershop: new mongoose.Types.ObjectId(barbershopId) };

    // Se a função for 'barber', adiciona o filtro para pegar apenas os agendamentos dele
    if (role === "barber") {
      if (
        !barberProfileId ||
        !mongoose.Types.ObjectId.isValid(barberProfileId)
      ) {
        return res.status(400).json({
          error: "Perfil de barbeiro inválido ou não associado a este usuário.",
        });
      }
      query.barber = new mongoose.Types.ObjectId(barberProfileId);
    }
    // Se a função for 'admin', o query buscará todos os agendamentos da barbearia

    const bookings = await Booking.find(query)
      .populate("barber", "name")
      .populate("service", "name price")
      .populate("customer", "name phone whatsapp") // Incluindo 'whatsapp' se existir
      .sort({ time: 1 }); // Ordena do mais próximo para o mais distante

    res.json(bookings);
  } catch (error) {
    console.error("Erro ao buscar agendamentos do usuário:", error);
    res.status(500).json({ error: "Erro interno ao buscar agendamentos." });
  }
});

// Rota: PUT /barbershops/:barbershopId/barbers/:barberId
router.put("/:barberId", protectAdmin, async (req, res) => {
  try {
    const { barbershopId, barberId } = req.params;

    // 1. Validação de Autorização: O admin está tentando editar um funcionário da sua própria barbearia?
    if (req.adminUser.barbershopId !== barbershopId) {
      return res.status(403).json({
        error: "Não autorizado a modificar funcionários desta barbearia.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ error: "ID do funcionário inválido." });
    }

    // 2. Validação dos Dados Recebidos
    const dataToUpdate = barberUpdateSchema.parse(req.body);

    // 3. Atualização Segura no Banco
    const updatedBarber = await Barber.findOneAndUpdate(
      { _id: barberId, barbershop: barbershopId }, // Condição garante que o barbeiro pertence à barbearia correta
      dataToUpdate, // Novos dados (nome, availability, image)
      { new: true, runValidators: true }
    );

    if (!updatedBarber) {
      return res
        .status(404)
        .json({ error: "Funcionário não encontrado nesta barbearia." });
    }

    res.json(updatedBarber);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        error: "Dados inválidos para atualização do funcionário.",
        details: e.errors,
      });
    }
    console.error("Erro ao atualizar funcionário:", e);
    res.status(500).json({ error: "Erro interno ao atualizar o funcionário." });
  }
});

// Rota: DELETE /barbershops/:barbershopId/barbers/:barberId
router.delete(
  "/:barberId",
  protectAdmin,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { barbershopId, barberId } = req.params;

      // 1. Validação de Autorização
      if (req.adminUser.barbershopId !== barbershopId) {
        return res.status(403).json({
          error: "Não autorizado a deletar funcionários desta barbearia.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(barberId)) {
        return res.status(400).json({ error: "ID do funcionário inválido." });
      }

      // Opcional: Verificar se o barbeiro tem agendamentos futuros antes de deletar
      const futureBookings = await Booking.findOne({
        barber: barberId,
        time: { $gte: new Date() },
      });

      if (futureBookings) {
        return res.status(400).json({
          error:
            "Não é possível deletar. Este funcionário possui agendamentos futuros.",
        });
      }

      // 2. Deleção Segura no Banco
      const deletedBarber = await Barber.findOneAndDelete({
        _id: barberId,
        barbershop: barbershopId, // Garante que só deleta o funcionário da barbearia correta
      });

      if (!deletedBarber) {
        return res
          .status(404)
          .json({ error: "Funcionário não encontrado nesta barbearia." });
      }

      res.json({
        message: "Funcionário deletado com sucesso.",
        barberId: deletedBarber._id,
      });
    } catch (e) {
      console.error("Erro ao deletar funcionário:", e);
      res.status(500).json({ error: "Erro interno ao deletar o funcionário." });
    }
  }
);

export default router;
