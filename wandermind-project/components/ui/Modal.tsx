"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/utils";
import { Icon } from "./Icon";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "animate-fade-up max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border hairline surface shadow-lift sm:rounded-3xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-xl"
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b hairline bg-[rgb(var(--surface))]/95 px-5 py-4 backdrop-blur-xl">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs fg-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="btn-quiet -mr-1 rounded-lg p-2" aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && (
          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t hairline bg-[rgb(var(--surface))]/95 px-5 py-3.5 backdrop-blur-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Delete",
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  pending?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={pending}>
            {pending ? <Icon name="loader" size={15} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed fg-muted">{body}</p>
    </Modal>
  );
}
