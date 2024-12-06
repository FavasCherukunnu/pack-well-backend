import mongoose, { Schema } from "mongoose";
const ProductSKUImageSchema = new Schema({
    M07_image_path: { type: String, required: true },
    M07_M06_product_sku_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "M06_product_sku",
        required: true
    },
    M07_order: { type: Number, default: 0 },
    M07_is_active: { type: Number, default: 1 },
    M07_deleted_at: { type: Date, default: null },
}, {
    versionKey: false,
    timestamps: true,
});
export const ProductSKUImage = mongoose.model("M07_product_sku_image", ProductSKUImageSchema);
