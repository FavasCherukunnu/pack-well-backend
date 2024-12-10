import { NextFunction, Request, Response } from "express";
import { prisma } from "../../app.js";
import { ApiResponse } from "../../utils/ApiResponse.js";







export const readSKUController = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { id } = req.params;
        const skuData = await prisma.m06_sku.findUnique({
            where: {
                id: Number(id),
                deleted_at: null
            },
            include: {
                m07_sku_image: {
                    where: {
                        deleted_at: null
                    }
                }
            }
        })


        if (!skuData) {
            return res.status(404).json({ success: false, message: 'SKU not found' });
        }



        return res.status(200).json(new ApiResponse(true, 200, "Successfully read product sku",
            skuData
        ));

    } catch (error) {
        next(error);
    }
};

export const listSkuController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract query parameters, providing defaults where necessary
        const { 
            page = 1, 
            limit = 15, 
            search = '', 
            sortField = 'm06_product_sku_name', 
            sortOrder = 'asc', 
            categoryId, 
            minPrice, 
            maxPrice 
        } = req.query;

        const pageNumber = Math.max(Number(page), 1); // Ensure page is at least 1
        const limitNumber = Math.max(Number(limit), 1); // Ensure limit is at least 1
        const minPriceValue = minPrice ? parseFloat(minPrice as string) : undefined; // Only apply minPrice if provided
        const maxPriceValue = maxPrice ? parseFloat(maxPrice as string) : undefined; // Only apply maxPrice if provided

        let categoryIds: number[] = [];

        // If categoryId is provided, find all relevant category IDs (parent and children)
        if (categoryId) {
            const categories = await prisma.m04_product_category.findMany({
                where: {
                    OR: [
                        { id: parseInt(categoryId as string) }, // Matching category ID
                        {  m04_m04_parent_category_id: parseInt(categoryId as string)  } // Parent category
                    ]
                },
                select: { id: true } // Only select the ID of the categories
            });

            categoryIds = categories.map(cat => cat.id); // Get all category IDs
        }
        console.log(categoryIds)

        // Build the filter object dynamically
        const where: any = {
            m06_product_sku_name: { contains: search as string }, // Search filter (case-insensitive)
            deleted_at: null, // Ensure SKU is not deleted
            ...(categoryId && { m06_m04_product_category: { in: categoryIds } }), // Apply category filter if categoryId is provided
        };

        // Apply price range filtering if minPrice or maxPrice are provided
        if (minPriceValue) {
            where.m06_price = { ...where.m06_price, gte: minPriceValue }; // Apply minPrice (greater than or equal to)
        }
        if (maxPriceValue) {
            where.m06_price = { ...where.m06_price, lte: maxPriceValue }; // Apply maxPrice (less than or equal to)
        }

        // Fetch SKUs with filters, sorting, and pagination
        const skus = await prisma.m06_sku.findMany({
            where,
            skip: (pageNumber - 1) * limitNumber, // Pagination offset
            take: limitNumber, // Limit number of results
            orderBy: {
                [sortField as string]: sortOrder === 'asc' ? 'asc' : 'desc' // Sorting based on provided sortField and sortOrder
            }
        });

        // Get the total number of SKUs based on the same filters
        const totalSkus = await prisma.m06_sku.count({
            where,
        });

        const totalPages = Math.ceil(totalSkus / limitNumber); // Calculate total pages based on total SKUs and limit

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
        console.log(error); // Log error for debugging
        next(error); // Pass error to error-handling middleware
    }
};

