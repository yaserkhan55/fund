import { Webhook } from "svix";
import ClerkProfile from "../models/ClerkProfile.js";
import User from "../models/User.js";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

const extractEmail = (data) => {
  const emailId = data.primary_email_address_id;
  const list = data.email_addresses || [];
  const primary = list.find((entry) => entry.id === emailId);
  const fallback = list[0];
  return (primary?.email_address || fallback?.email_address || "").toLowerCase();
};

const extractName = (data) => {
  if (data.first_name || data.last_name) {
    return `${data.first_name || ""} ${data.last_name || ""}`.trim();
  }
  return data.username || extractEmail(data).split("@")[0] || "User";
};

const upsertMongoUser = async (data) => {
  const clerkId = data.id;
  const email = extractEmail(data) || `${clerkId}@clerk-user.com`;
  const name = extractName(data);
  const picture = data.image_url || "";

  let user = await User.findOne({
    $or: [{ clerkId }, { email }],
  });

  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    user.clerkId = clerkId;
    user.picture = picture || user.picture;
    user.provider = "clerk";
    await user.save();
  } else {
    user = await User.create({
      name,
      email,
      clerkId,
      picture,
      provider: "clerk",
      password: "clerk-auth",
      role: "user",
    });
  }

  return user;
};

const upsertClerkProfile = async (data) => {
  const clerkId = data.id;
  const payload = {
    clerkId,
    email: extractEmail(data),
    firstName: data.first_name || "",
    lastName: data.last_name || "",
    username: data.username || "",
    imageUrl: data.image_url || "",
    phoneNumbers: (data.phone_numbers || []).map((p) => p.phone_number),
    primaryEmailId: data.primary_email_address_id || "",
    status: data.deleted ? "deleted" : "active",
    lastSyncedAt: new Date(),
    raw: data,
    deletedAt: data.deleted ? new Date() : null,
  };

  const profile = await ClerkProfile.findOneAndUpdate(
    { clerkId },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return profile;
};

export const handleClerkWebhook = async (req, res) => {
  if (!webhookSecret) {
    return res
      .status(500)
      .json({ success: false, message: "Missing Clerk webhook secret" });
  }

  const svixId = req.headers["svix-id"];
  const svixTimestamp = req.headers["svix-timestamp"];
  const svixSignature = req.headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res
      .status(400)
      .json({ success: false, message: "Missing Svix headers" });
  }

  const payload = req.body instanceof Buffer ? req.body.toString() : req.body;

  let event;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("❌ Clerk webhook verification failed:", err.message);
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const { type, data } = event;

  try {
    if (type === "user.created" || type === "user.updated") {
      await upsertClerkProfile(data);
      const user = await upsertMongoUser(data);
      console.log(`✅ Synced Clerk user ${user.email} (${user._id})`);
    } else if (type === "user.deleted") {
      await ClerkProfile.findOneAndUpdate(
        { clerkId: data.id },
        { status: "deleted", deletedAt: new Date(), raw: data }
      );

      await User.findOneAndUpdate(
        { clerkId: data.id },
        { clerkId: null }
      );

      console.log(`🗑️ Clerk user deleted: ${data.id}`);
    } else {
      console.log(`ℹ️ Ignored Clerk event: ${type}`);
    }
  } catch (err) {
    console.error("❌ Error processing Clerk webhook:", err);
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }

  return res.json({ success: true });
};

