"use client";

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

export interface ImageUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  value?: ImageFile[];
  onChange?: (files: ImageFile[]) => void;
  className?: string;
}

function ImageUpload({
  maxFiles = 5,
  maxSizeMB = 5,
  accept = "image/jpeg,image/png,image/gif,image/webp",
  value = [],
  onChange,
  className,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList) => {
      setError(null);
      const maxBytes = maxSizeMB * 1024 * 1024;
      const newFiles: ImageFile[] = [];

      const remaining = maxFiles - value.length;
      if (remaining <= 0) {
        setError(`最多只能上傳 ${maxFiles} 張圖��`);
        return;
      }

      for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
        const file = fileList[i];
        if (file.size > maxBytes) {
          setError(`圖片「${file.name}」超過 ${maxSizeMB}MB 限制`);
          continue;
        }
        if (!file.type.startsWith("image/")) {
          setError(`「${file.name}」不是有效的圖片檔案`);
          continue;
        }
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        });
      }

      if (newFiles.length > 0) {
        onChange?.([...value, ...newFiles]);
      }
    },
    [maxFiles, maxSizeMB, value, onChange]
  );

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = value.find((f) => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    onChange?.(value.filter((f) => f.id !== id));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            拖放圖片到此處或點擊上傳
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            支援 JPG, PNG, GIF, WebP（最大 {maxSizeMB}MB，最多 {maxFiles} 張）
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={img.preview}
                alt="上傳預覽"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(img.id);
                }}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { ImageUpload };
