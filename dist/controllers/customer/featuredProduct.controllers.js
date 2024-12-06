import { prisma } from "../../app.js";
export const listFeaturedProductsController = async (req, res, next) => {
    try {
        const featuredProducts = await prisma.p01_featured_product.findMany({
            where: {
                deleted_at: null
            },
            include: {
                P01_M06_product_id: true
            }
        });
        // Return the formatted response
        res.status(200).json({
            success: true,
            msg: "Featured products fetched successfully",
            data: {
                products_skus: featuredProducts.map((product) => product.P01_M06_product_id),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
