import mongoose, { Schema } from "mongoose";
const OrderStatusSchema = new Schema({
    O02_order_status_id: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4],
        unique: true,
    },
    O02_order_name: {
        type: String,
        required: true,
        enum: ["ordered", "processing", "shipped", "delivered"],
    },
    deleted_at: { type: Date, default: null },
}, {
    timestamps: true
});
export const OrderStatusModel = mongoose.model("O02_order_statuses", OrderStatusSchema);
