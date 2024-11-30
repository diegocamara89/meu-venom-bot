// Atualização automática
function updateStatus() {
    fetch('/api/status')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('statusContent').innerHTML = `
                    <p>Números na whitelist: ${data.whitelistedNumbers}</p>
                    <p>Webhooks ativos: ${data.activeWebhooks}</p>
                    <p>Uptime: ${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m</p>
                `;
            }
        })
        .catch(console.error);
}

// Gerenciamento da Whitelist
function updateWhitelist() {
    fetch('/api/whitelist')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const content = document.getElementById('whitelistContent');
                if (data.numbers.length === 0) {
                    content.innerHTML = '<p>Nenhum número autorizado</p>';
                    return;
                }

                content.innerHTML = data.numbers.map(number => `
                    <div class="list-item">
                        <span>${number}</span>
                        <button onclick="removeFromWhitelist('${number}')">Remover</button>
                    </div>
                `).join('');
            }
        })
        .catch(console.error);
}

function addToWhitelist() {
    const number = document.getElementById('newNumber').value;
    if (!number) return;

    fetch('/api/whitelist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('newNumber').value = '';
            updateWhitelist();
        } else {
            alert(data.error || 'Erro ao adicionar número');
        }
    })
    .catch(console.error);
}

function removeFromWhitelist(number) {
    if (!confirm(`Remover o número ${number}?`)) return;

    fetch(`/api/whitelist/${number}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            updateWhitelist();
        } else {
            alert(data.error || 'Erro ao remover número');
        }
    })
    .catch(console.error);
}

// Gerenciamento de Webhooks
function updateWebhooks() {
    fetch('/api/webhooks')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const content = document.getElementById('webhookContent');
                if (data.webhooks.length === 0) {
                    content.innerHTML = '<p>Nenhum webhook configurado</p>';
                    return;
                }

                content.innerHTML = data.webhooks.map(webhook => `
                    <div class="list-item">
                        <div class="webhook-info">
                            <strong>${webhook.url}</strong>
                            ${webhook.description ? `<p>${webhook.description}</p>` : ''}
                        </div>
                        <button onclick="removeWebhook('${webhook.id}')">Remover</button>
                    </div>
                `).join('');
            }
        })
        .catch(console.error);
}

function addWebhook() {
    const url = document.getElementById('webhookUrl').value;
    const description = document.getElementById('webhookDescription').value;
    if (!url) return;

    fetch('/api/webhooks/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, description })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('webhookUrl').value = '';
            document.getElementById('webhookDescription').value = '';
            updateWebhooks();
        } else {
            alert(data.error || 'Erro ao adicionar webhook');
        }
    })
    .catch(console.error);
}

function removeWebhook(id) {
    if (!confirm('Remover este webhook?')) return;

    fetch(`/api/webhooks/${id}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            updateWebhooks();
        } else {
            alert(data.error || 'Erro ao remover webhook');
        }
    })
    .catch(console.error);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
    updateWhitelist();
    updateWebhooks();
    
    // Atualizações automáticas
    setInterval(updateStatus, 5000);
    setInterval(updateWhitelist, 10000);
    setInterval(updateWebhooks, 10000);
});