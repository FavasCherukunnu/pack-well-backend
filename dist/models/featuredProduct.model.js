import mongoose, { Schema } from "mongoose";
const FeaturedProductSchema = new Schema({
    P01_M06_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "M06_product_sku", required: true },
    P01_is_active: { type: Number, default: 1 },
    P01_order: { type: Number, required: true },
    P01_created_at: { type: Date, default: Date.now },
    P01_updated_at: { type: Date, default: Date.now },
    P01_deleted_at: { type: Date, default: null },
}, {
    timestamps: false,
});
export const FeaturedProductModel = mongoose.model("P01_featured_products", FeaturedProductSchema);
