import express from "express";
import { getDocument, createDocument, saveDocument } from "../controllers/document.controller";

const router = express.Router();

router.get("/:slug", getDocument);
router.post("/", createDocument);
router.patch("/:slug", saveDocument);

export default router;
