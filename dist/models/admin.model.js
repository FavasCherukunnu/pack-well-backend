import mongoose, { Schema } from "mongoose";
import jwt from 'jsonwebtoken';
import uniqueValidator from 'mongoose-unique-validator';
const AdminSchema = new Schema({
    M01_name: { type: String, required: true },
    M01_email: { type: String, required: true, unique: true },
    M01_phone: { type: String, required: false, unique: true, },
    M01_address: { type: String, required: true },
    M01_role: { type: String, required: true },
    M01_password: { type: String, required: true },
    M01_is_active: { type: Number, default: 1 },
    M01_refresh_tocken: { type: String, default: null },
}, {
    versionKey: false,
    timestamps: true,
});
AdminSchema.methods.generateAccessToken = function () {
    return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
};
AdminSchema.methods.genereateRefreshToken = function () {
    return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
};
AdminSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' });
export const Admin = mongoose.model("M01_admin", AdminSchema);
