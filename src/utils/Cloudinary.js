import fs from "fs/promises"; // Use the promise-based API for better async handling
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("No file path provided for upload");
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detect type (image/video/raw)
      upload_preset: "ml_default",
    });

    // Delete the temporary local file after successful upload
    await fs.unlink(localFilePath);
    return response; // Return Cloudinary response, including the URL
  } catch (error) {
    console.error(error.message)
    console.error("Error uploading file to Cloudinary:", error);

    // Attempt to delete the local file, but handle any errors gracefully
    try {
      await fs.unlink(localFilePath);
    } catch (unlinkError) {
      console.error("Error deleting local file:", unlinkError);
    }

    // Return error details or throw if needed
    throw new Error("Failed to upload file to Cloudinary");
  }
};

export { uploadOnCloudinary };
