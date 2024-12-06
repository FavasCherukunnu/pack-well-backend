import { ObjectId } from "mongodb";
import { SalesOrderModel } from "../../models/salesOrder.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { OrderStatusHistoryModel } from "../../models/orderStatusHystory.model.js";
export const listOrdersAdminController = async (req, res, next) => {
    try {
        const { page = 1, limit = 15, searchTerm } = req.query;
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const matchCriteria = {
            deleted_at: null,
            ...searchTerm && (Number.isInteger(Number(searchTerm))
                ? { O03_order_id: Number(searchTerm) } // If searchTerm is a number, search by O03_order_id
                : { O03_email: { $regex: searchTerm, $options: "i" } } // Identical (contains) match for email, case-insensitive
            )
        };
        const orders = await SalesOrderModel.aggregate([
            // Match active orders and filter by O03_order_id if provided
            {
                $match: matchCriteria
            },
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
        const totalOrders = await SalesOrderModel.countDocuments(matchCriteria);
        const totalPages = Math.ceil(totalOrders / limitNumber);
        return res.status(200).json(new ApiResponse(true, 200, "Orders fetched successfully", {
            orders,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalItems: totalOrders,
                totalPages
            }
        }));
    }
    catch (error) {
        next(error);
    }
};
export const readOrderAdminController = async (req, res, next) => {
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
                    from: "o02_order_statuses", // Collection for Order Status Model
                    localField: "O03_O02_order_status",
                    foreignField: "O02_order_status_id",
                    as: "O03_O02_order_status"
                }
            },
            { $unwind: "$O03_O02_order_status" },
            // Lookup the status history for the order
            {
                $lookup: {
                    from: "o05_sales_order_status_histories", // Collection name of OrderStatusHistoryModel
                    localField: "_id",
                    foreignField: "O05_O03_order_id",
                    as: "O05_status_history",
                    let: { orderId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$deleted_at", null] },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
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
    }
    catch (error) {
        next(error);
    }
};
export const updateOrderStatusByOrderIdAdminController = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { statusId } = req.body;
        const order = await SalesOrderModel.findOne({ _id: new ObjectId(orderId), deleted_at: null });
        if (!order) {
            return res.status(404).json(new ApiError(404, "Order not found", "Order not found"));
        }
        // Define the ordered statuses
        const statusOrder = [1, 2, 3, 4]; // Adjust to actual ordered status IDs
        // Find the position of the current status in the order array
        const currentStatusIndex = statusOrder.indexOf(statusId);
        if (currentStatusIndex === -1) {
            return res.status(400).json(new ApiError(400, "Invalid status", "Status not found in order array"));
        }
        // Collect all statuses that appear below the current status in the order
        const statusesToDelete = statusOrder.slice(currentStatusIndex, statusOrder.length);
        // Collect all statuses that appear above the current status in the order
        const statusesToCheck = statusOrder.slice(0, currentStatusIndex);
        // Delete all statuses that appear below the current one
        await OrderStatusHistoryModel.updateMany({ O05_O03_order_id: order._id, O05_O02_status: { $in: statusesToDelete }, deleted_at: null }, { $set: { deleted_at: new Date() } });
        await OrderStatusHistoryModel.create({ O05_O03_order_id: order._id, O05_O02_status: statusId, O05_status_change_date: new Date() });
        // Ensure each status above is created if missing
        for (const status of statusesToCheck) {
            const historyExists = await OrderStatusHistoryModel.findOne({
                O05_O03_order_id: order._id,
                O05_O02_status: status,
                deleted_at: null
            });
            if (!historyExists) {
                await OrderStatusHistoryModel.create({
                    O05_O03_order_id: order._id,
                    O05_O02_status: status,
                    O05_status_change_date: new Date(),
                });
            }
        }
        //update status
        await SalesOrderModel.findOneAndUpdate({ _id: order._id }, { O03_O02_order_status: statusId }, { new: true });
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
                    from: "o02_order_statuses", // Collection for Order Status Model
                    localField: "O03_O02_order_status",
                    foreignField: "O02_order_status_id",
                    as: "O03_O02_order_status"
                }
            },
            { $unwind: "$O03_O02_order_status" },
            // Lookup the status history for the order
            {
                $lookup: {
                    from: "o05_sales_order_status_histories", // Collection name of OrderStatusHistoryModel
                    localField: "_id",
                    foreignField: "O05_O03_order_id",
                    as: "O05_status_history",
                    let: { orderId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$deleted_at", null] },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
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
        return res.status(200).json(new ApiResponse(true, 200, "Order status updated successfully", orderData));
    }
    catch (error) {
        next(error);
    }
};
