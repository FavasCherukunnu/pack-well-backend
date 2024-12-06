import mongoose, { Schema } from "mongoose";
const ProductVariationSchema = new Schema({
    M08_name: { type: String, required: true },
    M08_M05_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "M05_product", required: true },
    M08_is_active: { type: Number, default: 1 },
    M08_deleted_at: { type: Date, default: null },
}, {
    versionKey: false,
    timestamps: true,
});
export const ProductVariation = mongoose.model("M08_product_variation", ProductVariationSchema);
