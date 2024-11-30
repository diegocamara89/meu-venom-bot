#!/bin/bash

# Criar estrutura de diretórios
mkdir -p config
mkdir -p public/{css,js}
mkdir -p src/{controllers,routes,utils}

# Criar arquivos de configuração iniciais
echo '{"numbers": []}' > config/whitelist.json
echo '{"webhooks": []}' > config/webhooks.json

# Criar arquivo de estilo
cat > public/css/style.css << 'EOL'
/* Estilos base */
body {
    font-family: Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}
.card {
    border: 1px solid #ddd;
    padding: 20px;
    margin: 10px 0;
    border-radius: 8px;
}
/* Restante dos estilos será adicionado depois */
EOL

echo "Estrutura criada com sucesso!"