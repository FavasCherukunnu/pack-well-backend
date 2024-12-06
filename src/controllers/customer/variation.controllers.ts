import { NextFunction, Response } from "express";
import { ObjectId } from "mongodb";
import { ProductVariationConfiguration } from "../../models/productVariationConfiguration.model.js";
import { ProductVariationOption } from "../../models/productVariationOption.js";
import { TypedRequestBody } from "../../types/index.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getVariationByProductIdCustomerController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    
    try {
        const productId = new ObjectId(req.params.productId);
        const variations = await ProductVariationOption.aggregate([
            // Match options by product ID
            { $match: { M09_M05_product_id: productId, M09_deleted_at: null } },

            // Lookup the associated variation for each option
            {
                $lookup: {
                    from: 'm08_product_variations', // Collection name for variations
                    localField: 'M09_M08_product_variation_id',
                    foreignField: '_id',
                    as: 'variation'
                }
            },

            // Unwind variations (each option should belong to only one variation)
            { $unwind: '$variation' },

            // Filter out inactive or deleted variations
            { $match: { 'variation.M08_deleted_at': null, 'variation.M08_is_active': 1 } },

            // Group by variation to collect options
            {
                $group: {
                    _id: '$variation._id',
                    M08_name: { $first: '$variation.M08_name' },
                    M08_is_active: { $first: '$variation.M08_is_active' },
                    options: {
                        $push: {
                            _id: '$_id',
                            M09_name: '$M09_name',
                            M09_is_active: '$M09_is_active'
                        }
                    }
                }
            }
        ]);


        return res.status(200).json(
            new ApiResponse(true, 200, "Variation fetched successfully", variations)
        );

    } catch (error) {
        next(error);
    }
};


export const getProductSKUsWithVariationsController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const productId = new ObjectId(req.params.productId);

        const skus = await ProductVariationConfiguration.aggregate([
            // Match configurations by product ID
            { $match: { M10_M05_product_id: productId, M10_deleted_at: null } },

            // Lookup SKU details for each configuration
            {
                $lookup: {
                    from: 'm06_product_skus', // Collection name for SKUs
                    localField: 'M10_M06_product_sku_id',
                    foreignField: '_id',
                    as: 'sku'
                }
            },
            { $unwind: '$sku' },

            // Lookup Variation details
            {
                $lookup: {
                    from: 'm08_product_variations', // Collection name for variations
                    localField: 'M10_M08_product_variation_id',
                    foreignField: '_id',
                    as: 'variation'
                }
            },
            { $unwind: '$variation' },

            // Lookup Variation Option details
            {
                $lookup: {
                    from: 'm09_product_variation_options', // Collection name for options
                    localField: 'M10_M09_variation_option_id',
                    foreignField: '_id',
                    as: 'option'
                }
            },
            { $unwind: '$option' },

            // Group by SKU to collect variations and their options
            {
                $group: {
                    _id: '$sku._id',
                    skuId: { $first: '$sku._id' },
                    M06_sku: { $first: '$sku.M06_sku' },
                    M06_product_sku_name: { $first: '$sku.M06_product_sku_name' },
                    M06_thumbnail_image: { $first: '$sku.M06_thumbnail_image' },
                    variations: {
                        $addToSet: {
                            _id: '$variation._id',
                            name: '$variation.M08_name',
                            options: {
                                _id: '$option._id',
                                name: '$option.M09_name'
                            }
                        }
                    }
                }
            }
        ]);

        if (!skus.length) {
            return next(new Error("No SKUs found for the specified product"));
        }

        return res.status(200).json(
            new ApiResponse(true, 200, "SKUs with variations fetched successfully", skus)
        );

    } catch (error) {
        next(error);
    }
};
