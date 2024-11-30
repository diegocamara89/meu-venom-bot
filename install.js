// install.js
const fs = require('fs').promises;
const path = require('path');

const files = {
    'src/utils/backup.js': `
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
        const backupPath = path.join(this.backupDir, \`backup-\${timestamp}\`);
        
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
                    await fs.writeFile(\`\${destPath}.hash\`, hash);
                } catch (error) {
                    console.error(\`Erro ao fazer backup do arquivo \${file}:\`, error);
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
                
                const storedHash = await fs.readFile(\`\${sourcePath}.hash\`, 'utf8');
                const fileData = await fs.readFile(sourcePath, 'utf8');
                const currentHash = crypto.createHash('md5').update(fileData).digest('hex');
                
                if (storedHash !== currentHash) {
                    throw new Error(\`Hash inválido para o arquivo \${file}\`);
                }
                
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                await fs.copyFile(destPath, \`\${destPath}.\${timestamp}.bak\`);
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
`,

    'src/routes/backup.js': `
const express = require('express');
const router = express.Router();
const backupSystem = require('../utils/backup');

// Inicializar sistema de backup
backupSystem.init();

// Criar backup
router.post('/create', async (req, res) => {
    try {
        const result = await backupSystem.createBackup();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Restaurar backup
router.post('/restore/:backupId', async (req, res) => {
    try {
        const result = await backupSystem.restoreBackup(req.params.backupId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Listar backups
router.get('/list', async (req, res) => {
    try {
        const backups = await backupSystem.listBackups();
        res.json(backups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
`
};

async function createDirectories() {
    const directories = [
        'src/utils',
        'src/routes',
        'backups',
        'config',
        'logs'
    ];

    for (const dir of directories) {
        try {
            await fs.mkdir(dir, { recursive: true });
            console.log(`✅ Diretório criado: ${dir}`);
        } catch (error) {
            console.error(`❌ Erro ao criar diretório ${dir}:`, error);
        }
    }
}

async function createFiles() {
    for (const [filePath, content] of Object.entries(files)) {
        try {
            await fs.writeFile(filePath, content.trim());
            console.log(`✅ Arquivo criado: ${filePath}`);
        } catch (error) {
            console.error(`❌ Erro ao criar arquivo ${filePath}:`, error);
        }
    }
}

async function createDefaultConfigs() {
    const configs = {
        'config/whitelist.json': { numbers: [] },
        'config/webhooks.json': { webhooks: [] }
    };

    for (const [filePath, content] of Object.entries(configs)) {
        try {
            await fs.writeFile(filePath, JSON.stringify(content, null, 2));
            console.log(`✅ Arquivo de configuração criado: ${filePath}`);
        } catch (error) {
            console.error(`❌ Erro ao criar arquivo ${filePath}:`, error);
        }
    }
}

async function install() {
    console.log('🚀 Iniciando instalação do sistema de backup...\n');
    
    try {
        await createDirectories();
        console.log('\n📁 Diretórios criados com sucesso!\n');
        
        await createFiles();
        console.log('\n📄 Arquivos criados com sucesso!\n');
        
        await createDefaultConfigs();
        console.log('\n⚙️ Configurações padrão criadas com sucesso!\n');
        
        console.log('✅ Instalação concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro durante a instalação:', error);
    }
}

// Executar instalação
install().catch(console.error);