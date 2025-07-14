import express from "express";
import Barbershop from "../models/Barbershop.js";
import { BarbershopSchema as BarbershopValidationSchema, BarbershopUpdateSchema } from "../validations/barbershopValidation.js"; // Renomeado para evitar conflito com o modelo Mongoose
import { requireRole } from "../middleware/authAdminMiddleware.js";
import { protectAdmin } from "../middleware/authAdminMiddleware.js";
import qrcode from "qrcode";

const router = express.Router();

// CRIAÇÃO
router.post("/", async (req, res) => {
  try {
    const data = BarbershopValidationSchema.parse(req.body);
    const created = await Barbershop.create(data);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.errors || e.message });
  }
});

// LISTAR TODAS
router.get("/", async (_req, res) => {
  res.json(await Barbershop.find());
});

// ROTA POR SLUG
router.get("/slug/:slug", async (req, res) => {
  try {
    const barbershop = await Barbershop.findOne({ slug: req.params.slug });
    if (!barbershop) {
      return res.status(404).json({ error: "Barbearia não encontrada" });
    }
    res.json(barbershop);
  } catch (e) {
    res.status(400).json({ error: "Erro na busca pela barbearia" });
  }
});

// LISTAR POR ID
router.get("/:id", async (req, res) => {
  try {
    const barbershop = await Barbershop.findById(req.params.id);
    if (!barbershop) {
      return res.status(404).json({ error: "Barbearia não encontrada" });
    }
    res.json(barbershop);
  } catch (e) {
    res.status(400).json({ error: "ID inválido" });
  }
});

// EDITAR (PUT)
router.put("/:id", protectAdmin, requireRole("admin"), async (req, res) => {
  try {
    const data = BarbershopUpdateSchema.parse(req.body);
    const updated = await Barbershop.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ error: "Barbearia não encontrada" });
    }
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.errors || e.message });
  }
});

// DELETAR POR ID
router.delete("/:id", protectAdmin, requireRole("admin"), async (req, res) => {
  try {
    const deleted = await Barbershop.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Barbearia não encontrada" });
    }
    res.json({ message: "Barbearia removida com sucesso" });
  } catch (e) {
    res.status(400).json({ error: "ID inválido" });
  }
});

router.get("/:barbershopId/location", async (req, res) => {
  try {
    const { barbershopId } = req.params;

    // 1. Busca a barbearia pelo ID
    const barbershop = await Barbershop.findById(barbershopId);
    if (!barbershop) {
      return res.status(404).send("Barbearia não encontrada.");
    }

    // 2. Monta o endereço completo a partir dos dados do banco
    const { rua, numero, bairro, cidade, estado } = barbershop.address;
    const fullAddress = `${rua}, ${numero}, ${bairro}, ${cidade}, ${estado}`;

    // 3. Cria o link do Google Maps
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

    // 4. Redireciona o usuário para o Google Maps
    res.redirect(302, googleMapsLink);
  } catch (error) {
    console.error("Erro ao redirecionar para localização:", error);
    res.status(500).send("Erro ao processar sua solicitação.");
  }
});

router.get("/:barbershopId/qrcode", async (req, res) => {
  try {
    const { barbershopId } = req.params;

    // Busca a barbearia para obter o slug
    const barbershop = await Barbershop.findById(barbershopId).lean();

    if (!barbershop) {
      return res.status(404).json({ error: "Barbearia não encontrada." });
    }

    // Monta a URL que será embutida no QR Code
    const urlToEncode = `https://www.barbeariagendamento.com.br/${barbershop.slug}`;

    // Gera o QR Code como um buffer de imagem PNG
    const qrCodeBuffer = await qrcode.toBuffer(urlToEncode, {
      type: "png",
      errorCorrectionLevel: "H", // Alta correção de erros, bom para impressão
      margin: 2,
      color: {
        dark: "#000000", // Cor dos pontos
        light: "#FFFFFF", // Cor do fundo
      },
    });

    // Envia a imagem diretamente como resposta da API
    res.setHeader("Content-Type", "image/png");
    res.send(qrCodeBuffer);
  } catch (error) {
    console.error("Erro ao gerar QR Code:", error);
    res.status(500).json({ error: "Falha ao gerar QR Code." });
  }
});

export default router;
