import { FeaturedProductModel } from "../../models/featuredProduct.model.js";
export const listFeaturedProductsController = async (req, res, next) => {
    try {
        const featuredProducts = await FeaturedProductModel.aggregate([
            {
                // Match only active and not deleted featured products
                $match: { P01_deleted_at: null }
            },
            {
                // Lookup to join FeaturedProduct with ProductSKU (P01_M06_product_id)
                $lookup: {
                    from: "m06_product_skus", // The name of the collection for the product SKU
                    localField: "P01_M06_product_id", // The field from the FeaturedProduct model
                    foreignField: "_id", // The field from the ProductSKU model
                    as: "product_sku",
                    pipeline: [
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
                    ]
                }
            },
            {
                // Unwind the product_sku array (since it's a single product SKU per featured product)
                $unwind: "$product_sku"
            },
            {
                // Sort by the P01_order field
                $sort: { P01_order: 1 }
            },
            {
                // Project only the necessary SKU fields
                $project: {
                    _id: "$product_sku._id",
                    M06_sku: "$product_sku.M06_sku",
                    M06_product_sku_name: "$product_sku.M06_product_sku_name",
                    M06_description: "$product_sku.M06_description",
                    M06_thumbnail_image: "$product_sku.M06_thumbnail_image",
                    M06_MRP: "$product_sku.M06_MRP",
                    M06_price: "$product_sku.M06_price",
                    M06_quantity: "$product_sku.M06_quantity",
                    M06_is_new: "$product_sku.M06_is_new",
                    M06_single_order_limit: "$product_sku.M06_single_order_limit",
                    M06_is_active: "$product_sku.M06_is_active",
                    M06_M05_product_id: "$product_sku.M06_M05_product_id",
                    Images: "$product_sku.Images",
                    Variations: "$product_sku.Variations",
                },
            },
        ]);
        // Return the formatted response
        res.status(200).json({
            success: true,
            msg: "Featured products fetched successfully",
            data: {
                products_skus: featuredProducts,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
