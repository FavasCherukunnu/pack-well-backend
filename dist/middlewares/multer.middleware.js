import multer from 'multer';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/temp');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});
export const upload = multer({ storage: storage });
const storageProductCategory = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/product_category');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});
export const uploadProductCategory = multer({ storage: storageProductCategory });
//
const storageProductImages = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/product_images');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});
export const uploadProductImages = multer({ storage: storageProductImages });
