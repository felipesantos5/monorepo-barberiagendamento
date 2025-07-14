// src/models/Barbershop.ts
import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  cep: { type: String, required: true },
  estado: { type: String, required: true },
  cidade: { type: String, required: true },
  bairro: { type: String, required: true },
  rua: { type: String, required: true },
  numero: { type: String, required: true },
  complemento: { type: String },
});

const BarbershopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    address: { type: AddressSchema, required: true },
    logoUrl: { type: String },
    contact: { type: String },
    instagram: { type: String },
    slug: { type: String, required: true, unique: true },
    workingHours: [
      {
        day: { type: String, required: true },
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
    themeColor: {
      type: String,
      trim: true,
      uppercase: true, // Opcional: armazenar sempre em maiúsculas
      match: [/^#[0-9A-F]{6}$/i, "Formato de cor inválido (ex: #RRGGBB)"], // Validação básica de formato HEX
      default: "#D10000", // Uma cor padrão, ex: um vermelho/vinho (ajuste conforme sua preferência)
    },
    LogoBackgroundColor: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^#[0-9A-F]{6}$/i, "Formato de cor inválido (ex: #RRGGBB)"],
      default: "#000000",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Barbershop", BarbershopSchema);
