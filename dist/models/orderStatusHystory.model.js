import mongoose, { Schema } from "mongoose";
const OrderStatusHistorySchema = new Schema({
    O05_O03_order_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "O03_sales_orders",
    },
    O05_O02_status: {
        type: Number,
        required: true,
    },
    O05_status_change_date: {
        type: Date,
        required: true,
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
});
export const OrderStatusHistoryModel = mongoose.model("O05_sales_order_status_history", OrderStatusHistorySchema);
