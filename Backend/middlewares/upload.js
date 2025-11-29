// middlewares/upload.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  // Accept images and documents
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Use memory storage if Cloudinary is configured (for streaming to Cloudinary)
// Otherwise use disk storage for local files
const storage = isCloudinaryConfigured 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
      },
    });

// Multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter
});

// Middleware to upload to Cloudinary after multer processes the file
export const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured) {
      console.log("⚠️ Cloudinary not configured, using local file paths");
      // If Cloudinary is not configured, files are already saved to disk
      // Convert file paths to URLs that can be accessed
      if (req.files) {
        // Process image files
        if (req.files.image && Array.isArray(req.files.image)) {
          for (const file of req.files.image) {
            // For local storage, path is the file path
            const filename = file.filename || path.basename(file.path);
            // Create a URL path (will be served statically by express.static)
            file.url = `/uploads/${filename}`;
            file.secure_url = file.url; // Use same for compatibility
            file.path = file.path || path.join(uploadsDir, filename);
            console.log(`📁 Local image saved: ${file.path} -> ${file.url}`);
          }
        }
        
        // Process document files
        if (req.files.documents && Array.isArray(req.files.documents)) {
          for (const file of req.files.documents) {
            const filename = file.filename || path.basename(file.path);
            file.url = `/uploads/${filename}`;
            file.secure_url = file.url;
            file.path = file.path || path.join(uploadsDir, filename);
            console.log(`📁 Local document saved: ${file.path} -> ${file.url}`);
          }
        }
      }
      return next();
    }

    // Process files and upload to Cloudinary
    if (!req.files) {
      console.log("⚠️ No files in request, skipping Cloudinary upload");
      return next();
    }
    const uploadPromises = [];
    
    // Process image files
    if (req.files.image && Array.isArray(req.files.image)) {
      console.log(`📷 Processing ${req.files.image.length} image file(s) for Cloudinary upload`);
      for (const file of req.files.image) {
        if (!file.buffer) {
          console.warn(`⚠️ Image file missing buffer:`, { filename: file.originalname, fieldname: file.fieldname });
          continue;
        }
        console.log(`📷 Uploading image to Cloudinary: ${file.originalname} (${file.buffer.length} bytes)`);
        uploadPromises.push(
            new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'campaigns/images',
                  resource_type: 'image',
                  transformation: [
                    { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
                  ]
                },
                (error, result) => {
                  if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                  } else {
                    file.secure_url = result.secure_url;
                    file.url = result.url;
                    file.public_id = result.public_id;
                    resolve(result);
                  }
                }
              );
              
              const bufferStream = new Readable();
              bufferStream.push(file.buffer);
              bufferStream.push(null);
              bufferStream.pipe(uploadStream);
            })
          );
        }
      }
    
    // Process document files
    if (req.files.documents && Array.isArray(req.files.documents)) {
      console.log(`📄 Processing ${req.files.documents.length} document file(s) for Cloudinary upload`);
      for (const file of req.files.documents) {
        if (!file.buffer) {
          console.warn(`⚠️ Document file missing buffer:`, { filename: file.originalname, fieldname: file.fieldname });
          continue;
        }
        console.log(`📄 Uploading document to Cloudinary: ${file.originalname} (${file.buffer.length} bytes)`);
        uploadPromises.push(
            new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: 'campaigns/documents',
                  resource_type: 'auto',
                },
                (error, result) => {
                  if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                  } else {
                    file.secure_url = result.secure_url;
                    file.url = result.url;
                    file.public_id = result.public_id;
                    resolve(result);
                  }
                }
              );
              
              const bufferStream = new Readable();
              bufferStream.push(file.buffer);
              bufferStream.push(null);
              bufferStream.pipe(uploadStream);
            })
          );
        }
      }
    
    if (uploadPromises.length === 0) {
      console.log("⚠️ No files to upload to Cloudinary (no buffers found)");
      return next();
    }

    try {
      await Promise.all(uploadPromises);
      console.log('✅ All files uploaded to Cloudinary successfully');
    } catch (error) {
      console.error('❌ Error uploading files to Cloudinary:', error);
      console.error('❌ Error details:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload files to Cloudinary',
        error: error.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Error in uploadToCloudinary middleware:', error);
    console.error('❌ Error details:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'File processing error',
      error: error.message || 'Unknown error'
    });
  }
  
  next();
};

// Export multer instance
export default upload;
