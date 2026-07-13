"use server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export interface Line {
  index: number;
  content: string;
}

export interface DocumentData {
  _id: string;
  slug: string;
  lines: Line[];
  createdBy: string;
}

// Fetch an existing document by slug, or null if not found
export async function fetchDocument(slug: string): Promise<DocumentData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/documents/${slug}`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    const data = await res.json();
    return data.success ? data.document : null;
  } catch {
    return null;
  }
}

// Create a new document for this slug
export async function createDocument(
  slug: string,
  createdBy: string
): Promise<DocumentData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, createdBy }),
    });
    const data = await res.json();
    return data.success ? data.document : null;
  } catch {
    return null;
  }
}

// Save lines to an existing document
export async function saveDocument(
  slug: string,
  lines: Line[]
): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/documents/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
