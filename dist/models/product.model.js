import mongoose, { Schema } from "mongoose";
import { ProductCategory } from "./productCategory.model.js";
const ProductSchema = new Schema({
    M05_product_name: { type: String, required: true },
    M05_image: { type: String, default: null },
    M05_M04_product_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "M04_product_category",
        default: null
    },
    M05_is_active: { type: Number, default: 1 },
    M05_deleted_at: { type: Date, default: null },
}, {
    versionKey: false,
    timestamps: true,
});
ProductSchema.pre('save', function (next) {
    if (this.M05_M04_product_category) {
        ProductCategory.findById(this.M05_M04_product_category)
            .then((category) => {
            if (!category) {
                return next(new Error("Category is not valid"));
            }
            next();
        })
            .catch(next);
    }
    else {
        next();
    }
});
export const Product = mongoose.model("M05_product", ProductSchema);
