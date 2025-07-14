import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import { sendWhatsAppConfirmation } from "../services/evolutionWhatsapp.js";

const router = express.Router();

// ROTA: POST /api/auth/customer/request-otp
// O cliente solicita um código de acesso
router.post("/request-otp", async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      return res
        .status(400)
        .json({ error: "O número de telefone é obrigatório." });
    }

    // Encontra ou cria o cliente
    const customer = await Customer.findOneAndUpdate(
      { phone },
      { $set: { phone, name: name || "Cliente" } }, // Atualiza o nome se fornecido
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Gera o OTP (o método já hasheia e define a expiração internamente)
    const otpToSend = customer.getOtp();
    await customer.save();

    // Envia o OTP via WhatsApp
    const message = `Olá! Seu código de acesso para a BarbeariAgendamento é: *${otpToSend}*`;
    await sendWhatsAppConfirmation(phone, message);

    console.log(`OTP para ${phone}: ${otpToSend}`); // Para teste em desenvolvimento

    res.status(200).json({
      success: true,
      message: "Código de acesso enviado para seu WhatsApp.",
    });
  } catch (error) {
    console.error("Erro ao solicitar OTP:", error);
    res.status(500).json({ error: "Erro interno ao solicitar código." });
  }
});

// ROTA: POST /api/auth/customer/verify-otp
// O cliente envia o código para fazer o login
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res
        .status(400)
        .json({ error: "Telefone e código são obrigatórios." });
    }

    // Encontra o cliente e verifica se o token não expirou
    const customer = await Customer.findOne({
      phone,
      otpExpires: { $gt: Date.now() }, // $gt = greater than (maior que agora)
    });

    if (!customer) {
      return res
        .status(401)
        .json({ error: "Código inválido ou expirado. Tente novamente." });
    }

    // Compara o código enviado com o código hasheado no banco
    const isMatch = await bcrypt.compare(otp, customer.otpCode);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "Código inválido ou expirado. Tente novamente." });
    }

    // Limpa o OTP do banco para que não possa ser usado novamente
    customer.otpCode = undefined;
    customer.otpExpires = undefined;
    await customer.save();

    // Cria o token de acesso JWT para o cliente
    const payload = { id: customer._id, type: "customer" };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "90d", // Token de longa duração, como solicitado
    });

    res.status(200).json({
      success: true,
      message: "Login realizado com sucesso!",
      token,
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar OTP:", error);
    res.status(500).json({ error: "Erro interno ao verificar o código." });
  }
});

export default router;
