import mongoose, { Document, Schema } from "mongoose";
import jwt from 'jsonwebtoken'

export interface IUser extends Document {
    M02_name: string;
    M02_phone_no: string;
    M02_email: string;
    M02_is_active: number;
    M02_deleted_at: Date | null;
    generateAccessToken: () => string;
    genereateRefreshToken: () => string;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        M02_name: { type: String, required: true },
        M02_phone_no: { type: String },
        M02_email: { type: String },
        M02_is_active: { type: Number, default: 1 },
        M02_deleted_at: { type: Date, default: null },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);



UserSchema.methods.generateAccessToken = function () {
    
    return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })

     

}
UserSchema.methods.genereateRefreshToken = function () {
    
    return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })

}


export const User = mongoose.model<IUser>("M02_user", UserSchema);
