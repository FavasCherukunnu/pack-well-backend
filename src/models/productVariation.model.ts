import mongoose, { Schema, Document } from "mongoose";

interface IProductVariation extends Document {
    M08_name: string;
    M08_M05_product_id: mongoose.Schema.Types.ObjectId;
    M08_is_active: number;
    M08_deleted_at: Date | null;
}

const ProductVariationSchema: Schema<IProductVariation> = new Schema(
    {
        M08_name: { type: String, required: true },
        M08_M05_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "M05_product", required: true },
        M08_is_active: { type: Number, default: 1 },
        M08_deleted_at: { type: Date, default: null },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

export const ProductVariation = mongoose.model<IProductVariation>("M08_product_variation", ProductVariationSchema);
