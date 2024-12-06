import mongoose, { Schema } from "mongoose";
const SalesOrderLineSchema = new Schema({
    O04_M06_Product_item_id: { type: Schema.Types.ObjectId, required: true, ref: "M06_product_sku" },
    O04_O03_Sales_order_id: { type: Schema.Types.ObjectId, required: true, ref: "O03_sales_orders" },
    O04_Quantity: { type: Number, required: true },
    O04_discount_price: { type: Number, required: true },
    O04_Price: { type: Number, required: true },
    O04_MRP: { type: Number, required: true },
    O04_O02_order_status: { type: Number, required: true, ref: "O02_order_statuses" },
    O04_is_Active: { type: Number, required: true },
    deleted_at: { type: Date, default: null },
}, {
    timestamps: true,
});
export const SalesOrderLineModel = mongoose.model("O04_sales_order_line", SalesOrderLineSchema);
