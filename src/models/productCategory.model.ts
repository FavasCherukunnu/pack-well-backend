import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProductCategory extends Document {
    M04_category_name: string;
    M04_image: string|null;
    M04_M04_parent_category_id: mongoose.Schema.Types.ObjectId|null;
    M04_is_active: number;
    M04_deleted_at?: Date;
}

const ProductCategorySchema = new Schema<IProductCategory>({
    M04_category_name: { type: String, required: true },
    M04_image: { type: String,default:null },
    M04_M04_parent_category_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "M04_product_category",
        default:null
    },
    M04_is_active: { type: Number, default: 1 },
    M04_deleted_at: { type: Date, default: null },
}, {
    versionKey: false,
    timestamps: true,
});

ProductCategorySchema.pre('save',function (next) {
    if(this.M04_M04_parent_category_id){
        ProductCategory.findById(this.M04_M04_parent_category_id)
            .then((parentCategory) => {
                if(!parentCategory){
                    return next(new Error("M04_M04_parent_category_id is not valid"));
                }
                next();
            })
            .catch(next)
    }else{
        next();
    }

})

export const ProductCategory: Model<IProductCategory> = mongoose.model<IProductCategory>("M04_product_category", ProductCategorySchema);

