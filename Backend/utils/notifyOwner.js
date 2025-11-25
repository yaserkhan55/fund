import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { sendSms } from "./sendSms.js";

const DEFAULT_MESSAGE = "hey {name} thanks for visit on SEUMP";

const isMongoId = (value) => /^[0-9a-fA-F]{24}$/.test(value);

const resolveOwnerContact = async (ownerId) => {
  if (!ownerId) return null;

  const id = ownerId.toString();

  // First try Clerk user lookup (non ObjectId identifiers)
  if (!isMongoId(id)) {
    try {
      const clerkUser = await clerkClient.users.getUser(id);
      const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber || null;
      const name =
        clerkUser?.firstName ||
        clerkUser?.username ||
        clerkUser?.emailAddresses?.[0]?.emailAddress ||
        "there";
      if (phone) {
        return { phone, name };
      }
    } catch (error) {
      // Intentionally swallow error; fallback to local user document
      console.warn("Clerk lookup failed for owner", id, error.message || error);
    }
  }

  try {
    const user = await User.findById(id).lean();
    if (!user || !user.phone) return null;
    return { phone: user.phone, name: user.name || user.email || "there" };
  } catch (error) {
    return null;
  }
};

export const notifyOwner = async ({
  ownerId,
  overrideName,
  message = DEFAULT_MESSAGE,
}) => {
  try {
    const contact = await resolveOwnerContact(ownerId);
    if (!contact?.phone) return;

    const finalMessage = message.replace(
      "{name}",
      overrideName || contact.name || "there"
    );

    await sendSms(contact.phone, finalMessage);
  } catch (error) {
    console.error("Owner notification error:", error.message || error);
  }
};


