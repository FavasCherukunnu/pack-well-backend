import mongoose, { Schema } from "mongoose";
const ProductVariationOptionSchema = new Schema({
    M09_name: { type: String, required: true },
    M09_M05_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "M05_product", required: true },
    M09_M08_product_variation_id: { type: mongoose.Schema.Types.ObjectId, ref: "M08_product_variation", required: true },
    M09_is_active: { type: Number, default: 1 },
    M09_deleted_at: { type: Date, default: null },
}, {
    versionKey: false,
    timestamps: true,
});
export const ProductVariationOption = mongoose.model("M09_product_variation_option", ProductVariationOptionSchema);
