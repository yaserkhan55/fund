import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../middlewares/auth.js";
import Fundraiser from "../models/Fundraiser.js";
import fs from "fs";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/fundraisers";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${path.extname(file.originalname)}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Create draft
router.post("/draft", protect, async (req, res) => {
  try {
    const f = new Fundraiser({ createdBy: req.user.id });
    await f.save();
    res.json({ success: true, fundraiser: f });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const f = await Fundraiser.findById(req.params.id);
    if (!f) return res.status(404).json({ message: "Not found" });

    if (f.createdBy.toString() !== req.user.id && f.status !== "published") {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(f);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update draft
router.put("/update/:id", protect, async (req, res) => {
  try {
    const f = await Fundraiser.findById(req.params.id);

    if (!f) return res.status(404).json({ message: "Not found" });
    if (f.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    Object.keys(req.body).forEach((k) => {
      if (
        typeof req.body[k] === "object" &&
        !Array.isArray(req.body[k]) &&
        req.body[k] !== null
      ) {
        f[k] = { ...f[k], ...req.body[k] };
      } else {
        f[k] = req.body[k];
      }
    });

    await f.save();
    res.json({ success: true, fundraiser: f });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Upload images/docs
router.post(
  "/upload/:id",
  protect,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "gallery", maxCount: 6 },
    { name: "pan", maxCount: 1 },
    { name: "cheque", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const f = await Fundraiser.findById(req.params.id);
      if (!f) return res.status(404).json({ message: "Not found" });
      if (f.createdBy.toString() !== req.user.id)
        return res.status(403).json({ message: "Forbidden" });

      if (req.files.cover) f.coverImage = req.files.cover[0].path;
      if (req.files.gallery)
        f.gallery = (f.gallery || []).concat(
          req.files.gallery.map((x) => x.path)
        );
      if (req.files.pan)
        f.payout.panFile = req.files.pan[0].path;
      if (req.files.cheque)
        f.payout.cancelledCheque = req.files.cheque[0].path;

      await f.save();
      res.json({ success: true, fundraiser: f });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

export default router;
