import { z } from "zod";

const barberBaseSchema = z.object({
  name: z.string().min(2, "Nome do funcionário é obrigatório"),
  image: z.string().url("URL da imagem inválida").optional().or(z.literal("")),
  availability: z
    .array(
      z.object({
        day: z.string().min(3, "Dia da semana inválido"),
        start: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora deve ser HH:mm"),
        end: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora deve ser HH:mm"),
      })
    )
    .optional(), // Disponibilidade pode ser opcional ao criar/editar
  commission: z.number().min(0).max(100).optional().default(0),
});

export const barberCreationSchema = barberBaseSchema.extend({
  email: z.string().email({ message: "Formato de email inválido." }),
  // Se você também envia a senha inicial no mesmo payload, adicione aqui:
  // password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export const barberUpdateSchema = barberBaseSchema;
