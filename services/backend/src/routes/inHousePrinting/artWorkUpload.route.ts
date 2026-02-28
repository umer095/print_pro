import {Router} from 'express'
import { arrangeAndStoreArtwork,getUserHistory } from '../../controller/inHousePrinting/artWorkUpload.controller.js'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import multer from 'multer';
const router=Router()
const upload = multer({ 
    storage: multer.memoryStorage(),
});
router.post("/arrange", authMiddleware, upload.array('files'), arrangeAndStoreArtwork);
router.get("/",authMiddleware,getUserHistory)

export default router