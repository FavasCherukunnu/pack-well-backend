import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { ProductSKU } from "../../models/productSKU.model.js";
import { IProductSKUImage, ProductSKUImage } from "../../models/productSKUimage.model.js";
import { IProductVariationConfiguration, ProductVariationConfiguration } from "../../models/productVariationConfiguration.model.js";
import { ObjectId } from "mongodb";
import fs from "fs";
import { TypedRequestBody } from "../../types/index.js";
import { ProductVariationOption } from "../../models/productVariationOption.js";
import { deleteImageFromFileSystem, removeAllImageFromFileSystem } from "../../utils/fileSystem.js";
import { deleteImageFromCloudinary, uploadImageoncloudinay } from "../../utils/cloudinary.js";
import { ProductVariation } from "../../models/productVariation.model.js";
import { compressImage } from "../../utils/sharp.js";
import { prisma } from "../../app.js";

export type CreateSkuRequest = {
    Sku: {
        m06_sku: string,
        m06_product_sku_name: string,
        m06_thumbnail_image: Express.Multer.File,
        m06_description: string,
        m06_mrp: number,
        m06_price: number,
        m06_quantity: number,
        m06_is_new: number,
        m06_single_order_limit: number,
        m06_m04_product_category_id: string,

        m06_is_active: number,
        m06_M05_product_id: string,
        Images: {
            ImageData: Express.Multer.File,
            m07_order: number,
            m07_is_active: number
        }[],
    }
};


export type UpdateSkuRequest = {
    M06_sku: string,
    M06_product_sku_name: string,
    M06_thumbnail_image: Express.Multer.File,
    M06_description: string,
    M06_MRP: number,
    M06_price: number,
    m06_m04_product_category: string,
    M06_quantity: number,
    M06_is_new: number,
    M06_single_order_limit: number,
    M06_is_active: number,
    is_thumnail_new: 1 | 0,
}


export const createSKUController = async (req: TypedRequestBody<CreateSkuRequest>, res: Response, next: NextFunction) => {

    const Images: {
        ImageData: Express.Multer.File,
        m07_order: number,
        m07_is_active: number,
    }[] = [];
    let m06_thumbnail_image: Express.Multer.File = undefined as any as Express.Multer.File;
    let compressedThumbnailImage: string = '';

    try {
        const { Sku } = req.body;
        const { m06_sku, m06_product_sku_name, m06_description,
            m06_mrp, m06_price, m06_quantity, m06_is_new,
            m06_single_order_limit, m06_is_active,
            m06_m04_product_category_id
        } = Sku;


        // Dynamically add images to the Images array
        if (Array.isArray(req.files)) {
            req.files?.forEach(
                (file: Express.Multer.File) => {
                    if (file.fieldname === "Sku[m06_thumbnail_image]") {
                        m06_thumbnail_image = file;
                    }

                    const imageMatch = file.fieldname.match(/^Sku\[Images\]\[(\d+)\]\[ImageData\]$/);
                    const index = parseInt(imageMatch?.[1] || "", 10);
                    if (imageMatch) {
                        Images.push({
                            ImageData: file,
                            m07_order: Number(req.body.Sku.Images[index].m07_order),
                            m07_is_active: Number(req.body.Sku.Images[index].m07_is_active),
                        })
                    }
                }
            )
        }

        if (m06_thumbnail_image === undefined) {

            throw new Error("Thumbnail image is required");
        }
        if (m06_thumbnail_image.size > 500000) {
            throw new Error("Thumbnail image size must be less than 500KB");
        }


        if (Images.length < 1) {
            throw new Error("Atleast one image is required");
        }
        if (Images.length > 5) {
            throw new Error("Maximum 5 images supported");
        }

        for (const image of Images) {
            const { ImageData } = image;
            if (ImageData.size > 1048576) { // 1MB
                throw new Error("Image size must be less than 1MB");
            }
        }

        const existingSKU = await prisma.m06_sku.findFirst({
            where: {
                m06_sku: m06_sku,
                deleted_at: null
            }
        });
        if (existingSKU) {
            throw new Error("SKU id is not unique");
        }




        compressedThumbnailImage = await compressImage({
            inputPath: m06_thumbnail_image.path,
            quality: 60,
            extension: m06_thumbnail_image.mimetype.split('/')[1] as 'webp' | 'jpeg' | 'png',
            outputPath: 'public/thumbnail_images'
        })
        deleteImageFromFileSystem(m06_thumbnail_image.path);



        // Create SKU
        const IproductSKU = await prisma.m06_sku.create({
            data: {
                m06_sku,
                m06_product_sku_name,
                m06_thumbnail_image: compressedThumbnailImage,
                m06_description,
                m06_mrp: Number(m06_mrp),
                m06_price: Number(m06_price),
                m06_quantity: Number(m06_quantity),
                m06_is_new: m06_is_new ? Number(m06_is_new) : 0,
                m06_single_order_limit: m06_single_order_limit ? Number(m06_single_order_limit) : null,
                m06_is_active: Number(m06_is_active),
                m06_m04_product_category:Number(m06_m04_product_category_id)
            }
        })


        // Handle Images
        const skuImages = Images.map(img => ({
            m07_image_path: img.ImageData.path,
            m07_m06_product_sku_id: IproductSKU.id,
            m07_order: img.m07_order,
            m07_is_active: img.m07_is_active
        }));

        await prisma.m07_sku_image.createMany({
            data: skuImages
        })



        return res.status(201).json(new ApiResponse(true, 201, "Successfully created SKUs", "Success"));

    } catch (error) {
        console.log(error)
        // remove all images from local
        removeAllImageFromFileSystem([m06_thumbnail_image?.path || null])
        removeAllImageFromFileSystem([compressedThumbnailImage])
        removeAllImageFromFileSystem(Images.map(img => img?.ImageData?.path || null))

        next(error);
    }
};



export const updateSKUController = async (req: TypedRequestBody<UpdateSkuRequest>, res: Response, next: NextFunction) => {

    // let thumbnailImageUrl = ''
    // const M06_thumbnail_image = (req.files as any)?.M06_thumbnail_image?.[0] as Express.Multer.File;
    // try {
    //     const { id } = req.params;
    //     const { M06_sku, M06_product_sku_name, M06_description, M06_MRP, M06_price, M06_quantity, M06_is_new, M06_single_order_limit, M06_is_active, is_thumnail_new } = req.body;

    //     const IproductSKU = await ProductSKU.findOne({ _id: id, M06_deleted_at: null });
    //     if (!IproductSKU) {
    //         return next(new ApiError(404, "Product SKU not found", "Product SKU not found"));
    //     }

    //     // check the uniqueness of sku
    //     const isSkuUnique = await ProductSKU.findOne({ M06_sku, M06_deleted_at: null });
    //     if (isSkuUnique && isSkuUnique._id.toString() !== id) {
    //         return next(new ApiError(400, "SKU already exists", "SKU already exists"));
    //     }

    //     // if thumbnail image is new, then delete old image and save new image
    //     if (is_thumnail_new == 1) {
    //         console.log('first,', M06_thumbnail_image)
    //         if (!M06_thumbnail_image) {
    //             throw new Error("Thumbnail image is required");
    //         }
    //         if (!['image/png', 'image/jpg', 'image/jpeg'].includes(M06_thumbnail_image.mimetype)) {
    //             throw new Error("Thumbnail image must be png, jpg or jpeg");
    //         }

    //         if (M06_thumbnail_image.size > 500000) {
    //             throw new Error("Thumbnail image must be less than 500KB");
    //         }

    //         const compressedImage = await compressImage({
    //             inputPath: M06_thumbnail_image.path,
    //             quality: 60,
    //             extension: M06_thumbnail_image.mimetype.split('/')[1] as 'webp' | 'jpeg' | 'png'
    //         });
    //         const thumbnailImage = await uploadImageoncloudinay(compressedImage, "/sku/thumbnail/");
    //         await deleteImageFromCloudinary(IproductSKU.M06_thumbnail_image!);
    //         deleteImageFromFileSystem(M06_thumbnail_image.path);
    //         if (!thumbnailImage) {
    //             throw new Error("Failed to upload thumbnail image")
    //         }

    //         thumbnailImageUrl = thumbnailImage.url;
    //     }

    //     const sku = await ProductSKU.findByIdAndUpdate(id, {
    //         M06_sku,
    //         M06_product_sku_name,
    //         M06_description,
    //         M06_MRP,
    //         M06_price,
    //         M06_quantity,
    //         M06_is_new,
    //         M06_single_order_limit,
    //         M06_is_active,
    //         M06_thumbnail_image: thumbnailImageUrl.length > 0 ? thumbnailImageUrl : IproductSKU.M06_thumbnail_image
    //     }, { new: true });


    //     if (!sku) {
    //         throw new Error("Product sku not found");
    //     }

    //     return res.status(200).json(new ApiResponse(true, 200, "Successfully updated SKUs", "Success"));

    // } catch (error) {
    //     deleteImageFromFileSystem(M06_thumbnail_image?.path || null)
    //     if (thumbnailImageUrl)
    //         deleteImageFromCloudinary(thumbnailImageUrl).catch(next)
    //     next(error);
    // }
};


export const readSKUController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { id } = req.params;
        const skuData = await ProductSKU.aggregate([
            { $match: { _id: new ObjectId(id) } },
            {
                $lookup: {
                    from: 'm07_product_sku_images',
                    localField: '_id',
                    foreignField: 'M07_M06_product_sku_id',
                    as: 'Images',
                    pipeline: [
                        { $match: { M07_is_active: 1, M07_deleted_at: null } },
                        {
                            $project: {
                                M07_image_path: 1,
                                M07_M06_product_sku_id: 1,
                                M07_order: 1,
                                M07_is_active: 1,
                            },
                        },
                        {
                            $sort: {
                                M07_order: 1
                            }
                        },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'm10_product_variation_configurations',
                    localField: '_id',
                    foreignField: 'M10_M06_product_sku_id',
                    as: 'Variations',
                    pipeline: [
                        { $match: { M10_is_active: 1, M10_deleted_at: null } },
                        {
                            $lookup: {
                                from: 'm08_product_variations',
                                localField: 'M10_M08_product_variation_id',
                                foreignField: '_id',
                                as: 'product_variation',
                                pipeline: [
                                    { $project: { M08_name: 1, M08_M05_product_id: 1, M08_is_active: 1 } },
                                ],
                            },
                        },
                        {
                            $lookup: {
                                from: 'm09_product_variation_options',
                                localField: 'M10_M09_variation_option_id',
                                foreignField: '_id',
                                as: 'variation_option',
                                pipeline: [
                                    { $project: { M09_name: 1, M09_M05_product_id: 1, M09_M08_product_variation_id: 1, M09_is_active: 1 } },
                                ],
                            },
                        },
                        {
                            $unwind: { path: '$product_variation', preserveNullAndEmptyArrays: true },
                        },
                        {
                            $unwind: { path: '$variation_option', preserveNullAndEmptyArrays: true },
                        },
                        {
                            $project: {
                                M10_M08_product_variation_id: 1, M08_name: '$product_variation.M08_name',
                                M08_M05_product_id: '$product_variation.M08_M05_product_id',
                                M08_is_active: '$product_variation.M08_is_active',
                                M10_M09_variation_option_id: 1, M09_name: '$variation_option.M09_name',
                                M09_M05_product_id: '$variation_option.M09_M05_product_id',
                                M09_M08_product_variation_id: '$variation_option.M09_M08_product_variation_id',
                                M09_is_active: '$variation_option.M09_is_active',
                                M10_M06_product_sku_id: 1
                            },
                        },
                    ],
                },
            },
            {
                $project: {
                    _id: 1,
                    M06_sku: 1,
                    M06_product_sku_name: 1,
                    M06_description: 1,
                    M06_thumbnail_image: 1,
                    M06_MRP: 1,
                    M06_price: 1,
                    M06_quantity: 1,
                    M06_is_new: 1,
                    M06_single_order_limit: 1,
                    M06_is_active: 1,
                    M06_M05_product_id: 1,
                    Images: 1,
                    Variations: 1,
                },
            },
        ]);


        if (skuData.length < 1) {
            return res.status(404).json({ success: false, message: 'SKU not found' });
        }



        return res.status(200).json(new ApiResponse(true, 200, "Successfully read product sku",
            skuData[0]
        ));

    } catch (error) {
        next(error);
    }
};



export const listSkuController = async (req: Request<{}, {}, {}, { page?: number, limit?: number, productId?: string }>, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 15, productId } = req.query;
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);

        // Build the filter based on productId and deleted status
        const filter: any = { deleted_at: null };


        const skus = await prisma.m06_sku.findMany({
            where: filter,
            skip: Number(page)-1,
            take: limitNumber, // Equivalent to limit
            orderBy: {
                id: 'asc', // Optional: Order categories by ID
            },
        })

        const totalSkus = await prisma.m06_sku.count({
            where: {
                deleted_at: null, // Match the same condition as above
            },
        });
        
        const totalPages = Math.ceil(totalSkus / limitNumber);

        res.status(200).json(
            new ApiResponse(true, 200, "Products SKU fetched successfully", {
                products_skus: skus,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalItems: totalSkus,
                    totalPages
                }
            })
        );
    } catch (error) {
        next(error);
    }
};



export const deleteSkuController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        const sku = await ProductSKU.findOne({ _id: id, M06_deleted_at: null });
        console.log(id)

        if (!sku) {
            return next(new Error("Product sku not found"));
        }

        if (sku.M06_thumbnail_image) {
            await deleteImageFromCloudinary(sku.M06_thumbnail_image)
        }

        const images = await ProductSKUImage.find({ M07_M06_product_sku_id: id });

        await Promise.all(
            images.map(image => deleteImageFromCloudinary(image.M07_image_path))
        );

        await ProductSKUImage.updateMany({ M07_M06_product_sku_id: id }, { M07_deleted_at: new Date() });

        await ProductVariationConfiguration.updateMany({ M10_M06_product_sku_id: id }, { M10_deleted_at: new Date() });
        const deleted_sku = await ProductSKU.findByIdAndUpdate(id, {
            M06_deleted_at: new Date()
        }, { new: true });

        res.status(200).json(new ApiResponse(true, 200, "successfully deleted product sku", "successfully deleted product sku"));

    } catch (error) {
        next(error);
    }
};



export const reorderProductSkuImagesController = async (
    req: Request<{ skuId: string }, {}, { images: { _id: string; M07_M06_product_sku_id: string; M07_order: number }[] }>,
    res: Response,
    next: NextFunction
) => {
    const { skuId } = req.params;
    const { images } = req.body;

    try {
        // Step 1: Validation
        // 1.1 - Ensure at least one image is provided
        if (!images || images.length === 0) {
            return res.status(400).json({ success: false, message: "At least one image is required" });
        }

        // 1.2 - Retrieve all images associated with the skuId from the database
        const existingImages = await ProductSKUImage.find({ M07_M06_product_sku_id: skuId });

        // 1.3 - Check if count matches between database images and request body
        if (existingImages.length !== images.length) {
            return res.status(409).json(new ApiError(409, "There is a conflict in images", "There is a conflict in images"));
        }

        // Map existing images by `_id` for quick lookup
        const existingImagesMap = new Map(existingImages.map(img => [img._id.toString(), img]));

        // 1.4 - Validate each image entry in the request
        const idSet = new Set<string>(); // To track unique _id values
        const orderSet = new Set<number>(); // To track unique order values
        const firstSkuId = images[0].M07_M06_product_sku_id;
        for (const img of images) {
            const existingImg = existingImagesMap.get(img._id);

            // Check if each image in the request has a matching `_id` and `M07_M06_product_sku_id` in the database
            if (!existingImg || existingImg.M07_M06_product_sku_id.toString() !== firstSkuId) {
                return res.status(409).json(new ApiError(409, "There is a conflict in images", "There is a conflict in images"));
            }

            // Ensure each `_id` is unique
            if (idSet.has(img._id)) {
                return res.status(409).json(new ApiError(409, "There is a conflict in images", "There is a conflict in images"));
            }
            idSet.add(img._id);

            // Ensure `M07_order` is an integer and is unique
            if (!Number.isInteger(img.M07_order) || orderSet.has(img.M07_order)) {
                return res.status(409).json(new ApiError(409, "There is a conflict in images", "There is a conflict in images"));
            }
            orderSet.add(img.M07_order);
        }

        // Step 2: Update `M07_order` for each image in the database using `bulkWrite`
        const bulkOperations = images.map(img => ({
            updateOne: {
                filter: { _id: new ObjectId(img._id) },
                update: { M07_order: img.M07_order },
            },
        }));

        await ProductSKUImage.bulkWrite(bulkOperations);

        return res.status(200).json(new ApiResponse(true, 200, "successfully reordered product sku images", "successfully reordered product sku images"));

    } catch (error) {
        next(error);
    }
};


export const deleteProductSkuImageController = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
        const image = await ProductSKUImage.findOne({ _id: id, M07_deleted_at: null });

        if (!image) {
            return next(new Error("Product sku image not found"));
        }

        const skuImages = await ProductSKUImage.find({ M07_M06_product_sku_id: image.M07_M06_product_sku_id, M07_deleted_at: null });
        if (skuImages.length === 1) {
            return res.status(400).json(new ApiError(400, "Cannot delete the last image of a product sku", "Cannot delete the last image of a product sku"));
        }

        await deleteImageFromCloudinary(image.M07_image_path);

        image.M07_deleted_at = new Date();
        await image.save();

        res.status(200).json(new ApiResponse(true, 200, "successfully deleted product sku image", "successfully deleted product sku image"));

    } catch (error) {
        next(error);
    }
};


export const createProductSkuImageController = async (
    req: Request<{}, {}, { skuId: string, images: { M07_order: string; M07_is_active: number, M07_image_path: Express.Multer.File, cloudedPath: string, }[] }>,
    res: Response,
    next: NextFunction
) => {
    const { images, skuId } = req.body;

    try {

        // Step 1: Validation
        // 1.1 - Ensure at least one image is provided
        if (!images || images.length === 0) {
            return res.status(400).json({ success: false, message: "At least one image is required" });
        }
        // Dynamically add images to the Images array
        if (!req.files?.length) {
            return res.status(400).json(new ApiError(400, "image must required", "image must required"));
        }

        if (Array.isArray(req.files)) {
            req.files?.forEach(
                (file: Express.Multer.File) => {
                    if (!file) {
                        return res.status(400).json(new ApiError(400, "image must required", "image must required"));
                    }
                    const imageMatch = file.fieldname.match(/^images\[(\d+)\]\[M07_image_path\]$/);
                    const index = parseInt(imageMatch?.[1] || "", 10);
                    if (imageMatch) {
                        images[index] = {
                            M07_image_path: file,
                            M07_order: req.body.images[index].M07_order,
                            M07_is_active: req.body.images[index].M07_is_active,
                            cloudedPath: ''
                        }
                    }
                }
            )
        }

        // 1.2 - Ensure each image is less than 1 MB
        const imageSizes = images.map(image => image.M07_image_path.size);
        if (imageSizes.some(size => size > 1e+6)) {
            throw Error("Each image must be less than 1 MB");
        }

        // Check if the skuId is valid
        const sku = await ProductSKU.findOne({ _id: skuId, M06_deleted_at: null });
        if (!sku) {
            throw Error("Product sku not found");
        }


        // 1.3 - Retrieve all images associated with the skuId from the database
        const existingImages = await ProductSKUImage.find({ M07_M06_product_sku_id: skuId, M07_deleted_at: null });

        // 1.4 - Check if count matches between database images and request body
        if (existingImages.length + images.length > 5) {
            throw Error("Sku can only have a maximum of 5 images");
        }

        const orderSet = new Set<number>(existingImages.map(img => img.M07_order));
        for (const img of images) {
            // Ensure `M07_order` is an integer and is unique
            if (!Number.isInteger(Number(img.M07_order)) || orderSet.has(Number(img.M07_order))) {
                throw Error("There is a conflict in images");
            }
            orderSet.add(Number(img.M07_order));
        }


        // Upload images to cloudinary
        const promises = images.map(async image => {
            const res = await uploadImageoncloudinay(image.M07_image_path.path, '/sku/');
            image.cloudedPath = res?.url || '';
        });
        await Promise.all(promises);



        // Step 2: Create the images in the database
        const imagesToCreate = images.map(image => ({
            M07_M06_product_sku_id: skuId,
            M07_image_path: image.cloudedPath,
            M07_order: image.M07_order,
            M07_is_active: image.M07_is_active
        }));

        const createdImages = await ProductSKUImage.insertMany(imagesToCreate);
        removeAllImageFromFileSystem(images.map(img => img.M07_image_path?.path || null))

        return res.status(200).json(new ApiResponse(true, 200, "successfully created product sku images", createdImages));

    } catch (error) {
        removeAllImageFromFileSystem(images.map(img => img.M07_image_path?.path || null))
        next(error);
    }
};