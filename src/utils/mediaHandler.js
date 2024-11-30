// src/utils/mediaHandler.js
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const { MessageMedia } = require('whatsapp-web.js');

class MediaHandler {
    constructor() {
        this.mediaDir = path.join(process.cwd(), 'media');
        this.tempDir = path.join(this.mediaDir, 'temp');
        this.maxFileSize = 16 * 1024 * 1024; // 16MB
        this.allowedTypes = {
            document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
            audio: ['.mp3', '.wav', '.ogg', '.m4a'],
            video: ['.mp4', '.mov', '.avi'],
            image: ['.jpg', '.jpeg', '.png', '.gif']
        };
    }

    async init() {
        await fs.mkdir(this.mediaDir, { recursive: true });
        await fs.mkdir(this.tempDir, { recursive: true });
    }

    generateFileName(type, extension) {
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        return `${type}-${timestamp}-${random}${extension}`;
    }

    async saveMedia(buffer, type, extension) {
        const fileName = this.generateFileName(type, extension);
        const filePath = path.join(this.mediaDir, fileName);
        await fs.writeFile(filePath, buffer);
        return { fileName, filePath };
    }

    async processAudio(buffer) {
        const tempPath = path.join(this.tempDir, `temp-${Date.now()}.mp3`);
        
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(buffer)
                .toFormat('mp3')
                .on('end', () => resolve(tempPath))
                .on('error', reject)
                .save(tempPath);
        });
    }

    isValidFileType(filename, type) {
        const ext = path.extname(filename).toLowerCase();
        return this.allowedTypes[type]?.includes(ext);
    }

    async cleanupTemp() {
        const files = await fs.readdir(this.tempDir);
        const now = Date.now();
        
        for (const file of files) {
            const filePath = path.join(this.tempDir, file);
            const stats = await fs.stat(filePath);
            
            // Remove arquivos mais antigos que 1 hora
            if (now - stats.mtimeMs > 3600000) {
                await fs.unlink(filePath);
            }
        }
    }

    async prepareMediaMessage(filePath, mimeType) {
        const data = await fs.readFile(filePath, { encoding: 'base64' });
        return new MessageMedia(mimeType, data, path.basename(filePath));
    }
}

module.exports = new MediaHandler();