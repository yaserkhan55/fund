import express from "express";
import { 
  createContact, 
  getContacts, 
  updateContactStatus,
  getContactById,
  addAdminReply
} from "../controllers/contactController.js";
import { adminAuth } from "../middlewares/adminAuth.js";
import { clerkMiddleware } from "@clerk/express";

const router = express.Router();

// Public route - anyone can submit contact form (but we'll try to get user info if available)
router.post("/", clerkMiddleware(), createContact);

// Admin routes
router.get("/", adminAuth, getContacts);
router.get("/:id", adminAuth, getContactById);
router.put("/:id", adminAuth, updateContactStatus);
router.post("/:id/reply", adminAuth, addAdminReply);

export default router;

