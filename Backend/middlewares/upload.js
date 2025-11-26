// middlewares/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

// Check Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("⚠️ Cloudinary credentials missing! File uploads may fail.");
}

/**
 * Multer + Cloudinary storage setup
 * We ensure that the final req.files entries provide secure_url values.
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    console.log(`📤 Uploading file: ${file.originalname}, type: ${file.mimetype}`);
    return {
      folder: "fundraiser",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
    };
  },
});

// Multer instance using cloudinary storage
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export default upload;
