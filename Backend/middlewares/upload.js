// middlewares/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/**
 * Multer + Cloudinary storage setup
 * We ensure that the final req.files entries provide secure_url values.
 */
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "fundraiser",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
  }),
});

// Multer instance using cloudinary storage
const upload = multer({ storage });

export default upload;
