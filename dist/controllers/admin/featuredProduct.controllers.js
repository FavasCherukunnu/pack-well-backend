import { prisma } from "../../app.js";
export const listFeaturedProductsController = async (req, res, next) => {
    try {
        // Fetch the featured products, sorted by order
        const featuredProducts = await prisma.p01_featured_product.findMany({
            where: {
                deleted_at: null
            },
            include: {
                P01_M06_product_id: true
            },
            orderBy: {
                p01_order: 'asc'
            }
        });
        res.status(200).json({
            success: true,
            msg: "Featured products fetched successfully",
            data: featuredProducts,
        });
    }
    catch (error) {
        next(error);
    }
};
export const addFeaturedProductController = async (req, res, next) => {
    try {
        const { p01_product_id, p01_is_active = 1 } = req.body;
        // Ensure the maximum featured products are not exceeded
        const featuredProductsCount = await prisma.p01_featured_product.count({
            where: {
                deleted_at: null
            }
        });
        if (featuredProductsCount >= 12) {
            return res.status(400).json({
                success: false,
                msg: "Maximum number of featured products reached",
            });
        }
        // Check if the product is already featured
        const isProductFeatured = await prisma.p01_featured_product.findFirst({
            where: {
                p01_m06_product_id: Number(p01_product_id),
                deleted_at: null
            }
        });
        if (isProductFeatured) {
            return res.status(400).json({
                success: false,
                msg: "Product is already featured",
            });
        }
        // Determine the order number using Prisma
        const highestOrderProduct = await prisma.p01_featured_product.findFirst({
            where: {
                deleted_at: null
            },
            orderBy: {
                p01_order: 'desc'
            }
        });
        const orderNumber = (highestOrderProduct ? highestOrderProduct.p01_order + 1 : 1);
        // Add the product to the featured list
        const newFeaturedProduct = await prisma.p01_featured_product.create({
            data: {
                p01_m06_product_id: Number(p01_product_id),
                p01_is_active: p01_is_active == '1' ? true : false,
                p01_order: orderNumber,
            }
        });
        res.status(201).json({
            success: true,
            msg: "Product added to featured successfully",
            data: newFeaturedProduct,
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};
export const deleteFeaturedProductController = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Find the featured product by ID
        const featuredProduct = await prisma.p01_featured_product.findUnique({
            where: {
                id: Number(id),
                deleted_at: null
            }
        });
        if (!featuredProduct) {
            return res.status(404).json({
                success: false,
                msg: "Product not found or already deleted",
            });
        }
        // Delete the featured product
        await prisma.p01_featured_product.updateMany({
            where: {
                id: Number(id),
                deleted_at: null
            },
            data: {
                deleted_at: new Date()
            }
        });
        res.status(200).json({
            success: true,
            msg: "Product removed from featured products successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
export const reorderFeaturedProductsController = async (req, res, next) => {
    try {
        const { featuredProducts } = req.body;
        if (!Array.isArray(featuredProducts) || featuredProducts.length === 0) {
            return res.status(400).json({
                success: false,
                msg: "Featured products not found in the request",
            });
        }
        const featuredProductIds = featuredProducts.map(product => Number(product.id));
        // Validate that all featured products exist
        const productsFound = await prisma.p01_featured_product.findMany({
            where: {
                id: {
                    in: featuredProductIds, // Array of IDs
                },
            },
        });
        if (productsFound.length !== featuredProducts.length) {
            return res.status(400).json({
                success: false,
                msg: "Some featured products do not exist",
            });
        }
        // Prepare the update payload
        const featuredProductsToUpdate = featuredProductIds.map((product, index) => ({
            id: product,
            p01_order: index + 1, // Set the order based on position in the sorted array
        }));
        const updatedFeaturedProducts = await prisma.$transaction(featuredProductsToUpdate.map(product => prisma.p01_featured_product.update({
            where: {
                id: product.id, // Use the product's _id (assuming _id maps to id in your schema)
            },
            data: {
                p01_order: product.p01_order, // Update the P01_order field
            },
        })));
        // Return success response
        return res.status(200).json({
            success: true,
            msg: "Featured products reordered successfully",
            data: updatedFeaturedProducts,
        });
    }
    catch (error) {
        next(error);
    }
};
