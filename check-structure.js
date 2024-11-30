const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs').promises;

const whitelistController = require('./src/controllers/whitelistController');
const webhookController = require('./src/controllers/webhookController');
const apiRoutes = require('./src/routes/api');
const backupRoutes = require('./src/routes/backup');

const app = express();
const port = process.env.PORT || 3000;

// Verificar estrutura de diretórios
async function ensureDirectories() {
    const dirs = ['backups', 'config', 'logs'];
    for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
    }
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes
app.use('/api', apiRoutes);
app.use('/api/backup', backupRoutes);

// QR Code data
let qrCodeData = '';

// WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({clientId: Date.now().toString()}),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-extensions'
        ]
    }
});

// Endpoints e configurações existentes...

// Inicialização
async function initialize() {
    try {
        await ensureDirectories();
        console.log('Estrutura de diretórios verificada');
        
        app.listen(port, () => {
            console.log(`Servidor rodando na porta ${port}`);
        });

        await client.initialize();
    } catch (error) {
        console.error('Erro na inicialização:', error);
        process.exit(1);
    }
}

initialize();

// Error handling
process.on('uncaughtException', err => {
    console.error('Exceção não tratada:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'motivo:', reason);
});