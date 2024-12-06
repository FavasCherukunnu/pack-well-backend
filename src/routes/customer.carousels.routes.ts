import { Router } from "express";
import { carouselListCustomerController } from "../controllers/customer/carousels.controllers.js";

const router = Router();

router.get('/carousels',
    carouselListCustomerController
);


export { router as CustomerCarouselRouterCustomer };

