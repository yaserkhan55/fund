import Contact from "../models/Contact.js";
import User from "../models/User.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, query } = req.body;

    if (!name || !query) {
      return res.status(400).json({
        success: false,
        message: "Name and query are required",
      });
    }

    // Email is now required
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required to receive notifications",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Try to get user info if authenticated
    let userId = null;
    let clerkId = null;
    
    if (req.auth?.userId) {
      clerkId = req.auth.userId;
      // Try to find user by clerkId
      try {
        const user = await User.findOne({ clerkId: req.auth.userId });
        if (user) {
          userId = user._id;
        }
      } catch (err) {
        console.log("Could not find user by clerkId:", err.message);
      }
    }

    // Also try to find user by email if not found by clerkId
    if (!userId && email) {
      try {
        const userByEmail = await User.findOne({ 
          email: { $regex: new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (userByEmail) {
          userId = userByEmail._id;
          clerkId = userByEmail.clerkId || clerkId;
        }
      } catch (err) {
        console.log("Could not find user by email:", err.message);
      }
    }

    const contact = await Contact.create({
      name,
      email: email.trim().toLowerCase(), // Store email in lowercase for consistent matching
      query,
      userId: userId,
      clerkId: clerkId,
    });

    console.log(`[Contact Created] Contact ${contact._id} created with email: ${contact.email}, userId: ${userId}, clerkId: ${clerkId}`);

    res.status(201).json({
      success: true,
      message: "Your message has been sent. We'll get back to you soon.",
      contact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

export const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { query: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("respondedBy", "name email");

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contacts",
    });
  }
};

export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse, message, priority, tags } = req.body;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Try to find and update user info if contact has email but no userId/clerkId
    if (contact.email && (!contact.userId || !contact.clerkId)) {
      try {
        const user = await User.findOne({ 
          $or: [
            { email: { $regex: new RegExp(`^${contact.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } },
            { email: contact.email.toLowerCase() }
          ]
        });
        
        if (user) {
          contact.userId = user._id;
          contact.clerkId = user.clerkId || contact.clerkId;
          console.log(`[Contact Update] Updated contact ${contact._id} with user info: userId=${user._id}, clerkId=${user.clerkId}`);
        }
      } catch (err) {
        console.error(`[Contact Update] Error finding user for contact:`, err);
      }
    }

    // Update status
    if (status) {
      contact.status = status;
    }

    // Add admin response to conversation thread
    if (message || adminResponse) {
      const responseMessage = message || adminResponse;
      
      contact.conversation = contact.conversation || [];
      contact.conversation.push({
        sender: "admin",
        message: responseMessage,
        createdAt: new Date(),
        sentBy: req.admin?.id || req.user?._id,
      });
      contact.adminResponse = responseMessage;
      contact.respondedAt = new Date();
      contact.respondedBy = req.admin?.id || req.user?._id;
      contact.lastNotificationAt = new Date();
      contact.notificationSent = false;
      
      console.log(`[Contact Update] Admin reply added to contact ${id}. Email: ${contact.email}, userId: ${contact.userId}, clerkId: ${contact.clerkId}`);
    }

    // Update priority
    if (priority) {
      contact.priority = priority;
    }

    // Update tags
    if (tags && Array.isArray(tags)) {
      contact.tags = tags;
    }

    await contact.save();

    const updated = await Contact.findById(id)
      .populate("respondedBy", "name email")
      .populate("conversation.sentBy", "name email");

    res.json({
      success: true,
      message: "Contact updated successfully",
      contact: updated,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update contact",
    });
  }
};

// Get single contact with full conversation
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id)
      .populate("respondedBy", "name email")
      .populate("conversation.sentBy", "name email");

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch contact",
    });
  }
};

// Add admin reply to conversation
export const addAdminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // Try to find and update user info if contact has email but no userId/clerkId
    if (contact.email && (!contact.userId || !contact.clerkId)) {
      try {
        const contactEmail = contact.email.toLowerCase().trim();
        const user = await User.findOne({ 
          $or: [
            { email: { $regex: new RegExp(`^${contactEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } },
            { email: contactEmail }
          ]
        });
        
        if (user) {
          contact.userId = user._id;
          contact.clerkId = user.clerkId || contact.clerkId;
          console.log(`[Contact Reply] ✅ Updated contact ${id} with user info: userId=${user._id}, clerkId=${user.clerkId}, email=${contactEmail}`);
        } else {
          console.log(`[Contact Reply] ⚠️ No user found for contact email: ${contactEmail}`);
        }
      } catch (err) {
        console.error(`[Contact Reply] Error finding user for contact:`, err);
      }
    }
    
    console.log(`[Contact Reply] Contact before save - email: ${contact.email}, userId: ${contact.userId}, clerkId: ${contact.clerkId}`);

    contact.conversation = contact.conversation || [];
    const newMessage = {
      sender: "admin",
      message: message.trim(),
      attachments: attachments || [],
      createdAt: new Date(),
      sentBy: req.admin?.id || req.user?._id,
    };
    contact.conversation.push(newMessage);

    // Update status if it was pending
    if (contact.status === "pending") {
      contact.status = "resolved";
    }

    contact.respondedAt = new Date();
    contact.respondedBy = req.admin?.id || req.user?._id;
    contact.lastNotificationAt = new Date();
    contact.notificationSent = false; // Will be sent via notification system

    await contact.save();
    
    // Verify the save worked
    const savedContact = await Contact.findById(id).lean();
    const adminMsgCount = savedContact.conversation?.filter(m => m.sender === "admin").length || 0;
    
    console.log(`[Contact Reply] ========== ADMIN REPLY SAVED ==========`);
    console.log(`[Contact Reply] Contact ID: ${id}`);
    console.log(`[Contact Reply] Contact email: ${savedContact.email}`);
    console.log(`[Contact Reply] Contact userId: ${savedContact.userId}`);
    console.log(`[Contact Reply] Contact clerkId: ${savedContact.clerkId}`);
    console.log(`[Contact Reply] Message: "${message.trim().substring(0, 50)}..."`);
    console.log(`[Contact Reply] Total conversation messages: ${savedContact.conversation?.length || 0}`);
    console.log(`[Contact Reply] Admin messages in conversation: ${adminMsgCount}`);
    console.log(`[Contact Reply] Latest admin message createdAt: ${savedContact.conversation?.filter(m => m.sender === "admin").pop()?.createdAt}`);
    console.log(`[Contact Reply] ======================================`);

    const updated = await Contact.findById(id)
      .populate("respondedBy", "name email")
      .populate("conversation.sentBy", "name email");

    res.json({
      success: true,
      message: "Reply added successfully",
      contact: updated,
    });
  } catch (error) {
    console.error("Error adding admin reply:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add reply",
    });
  }
};

