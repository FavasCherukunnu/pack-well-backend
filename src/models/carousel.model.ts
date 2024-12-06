import mongoose, { Document, Model, Schema } from "mongoose";

interface ICarousel {
    P02_name: string;
    P02_image: string;
    P02_order: number;
    deleted_at: Date | null;
    
}

const CarouselSchema: Schema<ICarousel> = new Schema(
    {
        P02_name: { type: String, required: true },
        P02_image: { type: String, required: true },
        P02_order: { type: Number,  required: true },
        deleted_at: { type: Date, default: null },
    },
    {
        timestamps:true,
    }
);

export const CarouselModel: Model<ICarousel> = mongoose.model<ICarousel>("P02_carousel", CarouselSchema);
