"use client";

import { useRef } from "react";
import { WaterAction } from "@/components/WaterSurface";
import { acceptAttr, isAllowedFile, isImageFile, MAX_ATTACH_FILES } from "@/lib/files";

export function AttachButton({
  files,
  onFiles,
  disabled,
  onError,
}: {
  files: File[];
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function add(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    let skipped = "";
    for (const file of Array.from(list)) {
      if (!isAllowedFile(file) && !isImageFile(file)) {
        skipped = `${file.name} isn’t a supported file type`;
        continue;
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      if (next.length >= MAX_ATTACH_FILES) {
        skipped = `You can attach up to ${MAX_ATTACH_FILES} files.`;
        break;
      }
      next.push(file);
    }
    if (next.length === files.length) {
      onError?.(skipped || "That file didn’t attach. Try a photo, PDF, or text file.");
      return;
    }
    onFiles(next);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr()}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <WaterAction
        type="button"
        className="action-btn action-btn--icon"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <ClipIcon />
        <span className="sr-only">Attach a file</span>
      </WaterAction>
    </>
  );
}

export function AttachList({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (file: File) => void;
}) {
  if (!files.length) return null;
  return (
    <ul className="attach-list" aria-label="Attached files">
      {files.map((file) => (
        <AttachChip
          key={`${file.name}-${file.size}-${file.lastModified}`}
          file={file}
          onRemove={() => onRemove(file)}
        />
      ))}
    </ul>
  );
}

function AttachChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <li className="attach-chip">
      <span className="attach-chip__name">{file.name}</span>
      <button type="button" className="attach-chip__x" onClick={onRemove} aria-label={`Remove ${file.name}`}>
        ×
      </button>
    </li>
  );
}

function ClipIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M16.5 6.5v10.25a4.25 4.25 0 1 1-8.5 0V7.75a2.75 2.75 0 1 1 5.5 0v8.5a1.25 1.25 0 1 1-2.5 0V8.5a.75.75 0 0 0-1.5 0v7.75a2.75 2.75 0 1 0 5.5 0v-8.5a4.25 4.25 0 1 0-8.5 0v8.75a5.75 5.75 0 1 0 11.5 0V6.5a.75.75 0 0 0-1.5 0Z"
      />
    </svg>
  );
}
