import express from "express";
import { createContact, getContacts, updateContactStatus } from "../controllers/contactController.js";
import { adminAuth } from "../middlewares/adminAuth.js";

const router = express.Router();

// Public route - anyone can submit contact form
router.post("/", createContact);

// Admin routes
router.get("/", adminAuth, getContacts);
router.put("/:id", adminAuth, updateContactStatus);

export default router;

