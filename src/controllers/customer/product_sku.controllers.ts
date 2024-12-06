import { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ProductSKU } from "../../models/productSKU.model.js";
import { TypedRequestBody } from "../../types/index.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ProductCategory } from "../../models/productCategory.model.js";
import _ from "mongoose-sequence";







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


export const listSkuController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 15, search = '', sortField = 'M06_product_sku_name', sortOrder = 'asc', categoryId } = req.query;
        const minPrice = parseFloat(req.query.minPrice as string) || 0;
        const maxPrice = parseFloat(req.query.maxPrice as string) || Infinity;

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);

        let categoryIds: ObjectId[] = [];

        // Step 1: If categoryId is provided, find all relevant category IDs (parent and children)
        if (categoryId) {
            // Find the selected category and its children
            const categories = await ProductCategory.find({
                $or: [
                    { _id: new ObjectId(categoryId as string) },
                    { M04_M04_parent_category_id: new ObjectId(categoryId as string) }
                ],
                M04_deleted_at: null // Ensure only active categories
            }).select('_id');

            categoryIds = categories.map(cat => cat._id);
        }
        // Aggregation pipeline with total count and pagination
        const pipeline: any[] = [
            // Match base SKU fields
            {
                $match: {
                    M06_deleted_at: null,
                    M06_product_sku_name: { $regex: search, $options: 'i' },
                    M06_price: { $gte: minPrice, $lte: maxPrice }
                }
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
            // Lookup to join with the Product collection
            {
                $lookup: {
                    from: 'm05_products', // The name of the Product collection in MongoDB
                    localField: 'M06_M05_product_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            // Unwind the joined product array
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            // Apply additional matching on the joined product fields
            {
                $match: categoryId
                    ? { 'product.M05_M04_product_category': { $in: categoryIds }, 'product.M05_deleted_at': null }
                    : { 'product.M05_deleted_at': null }
            },
            // Facet to get both the paginated results and the total count
            {
                $facet: {
                    skus: [
                        // Project only the required fields
                        {
                            $project: {
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
                                M06_deleted_at: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                M06_M05_product_id: 1,
                                Variations: 1
                            }
                        },
                        // Sort the results
                        {
                            $sort: {
                                [sortField as string]: sortOrder === 'asc' ? 1 : -1
                            }
                        },
                        // Pagination
                        { $skip: (pageNumber - 1) * limitNumber },
                        { $limit: limitNumber }
                    ],
                    totalCount: [
                        { $count: "total" }
                    ]
                }
            },
            // Unwind to get total count as a number
            {
                $unwind: {
                    path: "$totalCount",
                    preserveNullAndEmptyArrays: true // For cases with 0 results
                }
            },
            // Replace totalCount with 0 if there are no results
            {
                $addFields: {
                    totalCount: { $ifNull: ["$totalCount.total", 0] }
                }
            }
        ];

        // Run the aggregation pipeline
        const result = await ProductSKU.aggregate(pipeline);
        const skus = result[0]?.skus || [];
        const totalSkus = result[0]?.totalCount || 0;
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



export const listSkuSingleByProductController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const {
            page = 1,
            limit = 15,
            search = '',
            sortField = 'M06_product_sku_name',
            sortOrder = 'asc',
            categoryId,
        } = req.query;
        const minPrice = parseFloat(req.query.minPrice as string) || 0;
        const maxPrice = parseFloat(req.query.maxPrice as string) || Infinity;

        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);

        let categoryIds: ObjectId[] = [];

        // Step 1: Find relevant category IDs if `categoryId` is provided
        if (categoryId) {
            const categories = await ProductCategory.find({
                $or: [
                    { _id: new ObjectId(categoryId as string) },
                    { M04_M04_parent_category_id: new ObjectId(categoryId as string) },
                ],
                M04_deleted_at: null,
            }).select('_id');

            categoryIds = categories.map((cat) => cat._id);
        }

        // Aggregation pipeline
        const pipeline: any[] = [
            {
                $match: {
                    M06_deleted_at: null,
                    M06_product_sku_name: { $regex: search, $options: 'i' },
                    M06_price: { $gte: minPrice, $lte: maxPrice },
                },
            },
            {
                $lookup: {
                    from: 'm05_products',
                    localField: 'M06_M05_product_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $match: categoryId
                    ? { 'product.M05_M04_product_category': { $in: categoryIds }, 'product.M05_deleted_at': null }
                    : { 'product.M05_deleted_at': null },
            },
            // Group SKUs by Product ID and select the most relevant SKU
            {
                $group: {
                    _id: '$M06_M05_product_id',
                    product: { $first: '$product' },
                    sku: {
                        $first: {
                            _id: '$_id',
                            M06_sku: '$M06_sku',
                            M06_product_sku_name: '$M06_product_sku_name',
                            M06_description: '$M06_description',
                            M06_thumbnail_image: '$M06_thumbnail_image',
                            M06_MRP: '$M06_MRP',
                            M06_price: '$M06_price',
                            M06_quantity: '$M06_quantity',
                            M06_is_new: '$M06_is_new',
                            M06_single_order_limit: '$M06_single_order_limit',
                            M06_is_active: '$M06_is_active',
                            createdAt: '$createdAt',
                            updatedAt: '$updatedAt',
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'm10_product_variation_configurations',
                    localField: 'sku._id',
                    foreignField: 'M10_M06_product_sku_id',
                    as: 'sku.Variations',
                    pipeline: [
                        { $match: { M10_is_active: 1, M10_deleted_at: null } },
                        {
                            $lookup: {
                                from: 'm08_product_variations',
                                localField: 'M10_M08_product_variation_id',
                                foreignField: '_id',
                                as: 'product_variation',
                                pipeline: [{ $project: { M08_name: 1 } }],
                            },
                        },
                        { $unwind: { path: '$product_variation', preserveNullAndEmptyArrays: true } },
                        {
                            $lookup: {
                                from: 'm09_product_variation_options',
                                localField: 'M10_M09_variation_option_id',
                                foreignField: '_id',
                                as: 'variation_option',
                                pipeline: [{ $project: { M09_name: 1 } }],
                            },
                        },
                        { $unwind: { path: '$variation_option', preserveNullAndEmptyArrays: true } },
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
                $facet: {
                    skus: [
                        {
                            $project: {
                                _id: '$sku._id',
                                M06_sku: '$sku.M06_sku',
                                M06_product_sku_name: '$sku.M06_product_sku_name',
                                M06_description: '$sku.M06_description',
                                M06_thumbnail_image: '$sku.M06_thumbnail_image',
                                M06_MRP: '$sku.M06_MRP',
                                M06_price: '$sku.M06_price',
                                M06_quantity: '$sku.M06_quantity',
                                M06_is_new: '$sku.M06_is_new',
                                M06_single_order_limit: '$sku.M06_single_order_limit',
                                M06_is_active: '$sku.M06_is_active',
                                M06_deleted_at: '$sku.M06_deleted_at',
                                createdAt: '$sku.createdAt',
                                updatedAt: '$sku.updatedAt',
                                M06_M05_product_id: '$sku.M06_M05_product_id',
                                Variations: '$sku.Variations',
                            }
                        },
                        { $sort: { [`sku.${sortField}`]: sortOrder === 'asc' ? 1 : -1 } },
                        { $skip: (pageNumber - 1) * limitNumber },
                        { $limit: limitNumber },
                    ],
                    totalCount: [{ $count: 'total' }],
                },
            },
            { $unwind: { path: '$totalCount', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    totalCount: { $ifNull: ['$totalCount.total', 0] },
                },
            },
        ];

        const result = await ProductSKU.aggregate(pipeline);
        const skus = result[0]?.skus || [];
        const totalSkus = result[0]?.totalCount || 0;
        const totalPages = Math.ceil(totalSkus / limitNumber);

        res.status(200).json(
            new ApiResponse(true, 200, 'Products SKU fetched successfully', {
                products_skus: skus,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    totalItems: totalSkus,
                    totalPages,
                },
            })
        );
    } catch (error) {
        next(error);
    }
};
