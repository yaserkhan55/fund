import Contact from "../models/Contact.js";

export const createContact = async (req, res) => {
  try {
    const { name, email, query } = req.body;

    if (!name || !query) {
      return res.status(400).json({
        success: false,
        message: "Name and query are required",
      });
    }

    const contact = await Contact.create({
      name,
      email: email || "",
      query,
    });

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
    const { status, adminResponse } = req.body;

    const updateData = { status };
    if (adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = new Date();
      updateData.respondedBy = req.user._id;
    }

    const contact = await Contact.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("respondedBy", "name email");

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.json({
      success: true,
      message: "Contact updated successfully",
      contact,
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update contact",
    });
  }
};

