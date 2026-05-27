import pkg        from "multer-storage-cloudinary";
import cloudinary from "./cloudnary.js";
import multer     from "multer";

const { CloudinaryStorage } = pkg;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "userImages",
   //  allowed_formats: ["jpg", "png", "jpeg", "webp"],
       resource_type:  "auto", // auto-detect image, video, raw, etc.

    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }], // auto-crop to square avatar
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const uplode = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});