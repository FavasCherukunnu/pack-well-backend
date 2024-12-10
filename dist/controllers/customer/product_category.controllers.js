import { ApiResponse } from "../../utils/ApiResponse.js";
import { prisma } from "../../app.js";
export const listProductCategoryControllercustomer = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, m04_m04_parent_category_id } = req.query;
        // Convert page and limit to numbers and ensure valid values
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        // Build the `where` condition
        const whereCondition = {
            deleted_at: null, // Filter out deleted categories
        };
        if (m04_m04_parent_category_id) {
            whereCondition.m04_m04_parent_category_id = m04_m04_parent_category_id === "null" ? null : Number(m04_m04_parent_category_id); // Filter by parent category ID
        }
        // Fetch the product categories with pagination and filtering based on parentCategoryId
        const productCategories = await prisma.m04_product_category.findMany({
            where: whereCondition,
            skip: (pageNumber - 1) * limitNumber,
            take: limitNumber,
        });
        // Get the total count of product categories
        const totalCategories = await prisma.m04_product_category.count({
            where: whereCondition,
        });
        // Calculate total pages
        const totalPages = Math.ceil(totalCategories / limitNumber);
        res.status(200).json(new ApiResponse(true, 200, "Product categories retrieved successfully", {
            productCategories,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalItems: totalCategories,
                limit: limitNumber,
            }
        }));
    }
    catch (error) {
        next(error);
    }
};
