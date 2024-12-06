import mongoose, { Document, Model, Schema } from "mongoose";

interface IFeaturedProduct {
    P01_M06_product_id: mongoose.Schema.Types.ObjectId;
    P01_is_active: number;
    P01_order: number;
    P01_created_at: Date;
    P01_updated_at: Date;
    P01_deleted_at: Date | null;
}

const FeaturedProductSchema: Schema<IFeaturedProduct> = new Schema(
    {
        P01_M06_product_id: { type: mongoose.Schema.Types.ObjectId, ref: "M06_product_sku", required: true },
        P01_is_active: { type: Number, default: 1 },
        P01_order: { type: Number, required: true },
        P01_created_at: { type: Date, default: Date.now },
        P01_updated_at: { type: Date, default: Date.now },
        P01_deleted_at: { type: Date, default: null },
    },
    {
        timestamps: false,
    }
);

export const FeaturedProductModel: Model<IFeaturedProduct> = mongoose.model<IFeaturedProduct>("P01_featured_products", FeaturedProductSchema);

