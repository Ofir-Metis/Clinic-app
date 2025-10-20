"use strict";
/**
 * RecordingsController - Handles recording file uploads, downloads, and management
 * Integrates with StorageService for S3/MinIO operations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const common_2 = require("@clinic/common");
const common_3 = require("@nestjs/common");
const multer = __importStar(require("multer"));
const path = __importStar(require("path"));
let RecordingsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('api/recordings'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_3.UseInterceptors)(common_2.LoggingInterceptor)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _uploadRecording_decorators;
    let _getAppointmentRecordings_decorators;
    let _getDownloadUrl_decorators;
    let _getPlaybackUrl_decorators;
    let _deleteRecording_decorators;
    let _generateSummary_decorators;
    let _generateTranscript_decorators;
    let _getStorageStats_decorators;
    let _healthCheck_decorators;
    var RecordingsController = _classThis = class {
        constructor(storageService) {
            this.storageService = (__runInitializers(this, _instanceExtraInitializers), storageService);
        }
        /**
         * Upload a recording file
         */
        async uploadRecording(file, metadata, req) {
            try {
                if (!file) {
                    throw new common_1.HttpException('No file uploaded', common_1.HttpStatus.BAD_REQUEST);
                }
                // Validate metadata
                if (!metadata.appointmentId || !metadata.sessionId || !metadata.participantId) {
                    throw new common_1.HttpException('Missing required metadata', common_1.HttpStatus.BAD_REQUEST);
                }
                // Generate safe filename
                const fileExtension = path.extname(file.originalname);
                const safeFilename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                // Upload to storage
                const uploadResult = await this.storageService.uploadRecording(file.buffer, safeFilename, metadata.appointmentId, metadata.sessionId, {
                    contentType: file.mimetype,
                    metadata: {
                        ...metadata,
                        originalFilename: file.originalname,
                        fileSize: file.size.toString(),
                        uploadDate: new Date().toISOString(),
                        uploadedBy: req.user.sub,
                        uploaderRole: req.user.role,
                    },
                    tags: {
                        type: 'recording',
                        appointmentId: metadata.appointmentId,
                        sessionId: metadata.sessionId,
                        participantId: metadata.participantId,
                    },
                    encryption: true, // Enable server-side encryption
                });
                return {
                    id: uploadResult.uploadId,
                    filename: file.originalname,
                    fileSize: file.size,
                    format: file.mimetype,
                    uploadUrl: uploadResult.location,
                    key: uploadResult.key,
                    processingStatus: 'completed',
                    uploadDate: new Date().toISOString(),
                    metadata: {
                        appointmentId: metadata.appointmentId,
                        sessionId: metadata.sessionId,
                        participantId: metadata.participantId,
                        recordingMode: metadata.recordingMode,
                        sessionType: metadata.sessionType,
                    },
                };
            }
            catch (error) {
                console.error('Recording upload failed:', error);
                throw new common_1.HttpException('Upload failed: ' + error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get recordings for an appointment
         */
        async getAppointmentRecordings(appointmentId, req) {
            try {
                const prefix = `recordings/${appointmentId}/`;
                const result = await this.storageService.listFiles('clinic-recordings', // This should be from config
                prefix);
                const recordings = await Promise.all(result.files.map(async (file) => {
                    const metadata = await this.storageService.getFileMetadata('clinic-recordings', file.key);
                    return {
                        id: metadata.metadata.uploadId || file.key,
                        filename: metadata.metadata.originalFilename || path.basename(file.key),
                        fileSize: file.size,
                        duration: parseInt(metadata.metadata.duration || '0'),
                        uploadDate: file.lastModified,
                        recordingDate: metadata.metadata.recordingDate
                            ? new Date(metadata.metadata.recordingDate)
                            : file.lastModified,
                        format: metadata.contentType,
                        key: file.key,
                        processingStatus: 'completed',
                        metadata: metadata.metadata,
                    };
                }));
                return recordings;
            }
            catch (error) {
                console.error('Failed to fetch recordings:', error);
                throw new common_1.HttpException('Failed to load recordings', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get a signed download URL for a recording
         */
        async getDownloadUrl(recordingId, req) {
            try {
                // In a real implementation, you'd need to map recordingId to the actual storage key
                // For now, we'll assume the recordingId is part of the key or we can lookup the key
                const recordings = await this.storageService.listFiles('clinic-recordings', '', // Search all recordings
                1000);
                const recording = recordings.files.find(file => file.key.includes(recordingId) ||
                    file.key.endsWith(`${recordingId}_*`));
                if (!recording) {
                    throw new common_1.HttpException('Recording not found', common_1.HttpStatus.NOT_FOUND);
                }
                const downloadUrl = await this.storageService.getRecordingDownloadUrl(recording.key, 3600 // 1 hour expiry
                );
                return { downloadUrl };
            }
            catch (error) {
                console.error('Failed to generate download URL:', error);
                throw new common_1.HttpException('Failed to generate download URL', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get a signed playback URL for a recording
         */
        async getPlaybackUrl(recordingId, req) {
            try {
                const recordings = await this.storageService.listFiles('clinic-recordings', '', 1000);
                const recording = recordings.files.find(file => file.key.includes(recordingId));
                if (!recording) {
                    throw new common_1.HttpException('Recording not found', common_1.HttpStatus.NOT_FOUND);
                }
                const playbackUrl = await this.storageService.getRecordingPlaybackUrl(recording.key, 3600 // 1 hour expiry
                );
                return { playbackUrl };
            }
            catch (error) {
                console.error('Failed to generate playback URL:', error);
                throw new common_1.HttpException('Failed to generate playback URL', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Delete a recording
         */
        async deleteRecording(recordingId, req) {
            try {
                const recordings = await this.storageService.listFiles('clinic-recordings', '', 1000);
                const recording = recordings.files.find(file => file.key.includes(recordingId));
                if (!recording) {
                    throw new common_1.HttpException('Recording not found', common_1.HttpStatus.NOT_FOUND);
                }
                await this.storageService.deleteFile('clinic-recordings', recording.key);
                return { message: 'Recording deleted successfully' };
            }
            catch (error) {
                console.error('Failed to delete recording:', error);
                throw new common_1.HttpException('Failed to delete recording', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate AI summary for a recording
         */
        async generateSummary(recordingId, req) {
            try {
                // This would integrate with the AI service
                // For now, return a mock summary
                const mockSummary = {
                    id: `summary_${recordingId}`,
                    recordingId,
                    keyPoints: [
                        'Client expressed increased confidence in handling workplace stress',
                        'Discussion around new coping strategies for anxiety management',
                        'Progress noted in maintaining healthy sleep schedule',
                    ],
                    actionItems: [
                        'Practice daily 10-minute meditation using guided app',
                        'Implement the "2-minute rule" for task management',
                        'Schedule weekly nature walks for stress relief',
                    ],
                    insights: [
                        'Client shows strong self-awareness and motivation for change',
                        'Cognitive reframing techniques are resonating well',
                        'Previous session goals have been partially achieved',
                    ],
                    recommendations: [
                        'Continue building on mindfulness practices',
                        'Explore additional stress management techniques',
                        'Consider introducing goal-setting framework',
                    ],
                    mood: 'Optimistic and engaged',
                    progressNotes: 'Client is making steady progress with anxiety management.',
                    nextSessionFocus: 'Goal setting and action planning for workplace stress scenarios',
                    generatedAt: new Date().toISOString(),
                    isSharedWithClient: false,
                };
                // Store summary in storage
                await this.storageService.uploadSummary(mockSummary, recordingId, 'appointment-id', // This should come from the recording metadata
                {
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        version: '1.0',
                    },
                });
                return mockSummary;
            }
            catch (error) {
                console.error('Failed to generate summary:', error);
                throw new common_1.HttpException('Failed to generate summary', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate transcript for a recording
         */
        async generateTranscript(recordingId, req) {
            try {
                // This would integrate with the AI service (Whisper API)
                // For now, return a mock transcript
                const mockTranscript = {
                    id: `transcript_${recordingId}`,
                    recordingId,
                    content: 'Mock transcript content would go here...',
                    speakerLabels: [
                        {
                            speaker: 'Coach',
                            startTime: 0,
                            endTime: 30,
                            text: 'How are you feeling today?',
                        },
                        {
                            speaker: 'Client',
                            startTime: 30,
                            endTime: 60,
                            text: 'I\'m feeling much better than last week.',
                        },
                    ],
                    generatedAt: new Date().toISOString(),
                    accuracy: 0.95,
                };
                // Store transcript in storage
                await this.storageService.uploadTranscript(JSON.stringify(mockTranscript), recordingId, {
                    metadata: {
                        generatedAt: new Date().toISOString(),
                        accuracy: '0.95',
                    },
                });
                return mockTranscript;
            }
            catch (error) {
                console.error('Failed to generate transcript:', error);
                throw new common_1.HttpException('Failed to generate transcript', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get storage statistics
         */
        async getStorageStats(req) {
            try {
                const stats = await this.storageService.getStorageStats();
                return stats;
            }
            catch (error) {
                console.error('Failed to get storage stats:', error);
                throw new common_1.HttpException('Failed to get storage statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Health check for storage service
         */
        async healthCheck(req) {
            try {
                const health = await this.storageService.healthCheck();
                return health;
            }
            catch (error) {
                console.error('Storage health check failed:', error);
                throw new common_1.HttpException('Storage service unhealthy', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
    };
    __setFunctionName(_classThis, "RecordingsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _uploadRecording_decorators = [(0, common_1.Post)('upload'), (0, common_1.UseGuards)(common_2.RecordingAccessGuard), (0, common_2.RequirePermissions)('recordings:write'), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('recording', {
                storage: multer.memoryStorage(),
                limits: {
                    fileSize: 500 * 1024 * 1024, // 500MB limit
                },
                fileFilter: (req, file, cb) => {
                    const allowedMimeTypes = [
                        'video/mp4',
                        'video/quicktime',
                        'video/x-msvideo',
                        'audio/mpeg',
                        'audio/wav',
                        'audio/mp4',
                        'video/webm',
                        'audio/webm',
                    ];
                    if (allowedMimeTypes.includes(file.mimetype)) {
                        cb(null, true);
                    }
                    else {
                        cb(new common_1.HttpException('Invalid file type', common_1.HttpStatus.BAD_REQUEST), false);
                    }
                },
            }))];
        _getAppointmentRecordings_decorators = [(0, common_1.Get)('appointments/:appointmentId'), (0, common_1.UseGuards)(common_2.RecordingAccessGuard), (0, common_2.RequirePermissions)('recordings:read')];
        _getDownloadUrl_decorators = [(0, common_1.Get)(':recordingId/download-url'), (0, common_1.UseGuards)(common_2.RecordingAccessGuard), (0, common_2.RequirePermissions)('recordings:read')];
        _getPlaybackUrl_decorators = [(0, common_1.Get)(':recordingId/playback-url'), (0, common_1.UseGuards)(common_2.RecordingAccessGuard), (0, common_2.RequirePermissions)('recordings:read')];
        _deleteRecording_decorators = [(0, common_1.Delete)(':recordingId'), (0, common_1.UseGuards)(common_2.RecordingAccessGuard), (0, common_2.RequirePermissions)('recordings:delete'), (0, common_2.RequireRoles)('coach', 'admin')];
        _generateSummary_decorators = [(0, common_1.Post)(':recordingId/generate-summary'), (0, common_1.UseGuards)(common_2.RecordingAccessGuard), (0, common_2.RequirePermissions)('ai:generate-summary'), (0, common_2.RequireRoles)('coach', 'admin')];
        _generateTranscript_decorators = [(0, common_1.Post)(':recordingId/generate-transcript'), (0, common_1.UseGuards)(common_2.RecordingAccessGuard), (0, common_2.RequirePermissions)('ai:generate-transcript'), (0, common_2.RequireRoles)('coach', 'admin')];
        _getStorageStats_decorators = [(0, common_1.Get)('admin/stats'), (0, common_1.UseGuards)(common_2.AdminGuard), (0, common_2.RequireRoles)('admin', 'coach')];
        _healthCheck_decorators = [(0, common_1.Get)('admin/health'), (0, common_1.UseGuards)(common_2.AdminGuard), (0, common_2.RequireRoles)('admin', 'coach')];
        __esDecorate(_classThis, null, _uploadRecording_decorators, { kind: "method", name: "uploadRecording", static: false, private: false, access: { has: obj => "uploadRecording" in obj, get: obj => obj.uploadRecording }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAppointmentRecordings_decorators, { kind: "method", name: "getAppointmentRecordings", static: false, private: false, access: { has: obj => "getAppointmentRecordings" in obj, get: obj => obj.getAppointmentRecordings }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDownloadUrl_decorators, { kind: "method", name: "getDownloadUrl", static: false, private: false, access: { has: obj => "getDownloadUrl" in obj, get: obj => obj.getDownloadUrl }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPlaybackUrl_decorators, { kind: "method", name: "getPlaybackUrl", static: false, private: false, access: { has: obj => "getPlaybackUrl" in obj, get: obj => obj.getPlaybackUrl }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteRecording_decorators, { kind: "method", name: "deleteRecording", static: false, private: false, access: { has: obj => "deleteRecording" in obj, get: obj => obj.deleteRecording }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateSummary_decorators, { kind: "method", name: "generateSummary", static: false, private: false, access: { has: obj => "generateSummary" in obj, get: obj => obj.generateSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateTranscript_decorators, { kind: "method", name: "generateTranscript", static: false, private: false, access: { has: obj => "generateTranscript" in obj, get: obj => obj.generateTranscript }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStorageStats_decorators, { kind: "method", name: "getStorageStats", static: false, private: false, access: { has: obj => "getStorageStats" in obj, get: obj => obj.getStorageStats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _healthCheck_decorators, { kind: "method", name: "healthCheck", static: false, private: false, access: { has: obj => "healthCheck" in obj, get: obj => obj.healthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RecordingsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RecordingsController = _classThis;
})();
exports.RecordingsController = RecordingsController;
