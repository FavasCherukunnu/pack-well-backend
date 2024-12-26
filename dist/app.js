import cookieParser from "cookie-parser";
import cors from 'cors';
import dotenv from "dotenv";
import express from "express";
import { errorHandlingMiddleware } from "./middlewares/errorHandling.middleware.js";
import { ProductCategoryRouter } from "./routes/admin.productcategory.routes.js";
import { ProductSKURouter } from "./routes/admin.productSKU.routes.js";
import { ProductVariationRouter } from "./routes/admin.productVariation.routes.js";
import { AdminRouter } from "./routes/admin.routes.js";
import { ProductSKURouterCustomer } from "./routes/customer.productSKU.routes.js";
import { TestRouter } from "./routes/test.routes.js";
import { ProductCategoryRouterCustomer } from "./routes/customer.productcategory.routes.js";
import session from "express-session";
import { CustomerRouter } from "./routes/customer.routes.js";
import { AdminOrderRouterCustomer } from "./routes/admin.order.routes.js";
import { AdminCarouselRouterCustomer } from "./routes/admin.carousels.routes.js";
import { CustomerCarouselRouterCustomer } from "./routes/customer.carousels.routes.js";
import { AdminFeaturedProductRouter } from "./routes/admin.featuredProduct.routes.js";
import { customerFeaturedProductRouter } from "./routes/customer.featuredProduct.routes.js";
import { PrismaClient } from "@prisma/client";
import { EnquiryRouterCustomer } from "./routes/customer.enquiry.routes.js";
import { configurationController } from "./routes/admin.configuration.routes.js";
import { AdminEnquiryRouter } from "./routes/admin.enquiry.routes.js";
export const prisma = new PrismaClient();
const allowedOrigins = process.env.CORS_ORIGIN.split(',');
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., server-to-server requests) or if origin is in allowedOrigins
        if (!origin || allowedOrigins.includes(origin.trim())) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    exposedHeaders: ['Authorization'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
// configures dotenv to work in your application
dotenv.config();
const app = express();
app.use(cookieParser());
app.use(cors(corsOptions));
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true,
//     exposedHeaders:['Authorization'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
// }))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
// Configure express-session with default in-memory store
app.use(session({
    secret: process.env.SESSION_STORE_SECRET, // Replace with a strong secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 5 * 60 * 1000 }, // Session expires in 5 minutes
}));
app.use('/test', TestRouter);
app.use('/api/v1/admin', AdminRouter, ProductCategoryRouter, ProductVariationRouter, ProductSKURouter, AdminOrderRouterCustomer, AdminCarouselRouterCustomer, AdminFeaturedProductRouter, configurationController, AdminEnquiryRouter);
app.use('/api/v1/customer', CustomerRouter, ProductSKURouterCustomer, ProductCategoryRouterCustomer, CustomerCarouselRouterCustomer, customerFeaturedProductRouter, EnquiryRouterCustomer);
app.use(errorHandlingMiddleware);
export { app };
