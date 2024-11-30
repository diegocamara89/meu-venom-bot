const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs').promises;
const puppeteer = require('puppeteer-core');

const whitelistController = require('./src/controllers/whitelistController');
const webhookController = require('./src/controllers/webhookController');
const apiRoutes = require('./src/routes/api');
const backupRoutes = require('./src/routes/backup');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes
app.use('/api', apiRoutes);
app.use('/api/backup', backupRoutes);

// QR Code data
let qrCodeData = '';

// WhatsApp Client usando Puppeteer-core
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "bot-whatsapp",
        dataPath: path.join(process.cwd(), '.wwebjs_auth')
    }),
    puppeteer: {
        headless: true,
        product: 'chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-extensions',
            '--no-first-run',
            '--no-zygote',
            '--deterministic-fetch',
            '--disable-features=IsolateOrigins',
            '--disable-site-isolation-trials'
        ]
    },
    restartOnAuthFail: true,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 10000
});

// Endpoint principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// QR Code endpoint
app.get('/qr', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else {
        res.status(404).json({ error: 'QR Code não disponível' });
    }
});

// Send message endpoint completo com novos tipos de mídia
app.post('/send', async (req, res) => {
    try {
        const { number, message, type, latitude, longitude } = req.body;
        
        if (!number) {
            return res.status(400).json({ error: 'Número é obrigatório' });
        }

        if (!whitelistController.isWhitelisted(number)) {
            return res.status(403).json({ error: 'Número não autorizado' });
        }

        const chatId = number + "@c.us";
        console.log('Enviando mensagem para:', chatId);
        
        switch(type) {
            case 'location':
                if (!latitude || !longitude) {
                    return res.status(400).json({ error: 'Latitude e longitude são obrigatórios para mensagens do tipo location' });
                }
                const locationMessage = `https://maps.google.com/maps?q=${latitude},${longitude}`;
                await client.sendMessage(chatId, locationMessage);
                break;
            
            case 'image':
                if (!message) {
                    return res.status(400).json({ error: 'URL da imagem é obrigatória' });
                }
                try {
                    const media = await MessageMedia.fromUrl(message, {
                        unsafeMime: true,
                        reqOptions: {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                            }
                        }
                    });
                    await client.sendMessage(chatId, media, {
                        caption: 'Imagem enviada via bot'
                    });
                } catch (imageError) {
                    console.error('Erro ao processar imagem:', imageError);
                    return res.status(500).json({ error: 'Erro ao processar imagem: ' + imageError.message });
                }
                break;

            case 'document':
                if (!message) {
                    return res.status(400).json({ error: 'URL do documento é obrigatória' });
                }
                try {
                    const media = await MessageMedia.fromUrl(message, {
                        unsafeMime: true,
                        reqOptions: {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                            }
                        }
                    });
                    await client.sendMessage(chatId, media, {
                        caption: 'Documento enviado via bot',
                        sendMediaAsDocument: true
                    });
                } catch (docError) {
                    console.error('Erro ao processar documento:', docError);
                    return res.status(500).json({ error: 'Erro ao processar documento: ' + docError.message });
                }
                break;

            case 'audio':
                if (!message) {
                    return res.status(400).json({ error: 'URL do áudio é obrigatória' });
                }
                try {
                    const media = await MessageMedia.fromUrl(message, {
                        unsafeMime: true,
                        reqOptions: {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                            }
                        }
                    });
                    await client.sendMessage(chatId, media, {
                        sendAudioAsVoice: true
                    });
                } catch (audioError) {
                    console.error('Erro ao processar áudio:', audioError);
                    return res.status(500).json({ error: 'Erro ao processar áudio: ' + audioError.message });
                }
                break;

            case 'video':
                if (!message) {
                    return res.status(400).json({ error: 'URL do vídeo é obrigatória' });
                }
                try {
                    const media = await MessageMedia.fromUrl(message, {
                        unsafeMime: true,
                        reqOptions: {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
                            }
                        }
                    });
                    await client.sendMessage(chatId, media, {
                        caption: 'Vídeo enviado via bot'
                    });
                } catch (videoError) {
                    console.error('Erro ao processar vídeo:', videoError);
                    return res.status(500).json({ error: 'Erro ao processar vídeo: ' + videoError.message });
                }
                break;

            case 'text':
            default:
                if (!message) {
                    return res.status(400).json({ error: 'Mensagem é obrigatória' });
                }
                await client.sendMessage(chatId, message);
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

// Tratamento de eventos do WhatsApp
client.on('qr', (qr) => {
    qrCodeData = qr;
    console.log('Novo QR Code gerado. Por favor, escaneie:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Cliente WhatsApp conectado e pronto!');
    qrCodeData = '';
});

client.on('authenticated', (session) => {
    console.log('Cliente autenticado com sucesso!');
});

client.on('auth_failure', (error) => {
    console.error('Erro de autenticação:', error);
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
    client.initialize().catch(err => {
        console.error('Erro ao reconectar:', err);
    });
});

// Tratamento de mensagens recebidas com suporte a mídia
client.on('message', async msg => {
    try {
        const sender = msg.from.split('@')[0];
        if (!whitelistController.isWhitelisted(sender)) {
            console.log(`Mensagem ignorada de número não autorizado: ${sender}`);
            return;
        }

        // Comandos básicos
        if (msg.body === '!ping') {
            msg.reply('pong');
        }

        // Preparar dados da mensagem
        const messageData = {
            from: msg.from,
            body: msg.body,
            timestamp: msg.timestamp,
            type: msg.type,
            hasMedia: msg.hasMedia
        };

        // Processamento de mídia recebida
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            messageData.media = {
                mimetype: media.mimetype,
                filename: media.filename,
                data: media.data
            };

            // Criar diretório de mídia se não existir
            const mediaDir = path.join(__dirname, 'media');
            await fs.mkdir(mediaDir, { recursive: true });

            // Salvar mídia recebida
            if (media.filename) {
                const filePath = path.join(mediaDir, `${Date.now()}-${media.filename}`);
                await fs.writeFile(filePath, Buffer.from(media.data, 'base64'));
                messageData.media.savedPath = filePath;
            }
        }

        // Enviar para webhooks
        await webhookController.broadcastMessage(messageData);

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});

// Error handling
process.on('uncaughtException', err => {
    console.error('Exceção não tratada:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'motivo:', reason);
});

// Inicialização
async function initialize() {
    try {
        await fs.mkdir('.wwebjs_auth', { recursive: true });
        await fs.mkdir(path.join(__dirname, 'media'), { recursive: true });
        
        app.listen(port, () => {
            console.log(`Servidor rodando na porta ${port}`);
        });

        await client.initialize();
        
        console.log('Sistema inicializado com sucesso!');
    } catch (error) {
        console.error('Erro na inicialização:', error);
        process.exit(1);
    }
}

console.log('Iniciando servidor e cliente WhatsApp...');
initialize().catch(err => {
    console.error('Erro fatal na inicialização:', err);
    process.exit(1);
});
