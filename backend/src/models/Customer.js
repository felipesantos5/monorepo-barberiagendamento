import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "O nome do cliente é obrigatório."],
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    phone: {
      type: String,
      required: [true, "O telefone do cliente é obrigatório."],
      unique: true, // Garante que não haverá dois clientes com o mesmo telefone
      trim: true,
    },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking", // Array de referências para os agendamentos deste cliente
      },
    ],
    otpCode: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    subscriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subscription",
      },
    ],
  },
  {
    timestamps: true, // Adiciona campos createdAt e updatedAt automaticamente
  }
);

customerSchema.methods.getOtp = function () {
  const otp = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

  this.otpExpires = Date.now() + 10 * 60 * 1000;

  this.otpCode = bcrypt.hashSync(otp, 10);

  return otp;
};

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
