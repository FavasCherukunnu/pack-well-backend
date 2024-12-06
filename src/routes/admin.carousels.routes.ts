import { Router } from "express";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { validateDataMiddleWare, validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { z } from "zod";
import { carouselListAdminController, createCarouselAdminController, deleteCarouselAdminController, reorderCarouselsAdminController, updateCarouselAdminController } from "../controllers/admin/carousels.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get('/carousels',
    verifyJWTorRefreshJWT,
    carouselListAdminController
);
router.post('/carousel',
    verifyJWTorRefreshJWT,
    upload.fields([{ name: "P02_image", maxCount: 1 }]),
    validateDataMiddleWare(z.object({
        P02_name: z.string().min(2, "Name is required and must be at least 2 characters long"),
    })),
    createCarouselAdminController
);
router.put('/carousel/:id',
    verifyJWTorRefreshJWT,
    upload.fields([{ name: "P02_image", maxCount: 1 }]),
    validateDataMiddleWare(z.object({
        P02_name: z.string().min(2, "Name is required and must be at least 2 characters long"),
    })),
    updateCarouselAdminController
);
router.delete('/carousel/:id',
    verifyJWTorRefreshJWT,
    deleteCarouselAdminController
);
router.put('/carousel-reorder',
    verifyJWTorRefreshJWT,
    validateDataMiddleWare(z.object({
        carousels: z.array(z.object({
            _id: z.string(),
        })).min(1, "At least one carousel is required"),
    })),
    reorderCarouselsAdminController
);


export { router as AdminCarouselRouterCustomer };

