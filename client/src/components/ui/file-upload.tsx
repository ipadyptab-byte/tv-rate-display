import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onDrop: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Convert a comma-separated accept string (e.g. "image/*,video/*,.pdf")
 * into the object shape required by react-dropzone v14:
 * { "image/*": [], "video/*": [], ".pdf": [] }
 */
function toDropzoneAccept(accept?: string) {
  if (!accept) return undefined;
  const entries = accept
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (!entries.length) return undefined;

  const acc: Record<string, string[]> = {};
  for (const key of entries) {
    acc[key] = [];
  }
  return acc;
}

export function FileUpload({
  onDrop,
  accept,
  multiple = true,
  maxSize = 50 * 1024 * 1024, // 50MB
  className,
  children
}: FileUploadProps) {
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    onDrop(acceptedFiles);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: toDropzoneAccept(accept),
    multiple,
    maxSize
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer",
        isDragActive && "border-purple-500 bg-purple-50",
        className
      )}
    >
      <input {...getInputProps()} />
      {children || (
        <div>
          <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
          <p className="text-lg font-semibold text-gray-700">
            {isDragActive ? "Drop files here..." : "Drop files here or click to upload"}
          </p>
        </div>
      )}
    </div>
  );
}
