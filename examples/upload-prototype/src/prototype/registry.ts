import type { ComponentType } from "react";
import { UploadPartialError } from "./adapters/UploadPartialError.tsx";
import { GeneratedFileListLoading } from "./generated/GeneratedFileListLoading.tsx";
import { ReferenceFileTooLarge } from "./reference/ReferenceFileTooLarge.tsx";

/** Build-time registry: bindings reference components only through these keys. */
export const registry = {
  UploadPartialError,
  GeneratedFileListLoading,
  ReferenceFileTooLarge,
} satisfies Record<string, ComponentType<never>>;

export type ComponentKey = keyof typeof registry;
