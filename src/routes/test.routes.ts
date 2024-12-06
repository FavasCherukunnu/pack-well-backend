import { Router } from "express";
import { testController } from "../controllers/test.conrollers.js";

const router = Router();

router.get('/',testController);


export { router  as TestRouter}