import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductSKUImage extends Document {
    M07_image_path: string;
    M07_M06_product_sku_id: mongoose.Schema.Types.ObjectId;
    M07_order: number;
    M07_is_active: number;
    M07_deleted_at?: Date;
}

const ProductSKUImageSchema = new Schema<IProductSKUImage>({
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

export const ProductSKUImage: Model<IProductSKUImage> = mongoose.model<IProductSKUImage>("M07_product_sku_image", ProductSKUImageSchema);

