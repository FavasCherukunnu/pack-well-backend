import mongoose, { Document, Schema } from "mongoose";

export interface IOrderStatusHistory extends Document {
    O05_O03_order_id: Schema.Types.ObjectId;
    O05_O02_status: number;
    O05_status_change_date: Date;
    deleted_at: Date | null
}

const OrderStatusHistorySchema: Schema<IOrderStatusHistory> = new Schema({
    O05_O03_order_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "O03_sales_orders",
    },
    O05_O02_status: {       //foreign key to O02_order_status based on O02_order_status_id
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
},{
    timestamps: true,
});

export const OrderStatusHistoryModel = mongoose.model<IOrderStatusHistory>("O05_sales_order_status_history", OrderStatusHistorySchema);

