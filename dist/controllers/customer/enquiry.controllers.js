import { prisma } from "../../app.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
export const createEnquiryController = async (req, res, next) => {
    try {
        const { m08_name, m08_address } = req.body;
        const enquiry = await prisma.m08_enquiries.create({
            data: {
                m08_name: m08_name,
                m08_address: m08_address,
            }
        });
        res.status(201).json(new ApiResponse(true, 201, "Enquiry created successfully", enquiry));
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};
