import type { ChangeEvent } from "react";
import { FileList } from "./FileList.tsx";
import { useUpload } from "./useUpload.ts";
import { FileListStateSlot } from "../prototype/FileListStateSlot.tsx";

export function UploadPanel() {
  const { items, isUploading, addFiles } = useUpload();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) addFiles(files);
    event.target.value = "";
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <h2 id="upload-title">Your documents</h2>
      <label className="upload-picker">
        <span>Choose files</span>
        <input type="file" multiple onChange={handleChange} />
      </label>
      {isUploading && <p className="upload-progress">Uploading files…</p>}
      <FileList items={items} />
      <FileListStateSlot />
    </section>
  );
}
