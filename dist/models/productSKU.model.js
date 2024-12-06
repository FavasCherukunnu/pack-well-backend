import mongoose, { Schema } from "mongoose";
const ProductSKUSchema = new Schema({
    M06_sku: {
        type: String, required: true,
        validate: {
            validator: async function (value) {
                // Check if SKU already exists with `M06_deleted_at: null`
                // Import the model directly and check for uniqueness
                const existingSKU = await ProductSKU.findOne({
                    M06_sku: value,
                    M06_deleted_at: null
                });
                return !existingSKU;
            },
            message: "sku already exists",
        },
    },
    M06_product_sku_name: { type: String, required: true },
    M06_description: { type: String, required: true },
    M06_thumbnail_image: { type: String, default: null },
    M06_MRP: { type: Number, required: true },
    M06_price: { type: Number, required: true },
    M06_quantity: { type: Number, required: true },
    M06_is_new: { type: Boolean, default: false },
    M06_single_order_limit: { type: Number, default: null },
    M06_is_active: { type: Number, default: 1 },
    M06_deleted_at: { type: Date, default: null },
    M06_M05_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "M05_product", required: true },
}, {
    versionKey: false,
    timestamps: true,
});
export const ProductSKU = mongoose.model("M06_product_sku", ProductSKUSchema);
