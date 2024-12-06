import fs from "fs";


export function deleteImageFromFileSystem(imagePath: string|null){
        
    if(imagePath&&fs.existsSync(imagePath))        
        fs.rmSync(imagePath)
        
}


export function removeAllImageFromFileSystem(imagePaths: (string|null)[]){
    imagePaths.forEach(imagePath => {
        if(imagePath&&fs.existsSync(imagePath))        
            fs.rmSync(imagePath, { recursive: true, force: true })
    });
}
