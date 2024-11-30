const fileHandler = require('../utils/fileHandler');

class WhitelistController {
    constructor() {
        this.whitelist = new Set();
        this.init();
    }

    async init() {
        const data = await fileHandler.readJsonFile('whitelist.json');
        if (data && data.numbers) {
            this.whitelist = new Set(data.numbers);
        }
    }

    async addNumber(number) {
        // Limpa o número (remove não-numéricos)
        const cleanNumber = number.replace(/\D/g, '');
        if (!cleanNumber) {
            throw new Error('Número inválido');
        }

        this.whitelist.add(cleanNumber);
        await this.saveWhitelist();
        return true;
    }

    async removeNumber(number) {
        const cleanNumber = number.replace(/\D/g, '');
        const result = this.whitelist.delete(cleanNumber);
        if (result) {
            await this.saveWhitelist();
        }
        return result;
    }

    isWhitelisted(number) {
        const cleanNumber = number.replace(/\D/g, '');
        return this.whitelist.has(cleanNumber);
    }

    getWhitelist() {
        return Array.from(this.whitelist);
    }

    async saveWhitelist() {
        await fileHandler.createBackup('whitelist.json');
        return fileHandler.writeJsonFile('whitelist.json', {
            numbers: Array.from(this.whitelist)
        });
    }
}

module.exports = new WhitelistController();