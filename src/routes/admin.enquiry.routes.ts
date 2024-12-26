import { Router } from "express";
import { z } from "zod";
import { validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { ContactusMarkAsReadController, ListContactUsController, ReadContactusController } from "../controllers/admin/enquiry.controller.js";

const router = Router();

const ListContactus = z.object({
    page: z.string().refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    }).default('1'),
    limit: z.string().refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    }).default('10'),
    sort: z.enum([
        'id',
        'm09_name',
        'm09_company_name',
        'm09_phone',
        'm09_enquiry',
        'm09_email',
        'm09_is_read',
        'created_at',
        'updated_at'
    ]).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
});


router.get('/enquiry-list', validateParamsMiddleWare(ListContactus), verifyJWTorRefreshJWT, ListContactUsController);
router.get('/enquiry/:id',  verifyJWTorRefreshJWT, ReadContactusController);
router.post('/enquiry-mark-as-read/:id',  verifyJWTorRefreshJWT, ContactusMarkAsReadController);


export { router as AdminEnquiryRouter };

