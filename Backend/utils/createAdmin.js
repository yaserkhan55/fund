import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

const createAdmin = async () => {
  const exists = await Admin.findOne({ email: "admin@gmail.com" });

  if (exists) {
    console.log("Admin already exists");
    return process.exit();
  }

  const hashed = await bcrypt.hash("123456", 10);

  await Admin.create({
    name: "Super Admin",
    email: "admin@gmail.com",
    password: hashed,
    role: "admin",
  });

  console.log("Admin created:");
  console.log("Email: admin@gmail.com");
  console.log("Password: 123456");

  process.exit();
};

createAdmin();
