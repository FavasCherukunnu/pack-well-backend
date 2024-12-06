import { CarouselModel } from "../../models/carousel.model.js";
export const carouselListCustomerController = async (req, res, next) => {
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
