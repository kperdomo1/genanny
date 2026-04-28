"use client";

import { useRef, useState } from "react";

const MAX_IMAGES = 3;

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string, imageUrls?: string[]) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }

    const data = await res.json();
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if ((!trimmed && imageFiles.length === 0) || disabled || uploading) return;

    setUploading(true);
    setError(null);

    try {
      let imageUrls: string[] | undefined;

      if (imageFiles.length > 0) {
        const urls = await Promise.all(imageFiles.map(uploadImage));
        imageUrls = urls;
      }

      onSend(trimmed || "(image attached)", imageUrls);
      setValue("");
      setImageFiles([]);
      setImagePreviews([]);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${MAX_IMAGES} images per message.`);
      e.target.value = "";
      return;
    }

    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      setError(`You can attach up to ${MAX_IMAGES} images per message. ${files.length - remaining} image(s) were skipped.`);
    }

    setImageFiles((prev) => [...prev, ...toAdd]);

    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  const isDisabled = disabled || uploading;

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white px-4 py-3"
    >
      {/* Upload error */}
      {error && (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">&times;</button>
        </div>
      )}

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="mb-2 flex gap-2">
          {imagePreviews.map((preview, i) => (
            <div key={i} className="relative">
              <img
                src={preview}
                alt={`Attachment ${i + 1}`}
                className="h-20 w-20 rounded-lg object-cover border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white text-xs hover:bg-gray-600"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled || imageFiles.length >= MAX_IMAGES}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M1 8a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 8.07 3h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 16.07 6H17a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8Zm13.5 3a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask about your baby..."
          disabled={isDisabled}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isDisabled || (!value.trim() && imageFiles.length === 0)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
