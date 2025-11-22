// scripts/migrateImages.js
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Campaign from "../models/Campaign.js";

async function migrate() {
  try {
    await connectDB();
    const base = process.env.BASE_URL || "";

    const campaigns = await Campaign.find({});
    for (const c of campaigns) {
      let changed = false;
      if (c.image && typeof c.image === "string") {
        const s = c.image;
        if (!s.startsWith("http") && base) {
          c.image = `${base.replace(/\/$/, "")}/${s.replace(/^\/+/, "")}`;
          changed = true;
        } else if (s.startsWith("http://")) {
          c.image = s.replace(/^http:\/\//, "https://");
          changed = true;
        }
      }
      if (changed) {
        await c.save();
        console.log("Updated:", c._id);
      }
    }

    console.log("Migration complete");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
