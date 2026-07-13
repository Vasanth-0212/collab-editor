import mongoose, { Schema, Document, Types, model } from "mongoose";

// A single line in the document
export interface ILine {
  index: number;   // position of this line (0-based)
  content: string; // text on this line
}

export interface IDocument extends Document {
  slug: string;
  lines: ILine[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lineSchema = new Schema<ILine>(
  {
    index: { type: Number, required: true },
    content: { type: String, default: "" },
  },
  { _id: false } // no separate _id per line — the index is the identifier
);

const documentSchema = new Schema<IDocument>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    lines: {
      type: [lineSchema],
      default: [{ index: 0, content: "" }], // every new doc starts with one empty line
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DocumentModel = model<IDocument>("Document", documentSchema);
export default DocumentModel;
