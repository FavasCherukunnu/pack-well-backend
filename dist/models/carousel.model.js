import mongoose, { Schema } from "mongoose";
const CarouselSchema = new Schema({
    P02_name: { type: String, required: true },
    P02_image: { type: String, required: true },
    P02_order: { type: Number, required: true },
    deleted_at: { type: Date, default: null },
}, {
    timestamps: true,
});
export const CarouselModel = mongoose.model("P02_carousel", CarouselSchema);
