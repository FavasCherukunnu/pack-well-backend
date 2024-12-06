import { NextFunction, Response } from "express";
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer/index.js";
import { TypedRequestBody } from "../../types/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { OrderOtpService } from "../../utils/otpServices.js";
import { ProductSKU } from "../../models/productSKU.model.js";
import { User } from "../../models/user.model.js";
import { SalesOrderModel } from "../../models/salesOrder.model.js";
import { PaymentTypeModel } from "../../models/paymentType.model.js";
import { ShippingMethod } from "../../models/shippingMethod.model.js";
import { OrderStatusModel } from "../../models/orderStatus.model.js";
import { SalesOrderLineModel } from "../../models/salesOrderLine.model.js";
import { OrderStatusHistoryModel } from "../../models/orderStatusHystory.model.js";
import {ObjectId} from "mongodb";
import mongoose from "mongoose";

type IRequestOrderOtpBody = {
    M11_postal_code: string;
    M11_phone_no: string;
    M11_address: string;
    M11_email: string;
}

export const requestOrderOtpController = async (req: TypedRequestBody<IRequestOrderOtpBody>, res: Response, next: NextFunction) => {
    try {

        const orderOtpService = new OrderOtpService(req.session)
        const OTP = orderOtpService.sendOTP({ email: req.body.M11_email });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions: Mail.Options = {
            from: {
                name: 'Ecommerce',
                address: 'ecommerce@gmail.com'
            },
            to: req.body.M11_email,
            subject: 'OTP for login',
            text: `Your OTP is ${OTP}`,
        };
        await transporter.sendMail(mailOptions);


        return res.json(new ApiResponse(true, 200, "Otp sent successfully", {}))


    } catch (error) {
        next(error);
    }
};


export type IConfirmOrderBody = {
    M11_name: string;
    M11_postal_code: string;
    M11_phone_no: string;
    M11_address: string;
    M11_email: string;
    otp: string,
    skus: Array<{ _id: string; quantity: number, price: number, MRP: number }>
}

export const verifyAndConfirmOrderController = async (req: TypedRequestBody<IConfirmOrderBody>, res: Response, next: NextFunction) => {
    try {
        const { M11_postal_code, M11_phone_no, M11_address, M11_email, M11_name, otp, skus } = req.body
        // ---------------------------------------------------------------------------------------------------
        const orderOtpService = new OrderOtpService(req.session)
        const OTP = orderOtpService.validateOTP(req.body.otp, req.body.M11_email);

        if (!OTP.success) {
            return res.status(400).
            clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            json(new ApiError(400, OTP.message, OTP.message));
        }
        // ---------------------------------------------------------------------------------------------------


        // read payment type id as cash on delvery
        const paymentType = await PaymentTypeModel.findOne({ P01_Value: "cash on delivery" })
        //read shiping method is as standard
        const shipingMethod = await ShippingMethod.findOne({ O01_Shiping_method_name: "standerd" })
        //read order status as ordered
        const orderStatus = await OrderStatusModel.findOne({ O02_order_name: "ordered" })


        if (!paymentType || !shipingMethod || !orderStatus) {
            return res.status(400).json(new ApiError(400, "Payment type or shipping method not found", "Payment type or shipping method not found"));
        }

        // check if the product skus are available
        const productSkus = await ProductSKU.find({ _id: { $in: skus.map(sku => sku._id) } })
        if (productSkus.length !== skus.length) {
            return res.status(400).json(new ApiError(400, "Some product skus are not available", "Some product skus are not available"));
        }
        //check the given sku datas are correct
        const availableSkus = productSkus.filter(productSku => {
            const sku = skus.find(sku => sku._id === productSku._id.toString())
            if (productSku.M06_single_order_limit) {
                return productSku.M06_quantity >= sku!.quantity && productSku.M06_single_order_limit >= sku!.quantity && productSku.M06_price === sku!.price && productSku.M06_MRP === sku!.MRP
            } else {
                return productSku.M06_quantity >= sku!.quantity && productSku.M06_price === sku!.price && productSku.M06_MRP === sku!.MRP
            }
        })

        if (availableSkus.length !== skus.length) {
            return res.status(400).json(new ApiError(400, "Some product skus are not available for given quantity or price", "Some product skus are not available for given quantity or price"));
        }


        //calculate prices
        const totalPrice = availableSkus.reduce((total, productSku) => total + productSku.M06_price * skus.find(sku => sku._id === productSku._id.toString())!.quantity, 0)
        const totalDiscount = availableSkus.reduce((total, productSku) => total + (productSku.M06_MRP - productSku.M06_price) * skus.find(sku => sku._id === productSku._id.toString())!.quantity, 0)

        // dicrease the quantity
        await Promise.all(availableSkus.map(async availableSku => {
            availableSku.M06_quantity -= skus.find(sku => sku._id === availableSku._id.toString())!.quantity
            await ProductSKU.updateOne({ _id: availableSku._id }, { $set: { M06_quantity: availableSku.M06_quantity } })
        }))

        let user = await User.findOne({ M02_email: M11_email })
        let userId
        if (!user) {
            const newUser = new User({ M02_email: M11_email, M02_name: M11_name, M02_phone_no: M11_phone_no, M02_is_active: 1 })
            await newUser.save()
            userId = newUser._id
            user = newUser
        } else {
            userId = user._id
        }



        const order = new SalesOrderModel({
            O03_M02_user_id: userId,
            O03_customer_name: M11_name,
            O03_customer_address: `${M11_address}, ${M11_postal_code}`,
            O03_phone_number: M11_phone_no,
            O03_email: M11_email,
            O03_P01_payment_type_id: paymentType._id,
            O03_O01_shiping_method: shipingMethod._id,
            O03_Delivery_charge: 0,
            O03_total_price: totalPrice,
            O03_discount_price: totalDiscount,
            O03_tax_price: 0,
            O03_sale_date: new Date(),
            O03_completed: 0,
            O03_cancelled: 0,
            O03_order_source: "Ecommerce",
            O03_O02_order_status: orderStatus.O02_order_status_id,
        })

        await order.save()


        const orderLines = skus.map(sku => {

            const availableSku = availableSkus.find(productSku => productSku._id.toString() === sku._id)

            return {
                O04_O03_Sales_order_id: order._id,
                O04_M06_Product_item_id: availableSku!._id,
                O04_Quantity: sku.quantity,
                O04_discount_price: availableSku!.M06_MRP - availableSku!.M06_price,
                O04_Price: availableSku?.M06_price,
                O04_MRP: availableSku?.M06_MRP,
                O04_O02_order_status: orderStatus.O02_order_status_id,
                O04_is_Active: 1
            }
        })
        await SalesOrderLineModel.insertMany(orderLines)
        await OrderStatusHistoryModel.create({
            O05_O03_order_id: order._id,
            O05_O02_status: orderStatus.O02_order_status_id,
            O05_status_change_date: new Date(),
            deleted_at:null
        })

        const accessToken = user.generateAccessToken();
        const refreshToken = user.genereateRefreshToken();

        return res.status(200).
            cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
            cookie("accessToken", accessToken, { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).json(new ApiResponse(true, 200, "Order confirmed successfully", {
                order: {
                    ...order.toJSON(),
                    orderLines: orderLines
                },
            }))


    } catch (error) {
        next(error);
    }
};

export const listOrdersController = async (req: TypedRequestBody<{ page: string, limit: string }>, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 15 } = req.body;
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);


        const orders =  await SalesOrderModel.aggregate([
            // Match active orders
            { $match: { O03_deleted_at: null } },
        
            // Lookup associated sales order lines
            {
                $lookup: {
                    from: "o04_sales_order_lines", // Collection for sales order lines
                    localField: "_id",
                    foreignField: "O04_O03_Sales_order_id",
                    as: "O04_sales_order_line"
                }
            },
        
            // Unwind sales order lines to look up product items in each line
            { $unwind: { path: "$O04_sales_order_line", preserveNullAndEmptyArrays: true } },
            
            // Lookup product SKU in each sales order line
            {
                $lookup: {
                    from: "m06_product_skus", // Collection for Product SKU Model
                    localField: "O04_sales_order_line.O04_M06_Product_item_id",
                    foreignField: "_id",
                    as: "O04_sales_order_line.O04_M06_Product_item"
                }
            },
            { $unwind: { path: "$O04_sales_order_line.O04_M06_Product_item", preserveNullAndEmptyArrays: true } },
        
            // Lookup the user associated with the order
            {
                $lookup: {
                    from: "m02_users", // Collection for User Model
                    localField: "O03_M02_user_id",
                    foreignField: "_id",
                    as: "O03_M02_user"
                }
            },
            { $unwind: { path: "$O03_M02_user", preserveNullAndEmptyArrays: true } },
        
            // Lookup the payment type associated with the order
            {
                $lookup: {
                    from: "p01_payment_types", // Collection for Payment Type Model
                    localField: "O03_P01_payment_type_id",
                    foreignField: "_id",
                    as: "O03_P01_payment_type"
                }
            },
            { $unwind: { path: "$O03_P01_payment_type", preserveNullAndEmptyArrays: true } },
        
            // Lookup the shipping method associated with the order
            {
                $lookup: {
                    from: "o01_shiping_methods", // Collection for Shipping Method Model
                    localField: "O03_O01_shiping_method",
                    foreignField: "_id",
                    as: "O03_O01_shiping_method"
                }
            },
            { $unwind: { path: "$O03_O01_shiping_method", preserveNullAndEmptyArrays: true } },
        
            // Lookup the order status associated with the order
            {
                $lookup: {
                    from: "o02_order_statuses", // Collection for Order Status Model
                    localField: "O03_O02_order_status",
                    foreignField: "O02_order_status_id",
                    as: "O03_O02_order_status"
                }
            },
            { $unwind: { path: "$O03_O02_order_status", preserveNullAndEmptyArrays: true } },
        
            
            {
                $group: {
                    _id: "$_id",
                    order: { $first: "$$ROOT" },
                    O04_sales_order_line: { $push: "$O04_sales_order_line" },
                    O05_status_history: { $push: "$O05_status_history" }
                }
            },
        
            // Combine order lines and status history back into the order document
            {
                $addFields: {
                    "order.O04_sales_order_line": "$O04_sales_order_line",
                    "order.O05_status_history": "$O05_status_history"
                }
            },
        
            // Replace the root to return a single, clean order object
            {
                $replaceRoot: { newRoot: "$order" }
            },
        
            // Sort by sale date and apply pagination
            { $sort: { O03_sale_date: -1 } },
            { $skip: (pageNumber - 1) * limitNumber },
            { $limit: limitNumber }
        ]);
        const totalOrders = await SalesOrderModel.countDocuments();

        return res.status(200).json(new ApiResponse(true, 200, "Orders fetched successfully", {
            orders,
            totalPages: Math.ceil(totalOrders / limitNumber)
        }));

    } catch (error) {
        next(error);
    }
};


export const readOrderController = async (req: TypedRequestBody<{ orderId: string }>, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const orderData = await SalesOrderModel.aggregate([
            // Match the specific order
            { $match: { _id: new ObjectId(orderId), deleted_at: null } },

            // Lookup associated sales order lines
            {
                $lookup: {
                    from: "o04_sales_order_lines", // Collection name of SalesOrderLineModel
                    localField: "_id",
                    foreignField: "O04_O03_Sales_order_id",
                    as: "O04_sales_order_line",
                },
            },

            // Unwind the array of order lines to lookup referenced products
            {
                $unwind: {
                    path: "$O04_sales_order_line",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Lookup the product item for each order line
            {
                $lookup: {
                    from: "m06_product_skus", // Collection name of Product SKU Model
                    localField: "O04_sales_order_line.O04_M06_Product_item_id",
                    foreignField: "_id",
                    as: "O04_sales_order_line.O04_M06_Product_item",
                },
            },
            {
                $unwind: {
                    path: "$O04_sales_order_line.O04_M06_Product_item",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Lookup other referenced fields in the order
            {
                $lookup: {
                    from: "m02_users", // Collection name of User Model
                    localField: "O03_M02_user_id",
                    foreignField: "_id",
                    as: "O03_M02_user",
                },
            },
            { $unwind: "$O03_M02_user" },

            {
                $lookup: {
                    from: "p01_payment_types", // Collection name of Payment Type Model
                    localField: "O03_P01_payment_type_id",
                    foreignField: "_id",
                    as: "O03_P01_payment_type",
                },
            },
            { $unwind: "$O03_P01_payment_type" },

            {
                $lookup: {
                    from: "o01_shiping_methods", // Collection name of Shipping Method Model
                    localField: "O03_O01_shiping_method",
                    foreignField: "_id",
                    as: "O03_O01_shiping_method",
                },
            },
            { $unwind: "$O03_O01_shiping_method" },

            {
                $lookup: {
                    from: "o02_order_statuses", // Collection name of Order Status Model
                    localField: "O03_O02_order_status",
                    foreignField: "_id",
                    as: "O03_O02_order_status",
                },
            },
            { $unwind: "$O03_O02_order_status" },

            // Group back the order lines into an array
            {
                $group: {
                    _id: "$_id",
                    order: { $first: "$$ROOT" },
                    O04_sales_order_line: { $push: "$O04_sales_order_line" },
                },
            },

            // Add the array of order lines back to the main order object
            {
                $addFields: {
                    "order.O04_sales_order_line": "$O04_sales_order_line",
                },
            },

            // Replace the root document to return a single, clean order object
            {
                $replaceRoot: { newRoot: "$order" },
            },
        ]);
        if (orderData.length === 0) {
            return res.status(404).json(new ApiError(404, "Order not found", "Order not found"));
        }
        return res.status(200).json(new ApiResponse(true, 200, "Order fetched successfully", orderData[0]));

    } catch (error) {
        next(error);
    }
};
