# WhatsApp Bot - Documentação
Documentação completa do bot WhatsApp para integração com N8N e outras plataformas.

## Sumário
- [Funcionalidades Atuais](#funcionalidades-atuais)
- [Guia de Instalação](#guia-de-instalação)
- [Como Usar](#como-usar)
- [Endpoints da API](#endpoints-da-api)
- [Próximas Implementações](#próximas-implementações)
- [Opções de Deploy](#opções-de-deploy)

## Funcionalidades Atuais

### Mensagens
- ✅ Envio de mensagens de texto
- ✅ Envio de localização (via link do Google Maps)
- ✅ Envio de imagens (via URL)
- ✅ Comando !ping para teste de conexão

### Sistema
- ✅ API REST para integração
- ✅ Webhook para notificações
- ✅ Status do sistema
- ✅ QR Code no terminal e via API
- ✅ Reconexão automática

## Guia de Instalação

### Pré-requisitos
- Node.js versão 18.x ou superior
- NPM (Node Package Manager)
- Google Chrome instalado

### Instalação Local
1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd whatsapp-bot
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

4. Escaneie o QR Code que aparecerá no terminal

## Como Usar

### Endpoints Básicos

#### 1. Enviar Mensagem de Texto
```
GET http://localhost:3000/send?number=5584999999999&message=sua mensagem
```
ou
```json
POST http://localhost:3000/send
{
    "number": "5584999999999",
    "type": "text",
    "message": "sua mensagem"
}
```

#### 2. Enviar Localização
```json
POST http://localhost:3000/send
{
    "number": "5584999999999",
    "type": "location",
    "latitude": "-5.7793",
    "longitude": "-35.2009"
}
```

#### 3. Enviar Imagem
```json
POST http://localhost:3000/send
{
    "number": "5584999999999",
    "type": "image",
    "message": "URL_DA_IMAGEM"
}
```

### Configuração de Webhook
```json
POST http://localhost:3000/webhook
{
    "url": "SUA_URL_DE_WEBHOOK"
}
```

## Endpoints da API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Verifica se o servidor está rodando |
| `/send` | GET/POST | Envia mensagens |
| `/status` | GET | Retorna status do bot |
| `/qr` | GET | Retorna QR Code atual |
| `/webhook` | POST | Configura URL do webhook |

## Próximas Implementações
1. Recebimento de imagens e documentos
2. Comando !help
3. Status mais detalhado
4. Envio de documentos
5. Envio de áudio
6. Envio de contatos
7. Validação aprimorada de números

## Opções de Deploy

### Heroku
- Necessita de buildpack do Puppeteer
- Precisa configurar variáveis de ambiente
- Deploy via Git

### Oracle Cloud
- VM com Ubuntu Server
- Instalação do Node.js e dependências
- Uso do PM2 para gerenciamento de processo
- Possibilidade de uso de Docker

### Recomendações para Deploy
- Oracle Cloud é recomendado para maior estabilidade
- Heroku é mais simples para testes e prototipagem
- Para produção, Oracle Cloud oferece mais controle

## Troubleshooting

### Problemas Comuns
1. QR Code não aparece
   - Verifique se o Chrome está instalado
   - Verifique as permissões da pasta

2. Mensagens não são enviadas
   - Verifique o formato do número
   - Confirme a conexão do WhatsApp

3. Webhook não funciona
   - Verifique se a URL é válida
   - Confirme se o endpoint está acessível

### Logs
- Verifique os logs do terminal para diagnóstico
- Use o endpoint `/status` para verificar a conexão
- Monitore as respostas da API para erros

## Contatos e Suporte
- Reporte bugs via GitHub Issues
- Consulte a documentação do WhatsApp Web JS
- Verifique atualizações regularmente
