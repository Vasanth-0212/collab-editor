import { Request, Response } from "express";
import DocumentModel from "../models/Document";

/**
 * GET /api/documents/:slug
 * Returns the document if it exists, or 404.
 */
export const getDocument = async (req: Request, res: Response) => {
  try {
    const slug = (req.params.slug as string).toLowerCase();

    const doc = await DocumentModel.findOne({ slug });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    return res.status(200).json({ success: true, document: doc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/**
 * POST /api/documents
 * Creates a document for the given slug if it doesn't already exist.
 * Body: { slug, createdBy }
 */
export const createDocument = async (req: Request, res: Response) => {
  try {
    const { slug, createdBy } = req.body;

    if (!slug || !createdBy) {
      return res.status(400).json({ success: false, message: "slug and createdBy are required" });
    }

    const normalizedSlug = (slug as string).toLowerCase().trim();

    // Return existing document instead of erroring on duplicate
    const existing = await DocumentModel.findOne({ slug: normalizedSlug });
    if (existing) {
      return res.status(200).json({ success: true, document: existing });
    }

    const doc = await DocumentModel.create({
      slug: normalizedSlug,
      createdBy,
      lines: [{ index: 0, content: "" }],
    });

    return res.status(201).json({ success: true, document: doc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/**
 * PATCH /api/documents/:slug
 * Saves the full content as an array of lines.
 * Body: { lines: Array<{ index: number; content: string }> }
 */
export const saveDocument = async (req: Request, res: Response) => {
  try {
    const slug = (req.params.slug as string).toLowerCase();
    const { lines } = req.body;

    if (!Array.isArray(lines)) {
      return res.status(400).json({ success: false, message: "lines must be an array" });
    }

    const doc = await DocumentModel.findOneAndUpdate(
      { slug },
      { $set: { lines } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    return res.status(200).json({ success: true, document: doc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
