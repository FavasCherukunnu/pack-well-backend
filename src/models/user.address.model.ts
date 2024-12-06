import mongoose, { Schema, Document } from "mongoose";

interface IUserAddress extends Document {
  M11_M02_user_id: mongoose.Schema.Types.ObjectId;
  M11_name: string;
  M11_postal_code: string;
  M11_phone_no: string;
  M11_address: string;
  M11_email: string;
  M11_is_active: number;
  M11_is_default: number;
  M11_deleted_at?: Date;
}

const UserAddressSchema: Schema<IUserAddress> = new Schema(
  {
    M11_M02_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "M02_user", required: true },
    M11_name: { type: String},
    M11_postal_code: { type: String, maxlength: 50 },
    M11_phone_no: { type: String, maxlength: 50 },
    M11_address: { type: String, maxlength: 50 },
    M11_email: { type: String, maxlength: 50 },
    M11_is_active: { type: Number, default: 1 },
    M11_is_default: { type: Number },
    M11_deleted_at: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const UserAddress = mongoose.model<IUserAddress>("M11_user_address", UserAddressSchema);
