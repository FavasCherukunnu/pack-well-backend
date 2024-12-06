import { ProductCategory } from "../../models/productCategory.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
export const listProductCategoryControllercustomer = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        // Convert page and limit to numbers and ensure valid values
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        // Fetch the product categories with pagination
        const productCategories = await ProductCategory.find({ M04_deleted_at: null })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        const totalCategories = await ProductCategory.countDocuments({ M04_deleted_at: null });
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
