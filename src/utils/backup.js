const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class BackupSystem {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups');
        this.configDir = path.join(__dirname, '../../config');
    }

    async init() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
        } catch (error) {
            console.error('Erro ao criar diretório de backup:', error);
        }
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
        
        try {
            await fs.mkdir(backupPath, { recursive: true });
            const configFiles = ['whitelist.json', 'webhooks.json'];
            
            for (const file of configFiles) {
                const sourcePath = path.join(this.configDir, file);
                const destPath = path.join(backupPath, file);
                
                try {
                    const data = await fs.readFile(sourcePath, 'utf8');
                    await fs.writeFile(destPath, data);
                    const hash = crypto.createHash('md5').update(data).digest('hex');
                    await fs.writeFile(`${destPath}.hash`, hash);
                } catch (error) {
                    console.error(`Erro ao fazer backup do arquivo ${file}:`, error);
                }
            }
            
            const metadata = {
                timestamp: new Date().toISOString(),
                files: configFiles,
                version: '1.0.0'
            };
            
            await fs.writeFile(
                path.join(backupPath, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );
            
            return { success: true, path: backupPath, timestamp };
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            return { success: false, error: error.message };
        }
    }

    async restoreBackup(backupId) {
        try {
            const backupPath = path.join(this.backupDir, backupId);
            
            const exists = await fs.access(backupPath)
                .then(() => true)
                .catch(() => false);
                
            if (!exists) {
                throw new Error('Backup não encontrado');
            }
            
            const metadata = JSON.parse(
                await fs.readFile(path.join(backupPath, 'metadata.json'), 'utf8')
            );
            
            for (const file of metadata.files) {
                const sourcePath = path.join(backupPath, file);
                const destPath = path.join(this.configDir, file);
                
                const storedHash = await fs.readFile(`${sourcePath}.hash`, 'utf8');
                const fileData = await fs.readFile(sourcePath, 'utf8');
                const currentHash = crypto.createHash('md5').update(fileData).digest('hex');
                
                if (storedHash !== currentHash) {
                    throw new Error(`Hash inválido para o arquivo ${file}`);
                }
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                await fs.copyFile(destPath, `${destPath}.${timestamp}.bak`);
                await fs.writeFile(destPath, fileData);
            }
            
            return { success: true, timestamp: metadata.timestamp };
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            return { success: false, error: error.message };
        }
    }

    async listBackups() {
        try {
            const backups = await fs.readdir(this.backupDir);
            const backupDetails = await Promise.all(
                backups.map(async (backup) => {
                    try {
                        const metadataPath = path.join(this.backupDir, backup, 'metadata.json');
                        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
                        return { id: backup, ...metadata };
                    } catch {
                        return null;
                    }
                })
            );
            
            return backupDetails.filter(backup => backup !== null);
        } catch (error) {
            console.error('Erro ao listar backups:', error);
            return [];
        }
    }
}

module.exports = new BackupSystem();