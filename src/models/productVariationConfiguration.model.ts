import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductVariationConfiguration extends Document {
    M10_M05_product_id: mongoose.Schema.Types.ObjectId;
    M10_M06_product_sku_id: mongoose.Schema.Types.ObjectId;
    M10_M08_product_variation_id: mongoose.Schema.Types.ObjectId;
    M10_M09_variation_option_id: mongoose.Schema.Types.ObjectId;
    M10_is_active: number;
    M10_deleted_at?: Date;
}

const ProductVariationConfigurationSchema = new Schema<IProductVariationConfiguration>({
    M10_M05_product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "M05_product",
        required: true
    },
    M10_M06_product_sku_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "M06_product_sku",
        required: true
    },
    M10_M08_product_variation_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "M08_product_variation",
        required: true
    },
    M10_M09_variation_option_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "M09_product_variation_option",
        required: true
    },
    M10_is_active: { type: Number, default: 1 },
    M10_deleted_at: { type: Date, default: null },
}, {
    versionKey: false,
    timestamps: true,
});

ProductVariationConfigurationSchema.pre('save', function (next) {
    const { M10_M05_product_id, M10_M06_product_sku_id, M10_M08_product_variation_id, M10_M09_variation_option_id } = this;
    return Promise.all([
        mongoose.model("M05_product").findById(M10_M05_product_id),
        mongoose.model("M06_product_sku").findById(M10_M06_product_sku_id),
        mongoose.model("M08_product_variation").findById(M10_M08_product_variation_id),
        mongoose.model("M09_product_variation_option").findById(M10_M09_variation_option_id)
    ]).then(([product, productSku, productVariation, variationOption]) => {
        if (!product || !productSku || !productVariation || !variationOption) {
            return next(new Error("One of the ids is not valid"));
        }
        next();
    })
        .catch(next);
});

export const ProductVariationConfiguration: Model<IProductVariationConfiguration> = mongoose.model<IProductVariationConfiguration>("M10_product_variation_configuration", ProductVariationConfigurationSchema);

