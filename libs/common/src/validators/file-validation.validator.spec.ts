import { BadRequestException } from '@nestjs/common';
import {
  validateFile,
  validateFileType,
  validateFileSize,
  validateFileExtension,
  validateAudioVideoFile,
  validateAudioVideoKey,
  getFileExtension,
  formatBytes,
  MAX_AUDIO_VIDEO_SIZE,
  MAX_GENERAL_FILE_SIZE,
  AUDIO_VIDEO_MIME_TYPES,
} from './file-validation.validator';

describe('File Validation Utilities', () => {
  describe('validateFileType', () => {
    it('should accept allowed MIME types', () => {
      const file = {
        mimetype: 'audio/webm',
        size: 1000,
      } as Express.Multer.File;

      expect(() => validateFileType(file, AUDIO_VIDEO_MIME_TYPES as unknown as string[])).not.toThrow();
    });

    it('should reject disallowed MIME types', () => {
      const file = {
        mimetype: 'application/x-executable',
        size: 1000,
      } as Express.Multer.File;

      expect(() => validateFileType(file, AUDIO_VIDEO_MIME_TYPES as unknown as string[])).toThrow(
        BadRequestException,
      );
    });

    it('should reject files without MIME type', () => {
      const file = {
        size: 1000,
      } as Express.Multer.File;

      expect(() => validateFileType(file, AUDIO_VIDEO_MIME_TYPES as unknown as string[])).toThrow(
        'File MIME type is required',
      );
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const file = {
        mimetype: 'audio/webm',
        size: 1000,
      } as Express.Multer.File;

      expect(() => validateFileSize(file, 10000)).not.toThrow();
    });

    it('should reject files exceeding size limit', () => {
      const file = {
        mimetype: 'audio/webm',
        size: 200 * 1024 * 1024, // 200MB
      } as Express.Multer.File;

      expect(() => validateFileSize(file, MAX_AUDIO_VIDEO_SIZE)).toThrow(BadRequestException);
      expect(() => validateFileSize(file, MAX_AUDIO_VIDEO_SIZE)).toThrow(/exceeds maximum allowed size/);
    });

    it('should reject empty files', () => {
      const file = {
        mimetype: 'audio/webm',
        size: 0,
      } as Express.Multer.File;

      expect(() => validateFileSize(file, 10000)).toThrow('File is empty');
    });
  });

  describe('validateFileExtension', () => {
    it('should accept allowed extensions', () => {
      expect(() => validateFileExtension('test.webm', ['.webm', '.wav', '.mp3'])).not.toThrow();
      expect(() => validateFileExtension('recording.WAV', ['.webm', '.wav', '.mp3'])).not.toThrow();
    });

    it('should reject disallowed extensions', () => {
      expect(() => validateFileExtension('test.exe', ['.webm', '.wav', '.mp3'])).toThrow(
        BadRequestException,
      );
      expect(() => validateFileExtension('file.sh', ['.webm', '.wav', '.mp3'])).toThrow(
        /not allowed/,
      );
    });

    it('should handle files without extension', () => {
      expect(() => validateFileExtension('noextension', ['.webm'])).toThrow(BadRequestException);
    });

    it('should reject empty filename', () => {
      expect(() => validateFileExtension('', ['.webm'])).toThrow('Filename is required');
    });
  });

  describe('validateAudioVideoFile', () => {
    it('should accept valid audio files within size limit', () => {
      const file = {
        mimetype: 'audio/webm',
        size: 50 * 1024 * 1024, // 50MB
        originalname: 'recording.webm',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file)).not.toThrow();
    });

    it('should accept valid video files', () => {
      const file = {
        mimetype: 'video/webm',
        size: 80 * 1024 * 1024, // 80MB
        originalname: 'recording.webm',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file)).not.toThrow();
    });

    it('should reject audio files exceeding 100MB', () => {
      const file = {
        mimetype: 'audio/wav',
        size: 150 * 1024 * 1024, // 150MB
        originalname: 'recording.wav',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file)).toThrow(BadRequestException);
      expect(() => validateAudioVideoFile(file)).toThrow(/exceeds maximum allowed size/);
    });

    it('should reject non-audio/video MIME types', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 1000,
        originalname: 'document.pdf',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file)).toThrow(BadRequestException);
      expect(() => validateAudioVideoFile(file)).toThrow(/not allowed/);
    });

    it('should reject audio files with wrong extension', () => {
      const file = {
        mimetype: 'audio/webm',
        size: 1000,
        originalname: 'recording.exe',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file)).toThrow(BadRequestException);
    });
  });

  describe('validateFile (general)', () => {
    it('should accept files with default limits', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB
        originalname: 'document.pdf',
      } as Express.Multer.File;

      expect(() => validateFile(file)).not.toThrow();
    });

    it('should reject files exceeding 10MB general limit', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 15 * 1024 * 1024, // 15MB
        originalname: 'document.pdf',
      } as Express.Multer.File;

      expect(() => validateFile(file)).toThrow(BadRequestException);
    });

    it('should respect custom size limits', () => {
      const file = {
        mimetype: 'application/pdf',
        size: 6 * 1024 * 1024, // 6MB
        originalname: 'document.pdf',
      } as Express.Multer.File;

      expect(() =>
        validateFile(file, {
          maxSizeBytes: 5 * 1024 * 1024,
          allowedMimeTypes: ['application/pdf'],
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateAudioVideoKey', () => {
    it('should accept valid audio/video file keys', () => {
      expect(() => validateAudioVideoKey('voice-notes/coach123/file.webm')).not.toThrow();
      expect(() => validateAudioVideoKey('recordings/session.wav')).not.toThrow();
      expect(() => validateAudioVideoKey('audio.mp3')).not.toThrow();
    });

    it('should reject keys without audio/video extension', () => {
      expect(() => validateAudioVideoKey('document.pdf')).toThrow(BadRequestException);
      expect(() => validateAudioVideoKey('file.exe')).toThrow(BadRequestException);
      expect(() => validateAudioVideoKey('noextension')).toThrow(BadRequestException);
    });

    it('should reject keys with dangerous extensions', () => {
      expect(() => validateAudioVideoKey('malware.sh')).toThrow(BadRequestException);
      expect(() => validateAudioVideoKey('script.js')).toThrow(BadRequestException);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('file.webm')).toBe('webm');
      expect(getFileExtension('path/to/recording.WAV')).toBe('wav');
      expect(getFileExtension('document.PDF')).toBe('pdf');
    });

    it('should return null for files without extension', () => {
      expect(getFileExtension('noextension')).toBeNull();
      expect(getFileExtension('path/to/file')).toBeNull();
    });

    it('should handle multiple dots correctly', () => {
      expect(getFileExtension('file.backup.webm')).toBe('webm');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536 * 1024)).toBe('1.5 MB');
      expect(formatBytes(100 * 1024 * 1024)).toBe('100 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle fractional values', () => {
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('Edge cases', () => {
    it('should handle files with unusual MIME types', () => {
      const file = {
        mimetype: 'audio/x-wav', // Alternative WAV MIME type
        size: 1000,
        originalname: 'test.wav',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file)).not.toThrow();
    });

    it('should handle case-insensitive extensions', () => {
      const file = {
        mimetype: 'audio/webm',
        size: 1000,
        originalname: 'RECORDING.WEBM',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file)).not.toThrow();
    });

    it('should validate MIME type and extension independently', () => {
      // Correct MIME but wrong extension
      const file1 = {
        mimetype: 'audio/webm',
        size: 1000,
        originalname: 'recording.txt',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file1)).toThrow(BadRequestException);

      // Wrong MIME but correct extension
      const file2 = {
        mimetype: 'application/octet-stream',
        size: 1000,
        originalname: 'recording.webm',
      } as Express.Multer.File;

      expect(() => validateAudioVideoFile(file2)).toThrow(BadRequestException);
    });
  });
});
