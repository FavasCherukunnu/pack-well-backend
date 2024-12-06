import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
// Return "https" URLs by setting secure: true
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
export const uploadImageoncloudinay = async (localFilePath, cloudePath) => {
    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            resource_type: "auto",
            folder: `${process.env.CLOUDINARY_FOLDER}${cloudePath}`
        });
        //after upload delete it from local
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath);
        throw error;
    }
};
export const deleteImageFromCloudinary = async (imageUrl) => {
    // Split the URL by '/'
    const splitUrl = imageUrl.split('/');
    // Find the index of 'ecommerce_template'
    const templateIndex = splitUrl.indexOf('ecommerce_template');
    // Extract the publicId by taking the last element and removing the file extension
    const publicId = splitUrl[splitUrl.length - 1].split('.').shift();
    // Construct the folder path by joining elements from 'ecommerce_template' up to (but not including) the publicId
    const folderPath = splitUrl.slice(templateIndex, splitUrl.length - 1).join('/');
    console.log(publicId);
    console.log(folderPath);
    if (!publicId) {
        throw new Error('Invalid image url');
    }
    try {
        await cloudinary.uploader.destroy(`${folderPath}/${publicId}`);
    }
    catch (error) {
        console.log(error);
    }
};
