// controllers/campaignController.js
import Campaign from "../models/Campaign.js";
import User from "../models/User.js";
import { notifyOwner } from "../utils/notifyOwner.js";
import { clerkClient } from "@clerk/express";
import mongoose from "mongoose";

/* =====================================================
   ADMIN: GET ALL CAMPAIGNS
===================================================== */
export const adminGetAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: GET ONLY APPROVED CAMPAIGNS (Homepage)
===================================================== */
export const getApprovedCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: "approved" })
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: GET ALL CAMPAIGNS
===================================================== */
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   PUBLIC: SINGLE CAMPAIGN
===================================================== */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found"
      });
    }

    res.json({ success: true, campaign });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   USER'S OWN CAMPAIGNS (Clerk user)
===================================================== */
export const getMyCampaigns = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Prefer MongoDB user provided by sync middleware
    let mongoUser = req.mongoUser;

    if (!mongoUser) {
      mongoUser = await User.findOne({ clerkId: clerkUserId });
    }
    
    if (!mongoUser) {
      console.log(`⚠️ No MongoDB user found for Clerk ID: ${clerkUserId}`);
      return res.json({ success: true, campaigns: [] });
    }

    const mongoUserId = mongoUser._id.toString();

    const campaigns = await Campaign.find({
      $or: [
        { owner: mongoUserId },
        { owner: mongoUser._id },
        { createdBy: mongoUserId }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

    console.log(`Found ${campaigns.length} campaigns for user ${mongoUser.email} (MongoDB ID: ${mongoUserId}, Clerk ID: ${clerkUserId})`);
    
    // Log campaigns with infoRequests for debugging
    const campaignsWithRequests = campaigns.filter(c => c.infoRequests && c.infoRequests.length > 0);
    if (campaignsWithRequests.length > 0) {
      console.log(`Found ${campaignsWithRequests.length} campaigns with infoRequests`);
      campaignsWithRequests.forEach(c => {
        console.log(`Campaign ${c.title} has ${c.infoRequests.length} requests`);
      });
    }

    res.json({ success: true, campaigns });

  } catch (error) {
    console.error("Error in getMyCampaigns:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================================
   CREATE CAMPAIGN
===================================================== */
export const createCampaign = async (req, res) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Ensure user exists in MongoDB (sync Clerk user)
    let mongoUser = req.mongoUser;

    if (!mongoUser) {
      mongoUser = await User.findOne({ 
        $or: [
          { clerkId: clerkUserId },
          { email: req.auth?.sessionClaims?.email }
        ]
      });
    }

    if (!mongoUser) {
      try {
        // Fetch user details from Clerk
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                     req.auth?.sessionClaims?.email || 
                     `${clerkUserId}@clerk-user.com`;
        
        const name = clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || 
            clerkUser.username || 
            email.split('@')[0] ||
            "User";

        // Check if email already exists
        const existingByEmail = await User.findOne({ email: email.toLowerCase() });
        
        if (existingByEmail) {
          existingByEmail.clerkId = clerkUserId;
          existingByEmail.picture = clerkUser.imageUrl || existingByEmail.picture;
          await existingByEmail.save();
          mongoUser = existingByEmail;
          console.log(`✅ Synced existing user with Clerk ID: ${email}`);
        } else {
          mongoUser = await User.create({
            name,
            email: email.toLowerCase(),
            clerkId: clerkUserId,
            picture: clerkUser.imageUrl || "",
            provider: "clerk",
            password: "clerk-auth",
            role: "user"
          });
          console.log(`✅ Created new MongoDB user from Clerk: ${email} (ID: ${mongoUser._id})`);
        }
      } catch (clerkError) {
        console.error("Error syncing Clerk user:", clerkError);
        // Fallback: create minimal user
        const email = req.auth?.sessionClaims?.email || `${clerkUserId}@clerk-user.com`;
        mongoUser = await User.create({
          name: "User",
          email: email.toLowerCase(),
          clerkId: clerkUserId,
          provider: "clerk",
          password: "clerk-auth",
          role: "user"
        });
        console.log(`✅ Created fallback MongoDB user for Clerk ID: ${clerkUserId}`);
      }
    }

    // Use MongoDB ObjectId directly (not string)
    const userId = mongoUser._id;

    const {
      title,
      shortDescription,
      fullStory,
      goalAmount,
      category,
      beneficiaryName,
      city,
      relation,
      zakatEligible,
      educationQualification,
      employmentStatus,
      duration
    } = req.body;

    // Validate required fields
    if (!title || !shortDescription || !fullStory || !goalAmount || !beneficiaryName || !city || !relation) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, shortDescription, fullStory, goalAmount, beneficiaryName, city, and relation are required."
      });
    }

    // Set default category if missing
    const finalCategory = category || "medical";

    const image = req.files?.image?.length
      ? req.files.image[0].path
      : null;

    const documents = req.files?.documents?.map((doc) => doc.path) || [];

    if (!documents.length) {
      return res.status(400).json({
        success: false,
        message: "At least one medical document is required.",
      });
    }

    // Ensure status is explicitly set and owner is ObjectId
    const campaignData = {
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullStory: fullStory.trim(),
      goalAmount: Number(goalAmount),
      category: finalCategory,
      beneficiaryName: beneficiaryName.trim(),
      city: city.trim(),
      relation: relation.trim(),
      zakatEligible: zakatEligible === "true" || zakatEligible === true,
      educationQualification: educationQualification || "",
      employmentStatus: employmentStatus || "",
      duration: duration ? Number(duration) : null,
      image,
      documents,
      owner: userId, // MongoDB ObjectId (not string)
      status: "pending", // Explicitly set to pending
      isApproved: false // Explicitly set to false
    };

    console.log(`📝 Creating campaign with data:`, {
      title: campaignData.title,
      owner: campaignData.owner,
      ownerType: typeof campaignData.owner,
      ownerIsObjectId: campaignData.owner instanceof mongoose.Types.ObjectId,
      status: campaignData.status,
      isApproved: campaignData.isApproved,
      userEmail: mongoUser.email,
      userName: mongoUser.name
    });

    const campaign = await Campaign.create(campaignData);

    // Verify campaign was created correctly by fetching it fresh from DB
    const verifyCampaign = await Campaign.findById(campaign._id)
      .populate("owner", "name email clerkId provider")
      .lean();
    
    if (!verifyCampaign) {
      console.error(`❌ Campaign creation failed - campaign not found after creation!`);
      return res.status(500).json({
        success: false,
        message: "Campaign creation failed - verification error"
      });
    }

    console.log(`✅ New campaign created: ${campaign._id} - ${campaign.title}`);
    console.log(`   Owner (MongoDB ID): ${userId}`);
    console.log(`   Owner (Clerk ID): ${clerkUserId}`);
    console.log(`   Status: ${verifyCampaign.status}, isApproved: ${verifyCampaign.isApproved}`);
    console.log(`   User Email: ${mongoUser.email}, User Name: ${mongoUser.name}`);
    console.log(`   Campaign verified in DB: Status=${verifyCampaign.status}, isApproved=${verifyCampaign.isApproved}`);
    console.log(`   Owner populated: ${verifyCampaign.owner ? 'Yes' : 'No'}`);

    await notifyOwner({
      ownerId: userId,
      overrideName: campaign?.beneficiaryName,
    });

    res.json({ success: true, campaign });

  } catch (error) {
    console.error("❌ Error creating campaign:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("Request files:", req.files);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to create campaign",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

