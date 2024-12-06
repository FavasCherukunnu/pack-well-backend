import { ApiResponse } from "../../utils/ApiResponse.js";
import { deleteImageFromCloudinary, uploadImageoncloudinay } from "../../utils/cloudinary.js";
import { compressImage } from "../../utils/sharp.js";
import { Product } from "../../models/product.model.js";
import { ProductVariation } from "../../models/productVariation.model.js";
import { ProductVariationOption } from "../../models/productVariationOption.js";
import { ObjectId } from "mongodb";
import { deleteImageFromFileSystem } from "../../utils/fileSystem.js";
import { ProductSKU } from "../../models/productSKU.model.js";
export const createProductController = async (req, res, next) => {
    let cloudinary_image;
    let compressedImagePath;
    const productImage = req.files?.M05_image?.[0] || null;
    try {
        const { variations } = req.body;
        // if (!productImage) {
        //     return res.status(400).json(
        //         new ApiResponse(false, 400, "Product image is required", null)
        //     );
        // }
        if (productImage && productImage.size > 500000) {
            deleteImageFromFileSystem(productImage.path);
            return res.status(400).json(new ApiResponse(false, 400, "Product image size must be less than 500KB", null));
        }
        if (productImage && !['image/png', 'image/jpeg', 'image/jpg'].includes(productImage.mimetype)) {
            deleteImageFromFileSystem(productImage.path);
            return res.status(400).json(new ApiResponse(false, 400, "Product image type must be png, jpg or jpeg", null));
        }
        // checking duplication of variation and options
        if (variations && variations.length > 0) {
            const variationNames = variations.map(v => v.M08_name);
            const duplicateVariationNames = variationNames.filter((item, index) => variationNames.indexOf(item) != index);
            if (duplicateVariationNames.length > 0) {
                deleteImageFromFileSystem(productImage.path);
                return res.status(400).json(new ApiResponse(false, 400, `Variation name ${duplicateVariationNames[0]} is duplicate`, null));
            }
            variations.forEach(variation => {
                const optionNames = variation.Option.map(o => o.M09_name);
                const duplicateOptionNames = optionNames.filter((item, index) => optionNames.indexOf(item) != index);
                if (duplicateOptionNames.length > 0) {
                    deleteImageFromFileSystem(productImage.path);
                    return res.status(400).json(new ApiResponse(false, 400, `Option name ${duplicateOptionNames[0]} in variation ${variation.M08_name} is duplicate`, null));
                }
            });
        }
        if (productImage) {
            // compress image
            console.log(productImage);
            compressedImagePath = await compressImage({
                inputPath: productImage.path,
                quality: 50,
                extension: productImage.mimetype.split('/')[1]
            });
            deleteImageFromFileSystem(productImage.path);
            cloudinary_image = await uploadImageoncloudinay(compressedImagePath, '/product');
        }
        const product = new Product({
            M05_product_name: req.body.M05_product_name,
            M05_M04_product_category: new ObjectId(req.body.M05_M04_product_category),
            M05_image: cloudinary_image?.url || null,
            M05_is_active: req.body.M05_is_active
        });
        await product.save();
        if (variations && variations.length > 0) {
            variations.forEach(async (variation) => {
                variation.M08_M05_product_id = product._id;
                const variationRecord = new ProductVariation({
                    M08_name: variation.M08_name,
                    M08_is_active: variation.M08_is_active,
                    M08_M05_product_id: product._id
                });
                await variationRecord.save();
                variation.Option.forEach(async (option) => {
                    option.M09_M05_product_id = product._id;
                    const variationOptionRecord = new ProductVariationOption({
                        M09_name: option.M09_name,
                        M09_is_active: option.M09_is_active,
                        M09_M05_product_id: product._id,
                        M09_M08_product_variation_id: variationRecord._id
                    });
                    await variationOptionRecord.save();
                });
            });
        }
        return res.status(200).json(new ApiResponse(true, 200, "Product created successfully", product));
    }
    catch (error) {
        console.log(error);
        if (cloudinary_image)
            await deleteImageFromCloudinary(cloudinary_image?.url).catch(next);
        deleteImageFromFileSystem(compressedImagePath || null);
        next(error);
    }
};
export const getProductController = async (req, res, next) => {
    try {
        const product = await Product.aggregate([
            // Match the product by ID
            { $match: { _id: new ObjectId(req.params.id), M05_deleted_at: null } },
            // Lookup the product variations associated with this product
            {
                $lookup: {
                    from: 'm08_product_variations',
                    let: { productId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$M08_M05_product_id', '$$productId'] }, M08_deleted_at: null } },
                        // Lookup variation options for each variation
                        {
                            $lookup: {
                                from: 'm09_product_variation_options',
                                let: { variationId: '$_id' },
                                pipeline: [
                                    { $match: { $expr: { $eq: ['$M09_M08_product_variation_id', '$$variationId'] }, M09_deleted_at: null } },
                                ],
                                as: 'Option'
                            }
                        }
                    ],
                    as: 'variations'
                }
            },
            // Project only the necessary fields
            {
                $project: {
                    _id: 1,
                    M05_product_name: 1,
                    M05_image: 1,
                    M05_M04_product_category: 1,
                    M05_is_active: 1,
                    variations: 1
                }
            }
        ]);
        console.log(product);
        if (!product.length) {
            return next(new Error("Product not found"));
        }
        return res.status(200).json(new ApiResponse(true, 200, "Product fetched successfully", product[0]));
    }
    catch (error) {
        next(error);
    }
};
export const listProductController = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        // Convert page and limit to numbers and ensure valid values
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const products = await Product.aggregate([
            { $match: { M05_deleted_at: null } },
            { $skip: (pageNumber - 1) * limitNumber },
            { $limit: limitNumber },
            {
                $lookup: {
                    from: 'm04_product_categories', // Collection name for categories
                    localField: 'M05_M04_product_category',
                    foreignField: '_id',
                    as: 'product_category'
                }
            },
            { $unwind: { path: '$product_category', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    M05_product_name: 1,
                    M05_image: 1,
                    M05_M04_product_category: 1,
                    product_category: { $ifNull: ['$product_category', null] },
                    M05_is_active: 1
                }
            }
        ]);
        const totalProducts = await Product.countDocuments({ M05_deleted_at: null });
        const totalPages = Math.ceil(totalProducts / limitNumber);
        return res.status(200).json(new ApiResponse(true, 200, "Products fetched successfully", {
            products,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalItems: totalProducts,
                totalPages
            }
        }));
    }
    catch (error) {
        next(error);
    }
};
export const deleteProductController = async (req, res, next) => {
    try {
        const id = new ObjectId(req.params.id);
        const product = await Product.findById(id, { new: true });
        if (!product) {
            return next(new Error("Product not found"));
        }
        const productSKUs = await ProductSKU.find({ M06_M05_product_id: id, M06_deleted_at: null });
        if (productSKUs.length > 0) {
            return next(new Error("Product sku found under this product. Can not delete this product"));
        }
        if (product?.M05_image)
            await deleteImageFromCloudinary(product.M05_image);
        // delete all the variation of this product
        await ProductVariation.updateMany({ M08_M05_product_id: id }, { M08_deleted_at: new Date() });
        // delete all the variation option of this product
        await ProductVariationOption.updateMany({ M09_M05_product_id: id }, { M09_deleted_at: new Date() });
        return res.status(200).json(new ApiResponse(true, 200, "Product deleted successfully", product));
    }
    catch (error) {
        next(error);
    }
};
export const updateProductController = async (req, res, next) => {
    let cloudinary_image;
    try {
        const { id } = req.params;
        const { M05_product_name, M05_M04_product_category, M05_is_active } = req.body;
        const productImage = req.files?.M05_image?.[0]?.path || null;
        const product = await Product.findOne({ _id: id, M04_deleted_at: null });
        if (!product) {
            return res.status(404).json(new ApiResponse(false, 404, "Product not found", null));
        }
        if (productImage) {
            cloudinary_image = await uploadImageoncloudinay(productImage, '/product');
            if (product.M05_image) {
                await deleteImageFromCloudinary(product.M05_image);
            }
        }
        else if (req.body.isImageDeleted == '1') {
            await deleteImageFromCloudinary(product.M05_image);
            product.M05_image = null;
        }
        // Update the product with new values
        product.M05_product_name = M05_product_name;
        product.M05_image = cloudinary_image?.url || product.M05_image;
        product.M05_M04_product_category = M05_M04_product_category;
        product.M05_is_active = M05_is_active;
        const updatedProduct = await product.save();
        res.status(200).json(new ApiResponse(true, 200, "Product updated successfully", updatedProduct));
    }
    catch (error) {
        if (cloudinary_image) {
            await deleteImageFromCloudinary(cloudinary_image?.url);
        }
        next(error);
    }
};
