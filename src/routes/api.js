const express = require('express');
const router = express.Router();
const whitelistController = require('../controllers/whitelistController');
const webhookController = require('../controllers/webhookController');

// Rotas da Whitelist
router.get('/whitelist', (req, res) => {
    try {
        const numbers = whitelistController.getWhitelist();
        res.json({ success: true, numbers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/whitelist/add', async (req, res) => {
    try {
        const { number } = req.body;
        if (!number) {
            return res.status(400).json({ success: false, error: 'Número é obrigatório' });
        }
        await whitelistController.addNumber(number);
        res.json({ success: true, numbers: whitelistController.getWhitelist() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/whitelist/:number', async (req, res) => {
    try {
        const result = await whitelistController.removeNumber(req.params.number);
        if (result) {
            res.json({ success: true, numbers: whitelistController.getWhitelist() });
        } else {
            res.status(404).json({ success: false, error: 'Número não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rotas de Webhooks
router.get('/webhooks', (req, res) => {
    try {
        const webhooks = webhookController.getWebhooks();
        res.json({ success: true, webhooks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/webhooks/add', async (req, res) => {
    try {
        const { url, description } = req.body;
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL é obrigatória' });
        }
        const webhook = await webhookController.addWebhook(url, description);
        res.json({ success: true, webhook });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/webhooks/:id', async (req, res) => {
    try {
        const result = await webhookController.removeWebhook(req.params.id);
        if (result) {
            res.json({ success: true, webhooks: webhookController.getWebhooks() });
        } else {
            res.status(404).json({ success: false, error: 'Webhook não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota de status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        whitelistedNumbers: whitelistController.getWhitelist().length,
        activeWebhooks: webhookController.getWebhooks().length,
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

module.exports = router;