import mongoose, { Document, Schema } from "mongoose";

export interface IOrderStatus extends Document {
    O02_order_status_id: number;
    O02_order_name: string;
    deleted_at: Date | null;
}

const OrderStatusSchema: Schema<IOrderStatus> = new Schema({
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
},{
    timestamps: true
});

export const OrderStatusModel = mongoose.model<IOrderStatus>("O02_order_statuses", OrderStatusSchema);

