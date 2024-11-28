const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let qrCodeData = '';
let webhookUrl = '';

// Express server
app.get('/', (req, res) => {
    res.send('WhatsApp Bot Server is running!');
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        status: client.info ? 'CONNECTED' : 'DISCONNECTED',
        info: client.info || {}
    });
});

// QR Code endpoint
app.get('/qr', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else {
        res.status(404).json({ error: 'QR Code não disponível' });
    }
});

// Webhook configuration endpoint
app.post('/webhook', (req, res) => {
    webhookUrl = req.body.url;
    res.json({ success: true, webhook: webhookUrl });
});

// Send message endpoint
app.post('/send', async (req, res) => {
    try {
        const { number, message, type, latitude, longitude } = req.body;
        
        if (!number) {
            return res.status(400).json({ error: 'Número é obrigatório' });
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
                const media = await MessageMedia.fromUrl(message);
                await client.sendMessage(chatId, media);
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

// Legacy GET endpoint for backward compatibility
app.get('/send', async (req, res) => {
    try {
        const number = req.query.number;
        const message = req.query.message;

        if (!number || !message) {
            return res.status(400).send('Número e mensagem são obrigatórios');
        }

        const chatId = number + "@c.us";
        console.log('Enviando mensagem para:', chatId);
        
        await client.sendMessage(chatId, message);
        res.send('Mensagem enviada com sucesso!');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send('Erro ao enviar mensagem: ' + error);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

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
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    qrCodeData = qr;
    console.log('QR Code:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// Alteração: Envio de mensagens para o Webhook configurado
client.on('message', async msg => {
    // Responde ao comando !ping
    if (msg.body === '!ping') {
        msg.reply('pong');
    }

    // Envia mensagem para o Webhook se configurado
    if (webhookUrl) {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: msg.from,
                    body: msg.body, // Conteúdo da mensagem
                    timestamp: msg.timestamp,
                    type: msg.type,
                    hasMedia: msg.hasMedia
                })
            });
            console.log('Webhook enviado com status:', response.status);
        } catch (error) {
            console.error('Erro ao enviar webhook:', error);
        }
    }
});

// Initialize
console.log('Initializing...');
client.initialize()
    .catch(err => {
        console.error('Initialization error:', err);
    });

// Error handling
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
