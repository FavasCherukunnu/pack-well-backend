import { UploadApiResponse } from "cloudinary";
import { NextFunction, Response } from "express";
import { prisma } from "../../app.js";
import { TypedRequestBody } from "../../types/index.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { deleteImageFromCloudinary } from "../../utils/cloudinary.js";
import { deleteImageFromFileSystem } from "../../utils/fileSystem.js";



export type CreateProductCategoryRequest = {
    m04_category_name: string;
    m04_image: string | null;
    m04_m04_parent_category_id: number|null;
    m04_description?: string;
    m04_is_active: number;
    isImageDeleted?: '1' | '0'
}

export const createProductCategoryController = async (req: TypedRequestBody<CreateProductCategoryRequest>, res: Response, next: NextFunction) => {
    let image_path: string | undefined
    try {
        const { m04_category_name, m04_m04_parent_category_id, m04_is_active,m04_description } = req.body;
        const image_path = ((req.files as any)?.m04_image?.[0] as Express.Multer.File)?.path || null
  
        const productCategory = await prisma.m04_product_category.create({
            data: {
                m04_category_name: m04_category_name,
                m04_image: image_path,
                m04_m04_parent_category_id: m04_m04_parent_category_id ? Number(m04_m04_parent_category_id) : null,
                m04_description: m04_description,
                m04_is_active: Number(m04_is_active)
            }
        });
        
        res.status(201).json(
            new ApiResponse(true, 201, "Product category created successfully", productCategory)
        );

    } catch (error) {
        console.log(error)
        if (image_path)
            deleteImageFromFileSystem(image_path);
        next(error);
    }

}


export const deleteProductCategoryController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Find the product category by ID and check if it has been deleted already
        const productCategory = await prisma.m04_product_category.findFirst({
            where:{ id: Number(id), deleted_at: null },
        });
        if (!productCategory) {
            return res.status(404).json(new ApiResponse(false, 404, "Product category not found", null));
        }

        // Check for products under this category
        const products = await prisma.m06_sku.findMany({
            where:{ m06_m04_product_category: Number(id), deleted_at: null }
        });
        if (products.length > 0) {
            return res.status(400).json(new ApiResponse(false, 400, "Cannot delete category. Delete products under this category first.", null));
        }

        // Check for child categories
        const childCategories = await prisma.m04_product_category.findMany({
            where:{ m04_m04_parent_category_id: Number(id), deleted_at: null }
        });
        if (childCategories.length > 0) {
            return res.status(400).json(new ApiResponse(false, 400, "Cannot delete parent category. Delete child categories first.", null));
        }

        // If there are no child categories, proceed to delete the parent category
        if (productCategory.m04_image) {
            deleteImageFromFileSystem(productCategory.m04_image);
        }

        // Mark the category as deleted by setting the M04_deleted_at field
        await prisma.m04_product_category.update({
            where:{ id: Number(id) },
            data: { deleted_at: new Date() }
        });

        res.status(200).json(new ApiResponse(true, 200, "Product category deleted successfully", null));
    } catch (error) {
        next(error);
    }
};


export const listProductCategoryController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        // Convert page and limit to numbers and ensure valid values
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);

        // Fetch product categories with pagination and active condition
        const productCategories = await prisma.m04_product_category.findMany({
            where: {
                deleted_at: null, // Filter for non-deleted categories
            },
            skip: Number(page)-1,
            take: limitNumber, // Equivalent to limit
            orderBy: {
                id: 'asc', // Optional: Order categories by ID
            },
        });

        // Get the total count of categories
    const totalCategories = await prisma.m04_product_category.count({
        where: {
            deleted_at: null, // Match the same condition as above
        },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCategories / limitNumber);

        res.status(200).json(
            new ApiResponse(true, 200, "Product categories retrieved successfully", {
                productCategories,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalItems: totalCategories,
                    limit: limitNumber,
                }
            })
        );
    } catch (error) {
        next(error);
    }
};


export const readProductCategoryController = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const productCategory = await prisma.m04_product_category.findUnique({
            where:{
                id: Number(id), 
                deleted_at: null
             }
        });

        if (!productCategory) {
            return res.status(404).json(new ApiResponse(false, 404, "Product category not found", null));
        }

        res.status(200).json(new ApiResponse(true, 200, "Product category retrieved successfully", productCategory));
    } catch (error) {
        next(error);
    }
};


export const updateProductCategoryController = async (req: TypedRequestBody<CreateProductCategoryRequest>, res: Response, next: NextFunction) => {
    let cloudinary_image: string|undefined;
    try {
        const { id } = req.params;
        const { m04_category_name, m04_m04_parent_category_id, m04_is_active } = req.body;
        const cloudinary_image = ((req.files as any)?.m04_image?.[0] as Express.Multer.File)?.path || null;

        const productCategory = await prisma.m04_product_category.findUnique({
            where:{ id: Number(id), deleted_at: null }
        });

        if (!productCategory) {
            return res.status(404).json(new ApiResponse(false, 404, "Product category not found", null));
        }

        // If a new image is uploaded, delete the old one and upload the new image to Cloudinary
        if (cloudinary_image && req.body.isImageDeleted != '1') {
            if (productCategory.m04_image) {
                deleteImageFromFileSystem(productCategory.m04_image);
            }
        }

        if (req.body.isImageDeleted == '1') {
            deleteImageFromFileSystem(productCategory.m04_image);
            productCategory.m04_image = null;
        }

        // Update the product category with new values
        productCategory.m04_category_name = m04_category_name;
        productCategory.m04_image = cloudinary_image || productCategory.m04_image;
        productCategory.m04_m04_parent_category_id = m04_m04_parent_category_id ? m04_m04_parent_category_id : null;
        productCategory.m04_is_active = m04_is_active;
        productCategory.m04_description = req.body.m04_description||null

        const updatedProductCategory = await prisma.m04_product_category.update({
            where: { id: Number(id) },
            data: {
                m04_category_name: productCategory.m04_category_name,
                m04_image: productCategory.m04_image,
                m04_m04_parent_category_id: productCategory.m04_m04_parent_category_id?Number(productCategory.m04_m04_parent_category_id):null,
                m04_is_active: Number(productCategory.m04_is_active),
                m04_description: productCategory.m04_description

            },
        });

        res.status(200).json(new ApiResponse(true, 200, "Product category updated successfully", updatedProductCategory));

    } catch (error) {
        if (cloudinary_image) {
            deleteImageFromFileSystem(cloudinary_image);
        }
        next(error);
    }
};

