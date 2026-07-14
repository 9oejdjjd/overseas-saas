const { v2: cloudinary } = require("cloudinary");
const path = require("path");
const dotenv = require("dotenv");

// Load .env from the project root
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const logoPath = path.join(__dirname, "..", "public", "logo1.png");

console.log("Uploading logo from:", logoPath);
console.log("Using Cloudinary credentials:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY
});

cloudinary.uploader.upload(
    logoPath,
    { public_id: "brand_logo" },
    (error, result) => {
        if (error) {
            console.error("Upload failed:", error);
            process.exit(1);
        } else {
            console.log("Upload successful!");
            console.log("Secure URL:", result.secure_url);
            process.exit(0);
        }
    }
);
