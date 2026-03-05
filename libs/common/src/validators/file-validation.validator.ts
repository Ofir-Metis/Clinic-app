/**
 * File validation utilities for file uploads
 * Provides type-safe validators for file type and size constraints
 */

import { BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export const AUDIO_VIDEO_MIME_TYPES = [
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'video/webm',
  'video/mp4',
] as const;

export const GENERAL_FILE_MIME_TYPES = [
  ...AUDIO_VIDEO_MIME_TYPES,
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MAX_AUDIO_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_GENERAL_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate file type against allowed MIME types
 */
export function validateFileType(
  file: Express.Multer.File,
  allowedMimeTypes: readonly string[],
): void {
  if (!file.mimetype) {
    throw new BadRequestException('File MIME type is required');
  }

  const isAllowed = allowedMimeTypes.includes(file.mimetype);
  if (!isAllowed) {
    throw new BadRequestException(
      `File type '${file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
    );
  }
}

/**
 * Validate file size against max size
 */
export function validateFileSize(
  file: Express.Multer.File,
  maxSizeBytes: number,
): void {
  if (!file.size || file.size === 0) {
    throw new BadRequestException('File is empty');
  }

  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new BadRequestException(
      `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
    );
  }
}

/**
 * Validate file extension against allowed extensions
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: readonly string[],
): void {
  if (!filename) {
    throw new BadRequestException('Filename is required');
  }

  const extension = filename.toLowerCase().split('.').pop();
  if (!extension || !allowedExtensions.includes(`.${extension}`)) {
    throw new BadRequestException(
      `File extension '.${extension}' is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
    );
  }
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  file: Express.Multer.File,
  options: FileValidationOptions = {},
): void {
  const {
    maxSizeBytes = MAX_GENERAL_FILE_SIZE,
    allowedMimeTypes = GENERAL_FILE_MIME_TYPES as unknown as string[],
    allowedExtensions,
  } = options;

  validateFileSize(file, maxSizeBytes);
  validateFileType(file, allowedMimeTypes);

  if (allowedExtensions && file.originalname) {
    validateFileExtension(file.originalname, allowedExtensions);
  }
}

/**
 * Validate audio/video file for voice notes
 */
export function validateAudioVideoFile(file: Express.Multer.File): void {
  validateFile(file, {
    maxSizeBytes: MAX_AUDIO_VIDEO_SIZE,
    allowedMimeTypes: AUDIO_VIDEO_MIME_TYPES as unknown as string[],
    allowedExtensions: ['.wav', '.webm', '.ogg', '.mp3', '.mpeg', '.mp4', '.m4a'],
  });
}

/**
 * Extract file extension from key/filename
 */
export function getFileExtension(key: string): string | null {
  const parts = key.split('.');
  if (parts.length < 2) return null;
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Validate file key has audio/video extension
 */
export function validateAudioVideoKey(key: string): void {
  const ext = getFileExtension(key);
  const allowedExtensions = ['wav', 'webm', 'ogg', 'mp3', 'mpeg', 'mp4', 'm4a'];

  if (!ext || !allowedExtensions.includes(ext)) {
    throw new BadRequestException(
      `File key must have audio/video extension. Allowed: ${allowedExtensions.join(', ')}`,
    );
  }
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
