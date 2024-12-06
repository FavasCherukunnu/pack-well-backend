import mongoose, { Schema } from "mongoose";
import AutoIncrementFactory from 'mongoose-sequence';
// Create a Mongoose connection
const connection = mongoose.createConnection(process.env.MONGODB_URI);
// Initialize the AutoIncrement plugin with the connection
const AutoIncrement = AutoIncrementFactory(connection);
const SalesOrderSchema = new Schema({
    O03_order_id: { type: Number, unique: true },
    O03_M02_user_id: { type: Schema.Types.ObjectId, required: true, ref: "M02_user" },
    O03_customer_name: { type: String, required: true, maxlength: 100 },
    O03_customer_address: { type: String, required: true, maxlength: 50 },
    O03_description: { type: String, default: null },
    O03_phone_number: { type: String, required: true, maxlength: 100 },
    O03_email: { type: String, required: true, maxlength: 100 },
    O03_M01_cancelled_by: { type: Schema.Types.ObjectId, default: null, ref: "m01_admins" },
    O03_P01_payment_type_id: { type: Schema.Types.ObjectId, required: true, ref: "P01_payment_types" },
    O03_O01_shiping_method: { type: Schema.Types.ObjectId, required: true, ref: "o01_Shiping_methods" },
    O03_Delivery_charge: { type: Number, required: true },
    O03_total_price: { type: Number, required: true },
    O03_discount_price: { type: Number, required: true },
    O03_tax_price: { type: Number, required: true },
    O03_sale_date: { type: Date, required: true },
    O03_completed: { type: Number, required: true },
    O03_cancelled: { type: Number, required: true },
    O03_order_source: {
        type: String,
        required: true,
        maxlength: 100,
        enum: ["Ecommerce"]
    },
    O03_O02_order_status: { type: Number, required: true, ref: "O02_order_statuses" },
    deleted_at: { type: Date, default: null },
}, {
    timestamps: true,
});
SalesOrderSchema.plugin(AutoIncrement, { inc_field: 'O03_order_id', start_seq: 30000 });
export const SalesOrderModel = mongoose.model("O03_sales_orders", SalesOrderSchema);
