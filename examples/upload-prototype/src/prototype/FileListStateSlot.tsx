import { useController, useRuntimeState, useTargetState } from "@prototype-controller/react";
import { registry } from "./registry.ts";

/** Renders the bound component for `upload.file-list`, or nothing (baseline UI). */
export function FileListStateSlot() {
  const controller = useController();
  const state = useRuntimeState();
  const target = useTargetState("upload.file-list");
  const failed = state?.files.filter((f) => f.status === "error") ?? [];

  switch (target?.binding?.componentKey) {
    case "UploadPartialError":
      if (failed.length === 0) return null;
      return (
        <registry.UploadPartialError
          failedFileNames={failed.map((f) => f.name)}
          onRetry={() => controller?.dispatch({ type: "RETRY_FAILED_FILE" })}
        />
      );
    case "GeneratedFileListLoading":
      return <registry.GeneratedFileListLoading />;
    case "ReferenceFileTooLarge":
      return <registry.ReferenceFileTooLarge fileName="example.mov" maxSizeMb={25} />;
    default:
      return null;
  }
}
