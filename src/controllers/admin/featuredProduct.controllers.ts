import { Request, Response, NextFunction } from "express";
import { FeaturedProductModel } from "../../models/featuredProduct.model.js";
import { ProductSKU } from "../../models/productSKU.model.js";
import { ObjectId } from "mongodb";

export const listFeaturedProductsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch the featured products, sorted by order
        const featuredProducts = await FeaturedProductModel.find({ P01_deleted_at: null })
            .populate({
                path: 'P01_M06_product_id',
                select: 'M06_sku M06_product_sku_name M06_description M06_thumbnail_image M06_MRP M06_price M06_quantity M06_is_new',

            })
            .sort({ P01_order: 1 });

      

        res.status(200).json({
            success: true,
            msg: "Featured products fetched successfully",
            data: featuredProducts,
        });
    } catch (error) {
        next(error);
    }
};

export const addFeaturedProductController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { P01_product_id, P01_is_active = 1 } = req.body;

        // Validate product existence
        const productExists = await ProductSKU.findById(P01_product_id);
        if (!productExists) {
            return res.status(400).json({
                success: false,
                msg: "Product does not exist",
            });
        }

        // Ensure the maximum featured products are not exceeded
        const featuredProductsCount = await FeaturedProductModel.countDocuments({ P01_deleted_at: null });
        if (featuredProductsCount >= 12) {
            return res.status(400).json({
                success: false,
                msg: "Maximum number of featured products reached",
            });
        }

        // Check if the product is already featured
        const isProductFeatured = await FeaturedProductModel.findOne({ P01_M06_product_id: P01_product_id, P01_deleted_at: null });
        if (isProductFeatured) {
            return res.status(400).json({
                success: false,
                msg: "Product is already featured",
            });
        }

        // Determine the order number if not provided
        const highestOrder = await FeaturedProductModel.findOne().sort({ P01_order: -1 });
        const orderNumber =  (highestOrder ? highestOrder.P01_order + 1 : 1);

        // Add the product to the featured list
        const newFeaturedProduct = new FeaturedProductModel({
            P01_M06_product_id: P01_product_id,
            P01_is_active,
            P01_order: orderNumber,
        });

        await newFeaturedProduct.save();

        res.status(201).json({
            success: true,
            msg: "Product added to featured successfully",
            data: newFeaturedProduct,
        });
    } catch (error) {
        next(error);
    }
};


export const deleteFeaturedProductController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Find the featured product by ID
        const featuredProduct = await FeaturedProductModel.findByIdAndRemove(id);
        if (!featuredProduct || featuredProduct.P01_deleted_at) {
            return res.status(404).json({
                success: false,
                msg: "Product not found or already deleted",
            });
        }


        res.status(200).json({
            success: true,
            msg: "Product removed from featured products successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const reorderFeaturedProductsController = async (req: Request<{},{},{
    featuredProducts: {
        _id: string;
    }[]
}>, res: Response, next: NextFunction) => {
    try {
        const { featuredProducts } = req.body;

        if (!Array.isArray(featuredProducts) || featuredProducts.length === 0) {
            return res.status(400).json({
                success: false,
                msg: "Featured products not found in the request",
            });
        }

        const featuredProductIds = featuredProducts.map(product => product._id);

        // Validate that all featured products exist
        const productsFound = await FeaturedProductModel.find({ _id: { $in: featuredProductIds } });

        if (productsFound.length !== featuredProducts.length) {
            return res.status(400).json({
                success: false,
                msg: "Some featured products do not exist",
            });
        }

        

        // Prepare the update payload
        const featuredProductsToUpdate = featuredProductIds.map((product, index) => ({
            _id: new ObjectId(product),
            P01_order: index + 1, // Set the order based on position in the sorted array
        }));

        // Perform bulk update to reorder the products
        const updatedFeaturedProducts = await FeaturedProductModel.bulkWrite(
            featuredProductsToUpdate.map(product => ({
                updateOne: {
                    filter: { _id: product._id },
                    update: { $set: { P01_order: product.P01_order } },
                }
            }))
        );

        // Return success response
        return res.status(200).json({
            success: true,
            msg: "Featured products reordered successfully",
            data: updatedFeaturedProducts,
        });
    } catch (error) {
        next(error);
    }
};
