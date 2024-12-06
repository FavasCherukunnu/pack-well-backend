import mongoose, { Document, Schema } from "mongoose";

export interface IShippingMethod extends Document {
    O01_Shiping_method_id: number;
    O01_Shiping_method_name: string;
    O01_Shiping_method_price: number;
    deleted_at: Date | null;
}

const ShippingMethodSchema: Schema<IShippingMethod> = new Schema({
    O01_Shiping_method_id: {
        type: Number,
        required: true,
        unique: true,
    },
    O01_Shiping_method_name: {
        type: String,
        required: true,
        enum: ["standerd"],
        unique:true
    },
    O01_Shiping_method_price: {
        type: Number,
        required: true,
        default: 0
    },
    deleted_at: { type: Date, default: null },
},{
    timestamps: true
});


export const ShippingMethod = mongoose.model<IShippingMethod>("o01_Shiping_methods", ShippingMethodSchema);

