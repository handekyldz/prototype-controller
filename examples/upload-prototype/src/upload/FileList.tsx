import type { UploadItem } from "./useUpload.ts";

type FileListProps = { items: UploadItem[] };

export function FileList({ items }: FileListProps) {
  if (items.length === 0) {
    return <p className="file-list-empty">No files uploaded yet.</p>;
  }

  return (
    <ul className="file-list">
      {items.map((item) => (
        <li key={item.id} className={`file-row file-row--${item.status}`}>
          <span className="file-name">{item.name}</span>
          <span className="file-size">{Math.ceil(item.size / 1024)} KB</span>
          <span className="file-status">{item.status === "uploading" ? "Uploading…" : "Uploaded"}</span>
        </li>
      ))}
    </ul>
  );
}
