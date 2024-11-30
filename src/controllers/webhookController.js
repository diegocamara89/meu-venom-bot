const fileHandler = require('../utils/fileHandler');

class WebhookController {
    constructor() {
        this.webhooks = [];
        this.init();
    }

    async init() {
        const data = await fileHandler.readJsonFile('webhooks.json');
        if (data && data.webhooks) {
            this.webhooks = data.webhooks;
        }
    }

    async addWebhook(url, description = '') {
        const webhook = {
            id: Date.now().toString(),
            url,
            description,
            createdAt: new Date().toISOString()
        };

        this.webhooks.push(webhook);
        await this.saveWebhooks();
        return webhook;
    }

    async removeWebhook(id) {
        const initialLength = this.webhooks.length;
        this.webhooks = this.webhooks.filter(hook => hook.id !== id);
        
        if (this.webhooks.length !== initialLength) {
            await this.saveWebhooks();
            return true;
        }
        return false;
    }

    getWebhooks() {
        return this.webhooks;
    }

    async saveWebhooks() {
        await fileHandler.createBackup('webhooks.json');
        return fileHandler.writeJsonFile('webhooks.json', {
            webhooks: this.webhooks
        });
    }

    // Método para enviar mensagem para todos os webhooks
    async broadcastMessage(message) {
        const results = await Promise.allSettled(
            this.webhooks.map(webhook => 
                fetch(webhook.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                })
            )
        );

        return results.map((result, index) => ({
            webhookId: this.webhooks[index].id,
            success: result.status === 'fulfilled',
            error: result.status === 'rejected' ? result.reason.message : null
        }));
    }
}

module.exports = new WebhookController();