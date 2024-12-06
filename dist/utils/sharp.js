import sharp from "sharp";
import { v4 as uuidv4 } from 'uuid';
export const compressImage = async ({ inputPath, quality, extension, outputPath }) => {
    try {
        const generateUniqueId = () => {
            return uuidv4();
        };
        const uuuid = generateUniqueId();
        const compressedImagePath = `${process.cwd()}/${outputPath}/${uuuid}-compressed.${extension}`;
        // Use the appropriate format (jpeg, png, webp) dynamically
        sharp.cache(false);
        const sharpInstance = sharp(inputPath);
        switch (extension) {
            case 'webp':
                await sharpInstance.webp({ quality }).toFile(compressedImagePath); // Write the compressed file;
                break;
            case 'jpeg':
                await sharpInstance.jpeg({ quality }).toFile(compressedImagePath); // Write the compressed file;
                break;
            case 'png':
                await sharpInstance.png({ quality }).toFile(compressedImagePath); // Write the compressed file;
                break;
            default:
                throw new Error('Invalid image format');
        }
        return `${outputPath}/${uuuid}-compressed.${extension}`; // Return the path of the compressed image
    }
    catch (error) {
        console.error('Error compressing image:', error);
        throw error;
    }
};
