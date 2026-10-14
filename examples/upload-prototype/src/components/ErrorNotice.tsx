import "./ErrorNotice.css";

type ErrorNoticeProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorNotice({ title, message, actionLabel, onAction }: ErrorNoticeProps) {
  return (
    <div className="error-notice" role="alert">
      <p className="error-notice__title">{title}</p>
      <p className="error-notice__message">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="error-notice__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
