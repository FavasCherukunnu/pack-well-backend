import { PrismaClient } from "@prisma/client";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
const prisma = new PrismaClient();
export const ListContactUsController = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sort = "created_at", order = "desc" } = req.query;
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);
        const sortField = sort;
        const sortOrder = order === "asc" ? "asc" : "desc";
        // Fetch total count for pagination
        const totalCount = await prisma.contactUsModal.count();
        // Fetch paginated and sorted demo requests
        const contactUs = await prisma.contactUsModal.findMany({
            where: {
                deleted_at: null,
            },
            skip: (pageNumber - 1) * pageSize,
            take: pageSize,
            orderBy: {
                [sortField]: sortOrder,
            },
        });
        return res.status(200).json(new ApiResponse(true, 200, "Contact us fetched successfully", {
            total: totalCount,
            page: pageNumber,
            limit: pageSize,
            data: contactUs,
        }));
    }
    catch (error) {
        next(error);
    }
};
export const ReadContactusController = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Validate ID
        const contactUsId = parseInt(id, 10);
        if (isNaN(contactUsId)) {
            return res
                .status(400)
                .json(new ApiError(400, "Bad Request", "Invalid ID parameter"));
        }
        // Find demo request by ID
        const contactUs = await prisma.contactUsModal.findUnique({
            where: { id: contactUsId, deleted_at: null },
        });
        if (!contactUs) {
            return res
                .status(404)
                .json(new ApiError(404, "Not Found", "contact us not found"));
        }
        return res
            .status(200)
            .json(new ApiResponse(true, 200, "Contact us fetched successfully", contactUs));
    }
    catch (error) {
        next(error);
    }
};
export const ContactusMarkAsReadController = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Validate ID
        const contactUsId = parseInt(id, 10);
        if (isNaN(contactUsId)) {
            return res
                .status(400)
                .json(new ApiError(400, "Bad Request", "Invalid ID parameter"));
        }
        // Find the demo request by ID (and ensure it is not soft-deleted)
        const demoRequest = await prisma.contactUsModal.findFirst({
            where: {
                id: contactUsId,
                deleted_at: null, // Ensure the record is not soft-deleted
            },
        });
        if (!demoRequest) {
            return res
                .status(404)
                .json(new ApiError(404, "Not Found", "contact us not found"));
        }
        // Update the is_read field
        const contactUs = await prisma.contactUsModal.update({
            where: { id: contactUsId },
            data: { is_read: true },
        });
        return res
            .status(200)
            .json(new ApiResponse(true, 200, "Demo request marked as read successfully", contactUs));
    }
    catch (error) {
        next(error);
    }
};
