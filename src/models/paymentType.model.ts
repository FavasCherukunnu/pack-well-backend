import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentType extends Document {
    P01_PaymentTypeID: number;
    P01_Value: string;
    P01_provider_key: string | null;
    deleted_at: Date | null;
}

const PaymentTypeSchema: Schema<IPaymentType> = new Schema({
    P01_PaymentTypeID: {
        type: Number,
        required: true,
        unique: true,
    },
    P01_Value: {
        type: String,
        required: true,
        enum: ["card", "apple pay", "google pay","cash on delivery", "other"],
    },
    P01_provider_key: {
        type: String,
        default: null,
    },
    deleted_at: { type: Date, default: null },
},{
    timestamps: true
});

export const PaymentTypeModel = mongoose.model<IPaymentType>("P01_payment_types", PaymentTypeSchema);

