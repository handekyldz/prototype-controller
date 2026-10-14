import { ErrorNotice } from "../../components/ErrorNotice.tsx";

export type UploadPartialErrorProps = {
  failedFileNames: string[];
  onRetry: () => void;
};

/**
 * Adapter for the designer-owned ErrorNotice (visual-locked). Only maps state
 * data and the retry callback to existing props; never changes its markup or styles.
 */
export function UploadPartialError({ failedFileNames, onRetry }: UploadPartialErrorProps) {
  return <ErrorNotice {...partialErrorNoticeProps(failedFileNames, onRetry)} />;
}

export function partialErrorNoticeProps(failedFileNames: string[], onRetry: () => void) {
  const count = failedFileNames.length;
  return {
    title: count === 1 ? `${failedFileNames[0]} couldn't be uploaded` : `${count} files couldn't be uploaded`,
    message: "Your other files were uploaded successfully.",
    actionLabel: count === 1 ? "Retry upload" : `Retry ${count} files`,
    onAction: onRetry,
  };
}
