// Salve como src/utils/whitelist-cleaner.js
const fs = require('fs').promises;
const path = require('path');

async function cleanWhitelist() {
    const whitelistPath = path.join(__dirname, '../../config/whitelist.json');
    
    try {
        const data = await fs.readFile(whitelistPath, 'utf8');
        const whitelist = JSON.parse(data);
        
        // Filtrar apenas números no formato correto (começando com 55)
        const validNumbers = whitelist.numbers.filter(number => 
            /^55\d{10,11}$/.test(number)
        );
        
        // Salvar whitelist atualizada
        await fs.writeFile(whitelistPath, JSON.stringify({ numbers: validNumbers }, null, 2));
        
        console.log('Whitelist limpa com sucesso');
        console.log('Números válidos:', validNumbers);
        
        return validNumbers;
    } catch (error) {
        console.error('Erro ao limpar whitelist:', error);
        throw error;
    }
}

module.exports = { cleanWhitelist };