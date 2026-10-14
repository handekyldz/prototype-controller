import { useController, useRuntimeState } from "@prototype-controller/react";
import type { UploadItem } from "../upload/useUpload.ts";

/**
 * Resource adapter for useUpload: while a scenario is active, files come from the
 * simulated runtime instead of uploadFile(). Returns null otherwise (original flow).
 * Failed files are left out of the list; the partial-error state shows them.
 */
export function useControlledUpload() {
  const controller = useController();
  const state = useRuntimeState();
  if (!controller || !state?.scenario) return null;

  const items: UploadItem[] = state.files
    .filter((f) => f.status !== "error")
    .map((f) => ({ id: f.id, name: f.name, size: f.size, status: f.status === "done" ? "done" : "uploading" }));

  function addFiles(files: File[]) {
    controller!.dispatch({
      type: "SELECT_FILES",
      files: files.map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size })),
    });
  }

  return { items, isUploading: state.files.some((f) => f.status === "uploading"), addFiles };
}
