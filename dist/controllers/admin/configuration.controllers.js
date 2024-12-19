import { prisma } from '../../app.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
// Controller to create/update the default mobile number
export const setDefaultMobileNumberController = async (req, res, next) => {
    const { m08_phone_number } = req.body;
    try {
        // Check if a default mobile number already exists
        const existingMobileNumber = await prisma.m08_configuration_phone_number.findFirst();
        if (existingMobileNumber) {
            // If a record already exists, we can update it
            const updatedMobileNumber = await prisma.m08_configuration_phone_number.update({
                where: { id: existingMobileNumber.id },
                data: {
                    m08_phone_number,
                    updated_at: new Date(),
                },
            });
            return res.status(200).json(new ApiResponse(true, 200, 'Mobile number updated successfully!', updatedMobileNumber));
        }
        else {
            // If no record exists, create a new record
            const createdMobileNumber = await prisma.m08_configuration_phone_number.create({
                data: {
                    m08_phone_number,
                },
            });
            return res.status(201).json(new ApiResponse(true, 201, 'Mobile number created successfully!', createdMobileNumber));
        }
    }
    catch (error) {
        console.error('Error setting mobile number:', error);
        next(error);
    }
};
export const getDefaultMobileNumberController = async (req, res, next) => {
    try {
        // Retrieve the default mobile number (assuming there's only one record)
        const mobileNumber = await prisma.m08_configuration_phone_number.findFirst();
        return res.status(200).json(new ApiResponse(true, 200, 'Mobile number fetched successfully!', mobileNumber));
    }
    catch (error) {
        console.error('Error fetching mobile number:', error);
        next(error);
    }
};
