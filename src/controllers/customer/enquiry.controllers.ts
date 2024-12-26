import { NextFunction, Request, Response } from "express";
import { prisma } from "../../app.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const createEnquiryController = async (req: Request<
    {},{}, {
            m09_name: string,
            m09_company_name: string | null,
            m09_phone: string | null,
            m09_enquiry: string,
            m09_email: string,
        }
    >, res: Response, next: NextFunction) => {
    try {
        const { m09_name, m09_company_name, m09_phone, m09_enquiry, m09_email,} = req.body;
        
        const enquiry = await prisma.m09_enquiries.create({
            data: {
                m09_name: m09_name,
                m09_company_name: m09_company_name||null,
                m09_phone: m09_phone||null,
                m09_enquiry: m09_enquiry,
                m09_email: m09_email,
            }
        });

        res.status(201).json(
            new ApiResponse(true, 201, "Enquiry created successfully", enquiry)
        );
        
    } catch (error) {
        console.log(error);
        next(error);
    }
};