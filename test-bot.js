const fetch = require('node-fetch');

class BotTester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.results = [];
        this.timeout = 5000; // Timeout de 5 segundos
    }

    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeout);
            return response;
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    async runTests() {
        console.log('🚀 Iniciando testes do bot...\n');
        try {
            await this.testServer();
            await this.testStatus();
            await this.testWhitelist();
            await this.testWebhook();
            await this.testSendMessage();
            await this.testMediaSending();
            await this.testBackup();
            await this.testWebInterface();
        } catch (error) {
            console.error('❌ Erro fatal nos testes:', error);
        } finally {
            this.showSummary();
        }
    }

    async testServer() {
        try {
            const response = await this.fetchWithTimeout(this.baseUrl);
            this.logResult('Servidor Web', response.ok);
        } catch (error) {
            this.logResult('Servidor Web', false, 'Servidor não responde');
        }
    }

    async testStatus() {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/api/status`);
            const data = await response.json();
            this.logResult('Status do Bot', Boolean(data));
        } catch (error) {
            this.logResult('Status do Bot', false, 'Endpoint de status não responde');
        }
    }

    async testWhitelist() {
        const testNumber = '5511999999999';
        try {
            const addResponse = await this.fetchWithTimeout(`${this.baseUrl}/api/whitelist/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: testNumber })
            });
            const addData = await addResponse.json();
            this.logResult('Adicionar à Whitelist', addData.success);

            const checkResponse = await this.fetchWithTimeout(`${this.baseUrl}/api/whitelist`);
            const checkData = await checkResponse.json();
            this.logResult('Verificar Whitelist', checkData.numbers.includes(testNumber));
        } catch (error) {
            this.logResult('Operações Whitelist', false, error.message);
        }
    }

    async testWebhook() {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/api/webhooks/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'http://localhost:3001/webhook',
                    description: 'Webhook de teste'
                })
            });
            const data = await response.json();
            this.logResult('Adicionar Webhook', data.success);
        } catch (error) {
            this.logResult('Adicionar Webhook', false, error.message);
        }
    }

    async testSendMessage() {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    number: '5511999999999',
                    message: 'Teste automatizado',
                    type: 'text'
                })
            });
            const data = await response.json();
            this.logResult('Enviar Mensagem', data.success);
        } catch (error) {
            this.logResult('Enviar Mensagem', false, 'Bot não está pronto para enviar mensagens');
        }
    }

    async testMediaSending() {
        const mediaTypes = ['image', 'document', 'audio', 'video'];
        for (const type of mediaTypes) {
            try {
                const response = await this.fetchWithTimeout(`${this.baseUrl}/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        number: '5511999999999',
                        message: `https://example.com/${type}.file`,
                        type
                    })
                });
                const data = await response.json();
                this.logResult(`Enviar Mídia (${type})`, data.success);
            } catch (error) {
                this.logResult(`Enviar Mídia (${type})`, false, `Erro ao enviar ${type}`);
            }
        }
    }

    async testBackup() {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/api/backup/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            this.logResult('Backup de Configurações', response.ok && data.success);
        } catch (error) {
            this.logResult('Backup de Configurações', false, error.message);
        }
    }

    async testWebInterface() {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}/`);
            this.logResult('Interface Web', response.ok);
        } catch (error) {
            this.logResult('Interface Web', false, 'Interface não responde');
        }
    }

    logResult(testName, success, error = null) {
        this.results.push({ name: testName, success, error });
        const status = success ? '✅ PASSOU' : '❌ FALHOU';
        console.log(`${status} - ${testName}${error ? ` (${error})` : ''}`);
    }

    showSummary() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.success).length;
        const failed = total - passed;

        console.log('\n📊 Resumo dos Testes:');
        console.log(`Total de testes: ${total}`);
        console.log(`Passou: ${passed}`);
        console.log(`Falhou: ${failed}`);
        
        if (failed > 0) {
            console.log('\n❌ Falhas:');
            this.results
                .filter(r => !r.success)
                .forEach(r => console.log(`- ${r.name}: ${r.error || 'Falha não especificada'}`));
        }
    }
}

// Executar testes
const tester = new BotTester();
tester.runTests().catch(console.error);
