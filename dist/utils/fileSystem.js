import fs from "fs";
export function deleteImageFromFileSystem(imagePath) {
    if (imagePath && fs.existsSync(imagePath))
        fs.rmSync(imagePath);
}
export function removeAllImageFromFileSystem(imagePaths) {
    imagePaths.forEach(imagePath => {
        if (imagePath && fs.existsSync(imagePath))
            fs.rmSync(imagePath, { recursive: true, force: true });
    });
}
