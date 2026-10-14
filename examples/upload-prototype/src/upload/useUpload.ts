import { useState } from "react";
import { uploadFile } from "./uploadFile.ts";

export type UploadStatus = "uploading" | "done";

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
};

export function useUpload() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const isUploading = items.some((item) => item.status === "uploading");

  function addFiles(files: File[]) {
    const added = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: "uploading" as const,
    }));
    setItems((prev) => [...prev, ...added]);

    // All selected files upload in parallel.
    added.forEach((item, index) => {
      uploadFile(files[index]!).then(() => {
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)));
      });
    });
  }

  return { items, isUploading, addFiles };
}
