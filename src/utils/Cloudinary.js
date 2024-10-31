// import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath)
    // console.log("File is uploaded on cloudinary", response, response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //removes file from our server which was temporary
    return null;
  }
};

export { uploadOnCloudinary };
