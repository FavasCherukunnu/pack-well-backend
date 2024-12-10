import { NextFunction, Request, Response } from "express";
import { prisma } from "../../app.js";

export const listFeaturedProductsController = async (req: Request<{}, {}, {}, { limit?: string }>, res: Response, next: NextFunction) => {
    try {
        const {
            limit = 16
        } = req.query




        const featuredProducts = await prisma.p01_featured_product.findMany({
            where: {
                deleted_at: null
            },
            include: {
                P01_M06_product_id: true
            },
            take: Number(limit),
            orderBy: {
                p01_order: 'asc'
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
    } catch (error) {
        next(error);
    }
};
