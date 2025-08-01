import express from "express";
import Customer from "../../models/Customer.js";
import Plan from "../../models/Plan.js";
import Booking from "../../models/Booking.js";
import Subscription from "../../models/Subscription.js";
import {
  protectAdmin,
  requireRole,
} from "../../middleware/authAdminMiddleware.js";
import { addDays } from "date-fns";

const router = express.Router({ mergeParams: true });
router.use(protectAdmin, requireRole("admin"));

// ROTA PARA LISTAR TODOS OS CLIENTES DA BARBEARIA
// GET /api/barbershops/:barbershopId/admin/customers
router.get("/", async (req, res) => {
  try {
    const { barbershopId } = req.params;

    // 1. Busca os clientes que têm agendamentos na barbearia
    const customersWithBookings = await Booking.distinct("customer", {
      barbershop: barbershopId,
    });

    // 2. Busca os detalhes completos desses clientes, já populando as assinaturas e os planos
    const customers = await Customer.find({
      _id: { $in: customersWithBookings },
    }).populate({
      path: "subscriptions", // Popula as assinaturas do cliente
      match: { status: "active" }, // Traz apenas as assinaturas ATIVAS
      populate: {
        path: "plan", // Dentro da assinatura, popula os detalhes do plano
        select: "name", // Traz apenas o nome do plano
      },
    });

    res.status(200).json(customers);
  } catch (error) {
    console.error("Erro ao listar clientes:", error);
    res.status(500).json({ error: "Erro ao listar clientes." });
  }
});

// ROTA PARA ATRELAR UM PLANO A UM CLIENTE
// POST /api/barbershops/:barbershopId/admin/customers/:customerId/subscribe
router.post("/:customerId/subscribe", async (req, res) => {
  try {
    const { barbershopId, customerId } = req.params;
    const { planId } = req.body;

    const [customer, plan] = await Promise.all([
      Customer.findById(customerId),
      Plan.findById(planId),
    ]);

    if (!customer || !plan) {
      return res
        .status(404)
        .json({ error: "Cliente ou plano não encontrado." });
    }

    const startDate = new Date();
    const endDate = addDays(startDate, plan.durationInDays);

    const newSubscription = await Subscription.create({
      customer: customerId,
      plan: planId,
      barbershop: barbershopId,
      startDate,
      endDate,
      status: "active",
    });

    // Adiciona a referência da nova assinatura ao cliente
    customer.subscriptions.push(newSubscription._id);
    await customer.save();

    res.status(201).json(newSubscription);
  } catch (error) {
    console.error("Erro ao inscrever cliente no plano:", error);
    res.status(500).json({ error: "Falha ao atrelar o plano." });
  }
});

export default router;
