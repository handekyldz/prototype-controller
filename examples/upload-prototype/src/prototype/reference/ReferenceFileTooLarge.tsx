import "./ReferenceFileTooLarge.css";

type ReferenceFileTooLargeProps = {
  fileName: string;
  maxSizeMb: number;
};

/**
 * Proposed from .prototype-controller/references/file-too-large.md.
 * Status needs-review: not accepted by the designer yet.
 */
export function ReferenceFileTooLarge({ fileName, maxSizeMb }: ReferenceFileTooLargeProps) {
  return (
    <ul className="file-list">
      <li className="file-row reference-file-too-large">
        <span className="file-name">{fileName}</span>
        <span className="reference-file-too-large__message">Too large. Maximum size is {maxSizeMb} MB.</span>
      </li>
    </ul>
  );
}
