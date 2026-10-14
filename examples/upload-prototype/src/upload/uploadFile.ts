export type UploadResult = { fileId: string };

/** Mock upload: resolves after a short delay. Never calls a real API. */
export function uploadFile(file: File): Promise<UploadResult> {
  const delay = 600 + Math.random() * 900;
  return new Promise((resolve) => {
    setTimeout(() => resolve({ fileId: `${file.name}-${Date.now()}` }), delay);
  });
}
