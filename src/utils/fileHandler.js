const fs = require('fs').promises;
const path = require('path');

class FileHandler {
    constructor(configDir) {
        this.configDir = configDir;
    }

    async readJsonFile(filename) {
        try {
            const filePath = path.join(this.configDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async writeJsonFile(filename, data) {
        try {
            const filePath = path.join(this.configDir, filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Erro ao escrever arquivo ${filename}:`, error);
            return false;
        }
    }

    // Método para backup automático
    async createBackup(filename) {
        try {
            const filePath = path.join(this.configDir, filename);
            const backupPath = path.join(this.configDir, 'backup');
            await fs.mkdir(backupPath, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(backupPath, `${filename}.${timestamp}.backup`);
            
            await fs.copyFile(filePath, backupFile);
            return true;
        } catch (error) {
            console.error(`Erro ao criar backup de ${filename}:`, error);
            return false;
        }
    }
}

module.exports = new FileHandler(path.join(__dirname, '../../config'));