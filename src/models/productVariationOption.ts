import mongoose, { Schema, Document } from "mongoose";

interface IProductVariationOption extends Document {
    M09_name: string;
    M09_M05_product_id: mongoose.Schema.Types.ObjectId;
    M09_M08_product_variation_id: mongoose.Schema.Types.ObjectId;
    M09_is_active: number;
    M09_deleted_at: Date | null;
}

const ProductVariationOptionSchema: Schema<IProductVariationOption> = new Schema(
    {
        M09_name: { type: String, required: true },
        M09_M05_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "M05_product", required: true },
        M09_M08_product_variation_id: { type: mongoose.Schema.Types.ObjectId, ref: "M08_product_variation", required: true },
        M09_is_active: { type: Number, default: 1 },
        M09_deleted_at: { type: Date, default: null },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

export const ProductVariationOption = mongoose.model<IProductVariationOption>("M09_product_variation_option", ProductVariationOptionSchema);
