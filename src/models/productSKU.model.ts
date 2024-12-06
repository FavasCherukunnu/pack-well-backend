import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductSKU extends Document {
    M06_sku: string;
    M06_product_sku_name: string;
    M06_description: string;
    M06_thumbnail_image: string | null;
    M06_MRP: number;
    M06_price: number;
    M06_quantity: number;
    M06_is_new: boolean;
    M06_single_order_limit: number|null;
    M06_is_active: number;
    M06_deleted_at?: Date;
    M06_M05_product_id: mongoose.Schema.Types.ObjectId;
}

const ProductSKUSchema = new Schema<IProductSKU>({
    M06_sku: {
        type: String, required: true,
        validate: {
            validator: async function (value: string) {
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

export const ProductSKU: Model<IProductSKU> = mongoose.model<IProductSKU>("M06_product_sku", ProductSKUSchema);

