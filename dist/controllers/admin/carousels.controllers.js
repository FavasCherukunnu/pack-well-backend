import { CarouselModel } from "../../models/carousel.model.js";
import { deleteImageFromFileSystem } from "../../utils/fileSystem.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { deleteImageFromCloudinary, uploadImageoncloudinay } from "../../utils/cloudinary.js";
export const carouselListAdminController = async (req, res, next) => {
    try {
        const carousels = await CarouselModel.find({ deleted_at: null }).sort({ P02_order: 1 });
        return res.status(200).json({
            success: true,
            msg: "carousels fetched successfully",
            data: carousels
        });
    }
    catch (error) {
        next(error);
    }
};
export const createCarouselAdminController = async (req, res, next) => {
    try {
        const { P02_name, } = req.body;
        const carouselImage = req.files?.P02_image?.[0] || null;
        if (!carouselImage) {
            return res.status(400).json(new ApiResponse(false, 400, "Product image is required", null));
        }
        if (carouselImage && !['image/png', 'image/jpeg', 'image/jpg'].includes(carouselImage.mimetype)) {
            deleteImageFromFileSystem(carouselImage.path);
            return res.status(400).json(new ApiResponse(false, 400, "Product image type must be png, jpg or jpeg", null));
        }
        const lastCarousel = await CarouselModel.findOne({ deleted_at: null }).sort({ P02_order: -1 });
        if (lastCarousel && lastCarousel.P02_order >= 10) {
            return res.status(400).json({
                success: false,
                msg: "Maximum carousels created",
            });
        }
        //upload image to cloudinary
        const cloudinaryResponse = await uploadImageoncloudinay(carouselImage.path, '/carousels');
        if (!cloudinaryResponse?.url) {
            return res.status(400).json(new ApiResponse(false, 400, "Error uploading image to cloudinary", null));
        }
        deleteImageFromFileSystem(carouselImage.path);
        const newCarousel = await CarouselModel.create({
            P02_name,
            P02_image: cloudinaryResponse?.url,
            P02_order: lastCarousel ? lastCarousel.P02_order + 1 : 1,
        });
        return res.status(201).json({
            success: true,
            msg: "Carousels created successfully",
            data: newCarousel,
        });
    }
    catch (error) {
        next(error);
    }
};
export const updateCarouselAdminController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { P02_name } = req.body;
        const existingCarousel = await CarouselModel.findOne({ _id: id, deleted_at: null });
        if (!existingCarousel) {
            return res.status(404).json(new ApiResponse(false, 404, "Carousels not found", null));
        }
        const carouselImage = req.files?.P02_image?.[0] || null;
        let cloudinaryResponse = undefined;
        if (carouselImage) {
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(carouselImage.mimetype)) {
                deleteImageFromFileSystem(carouselImage.path);
                return res.status(400).json({
                    success: false,
                    msg: "Product image type must be png, jpg or jpeg",
                });
            }
            cloudinaryResponse = await uploadImageoncloudinay(carouselImage.path, '/carousels');
            if (!cloudinaryResponse?.url) {
                return res.status(400).json(new ApiResponse(false, 400, "Error uploading image to cloudinary", null));
            }
            deleteImageFromFileSystem(carouselImage.path);
        }
        const newCarousel = await CarouselModel.findByIdAndUpdate(id, {
            P02_name,
            P02_image: cloudinaryResponse ? cloudinaryResponse.url : existingCarousel.P02_image,
        }, {
            runValidators: true,
            new: true,
        });
        if (cloudinaryResponse) {
            await deleteImageFromCloudinary(existingCarousel.P02_image);
        }
        return res.status(200).json({
            success: true,
            msg: "Carousels updated successfully",
            data: newCarousel,
        });
    }
    catch (error) {
        next(error);
    }
};
export const deleteCarouselAdminController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await CarouselModel.findByIdAndUpdate(id, {
            deleted_at: new Date(),
        }, {
            runValidators: true,
            new: true,
        });
        if (!deleted) {
            return res.status(404).json(new ApiResponse(false, 404, "Carousels not found", null));
        }
        await deleteImageFromCloudinary(deleted.P02_image);
        return res.status(200).json({
            success: true,
            msg: "Carousels deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
export const reorderCarouselsAdminController = async (req, res, next) => {
    try {
        const { carousels } = req.body;
        if (!Array.isArray(carousels) || carousels.length === 0) {
            return res.status(400).json(new ApiResponse(false, 400, "Carousels not found in the request", null));
        }
        const carouselsIds = carousels.map(carousel => carousel._id);
        const carouselsFound = await CarouselModel.find({ _id: { $in: carouselsIds } });
        if (carouselsFound.length !== carousels.length) {
            return res.status(400).json(new ApiResponse(false, 400, "The carousels you are trying to reorder do not exist", null));
        }
        const sortedCarousels = carouselsFound.sort((a, b) => {
            const indexA = carousels.findIndex(carousel => carousel._id?.toString() === a._id?.toString());
            const indexB = carousels.findIndex(carousel => carousel._id?.toString() === b._id?.toString());
            return indexA - indexB;
        });
        const carouselsToUpdate = sortedCarousels.map((carousel, index) => {
            return {
                _id: carousel._id,
                P02_order: index + 1
            };
        });
        const updatedCarousels = await CarouselModel.bulkWrite(carouselsToUpdate.map(carousel => ({
            updateOne: {
                filter: { _id: carousel._id },
                update: { $set: { P02_order: carousel.P02_order } }
            }
        })));
        return res.status(200).json({
            success: true,
            msg: "Carousels reordered successfully",
            data: {
                carousels: updatedCarousels
            },
        });
    }
    catch (error) {
        next(error);
    }
};
