# API de Pedidos - Desafio

API REST para gerenciamento de pedidos construída com Node.js, Express, MongoDB e Swagger.

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Bun instalado (https://bun.sh)
- Linux com Zsh (opcional, mas foi o que eu usei.)

## 🚀 Como Executar

### 1. Subir o MongoDB com Docker

Primeiro, inicie um container MongoDB:

```bash
docker run -d \
  --name mongodb-desafio \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=desafio-pedidos \
  mongo:latest
```

Para verificar se o container está rodando:

```bash
docker ps
```

### 2. Instalar Dependências

Instale as dependências necessárias diretamente com o Bun:

```bash
bun add express mongoose swagger-jsdoc swagger-ui-express
```

### 3. Executar a API

```bash
bun server.js
```

Ou para desenvolvimento com reload automático:

```bash
bun --watch server.js
```

A API estará disponível em: **http://localhost:3000**

## 📚 Documentação da API

Acesse a documentação interativa Swagger em:

**http://localhost:3000/api-docs**

## 🔌 Endpoints Disponíveis

### Root
- `GET /` - Informações da API e lista de endpoints

### Pedidos
- `POST /order` - Criar novo pedido
- `GET /order/list` - Listar todos os pedidos
- `GET /order/:id` - Buscar pedido por ID
- `PUT /order/:id` - Atualizar pedido
- `DELETE /order/:id` - Deletar pedido

## 📝 Exemplo de Uso

### Criar um pedido:

```bash
curl -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -d '{
    "numeroPedido": "PED-001",
    "valorTotal": 150.50,
    "dataCriacao": "2025-11-29T10:00:00Z",
    "items": [
      {
        "idItem": "101",
        "quantidadeItem": 2,
        "valorItem": 50.25
      },
      {
        "idItem": "102",
        "quantidadeItem": 1,
        "valorItem": 50.00
      }
    ]
  }'
```

### Listar todos os pedidos:

```bash
curl http://localhost:3000/order/list
```

### Buscar pedido específico:

```bash
curl http://localhost:3000/order/PED-001
```

## 🛠️ Comandos Úteis do Docker

### Parar o MongoDB:
```bash
docker stop mongodb-desafio
```

### Reiniciar o MongoDB:
```bash
docker start mongodb-desafio
```

### Ver logs do MongoDB:
```bash
docker logs mongodb-desafio
```

### Remover o container:
```bash
docker rm -f mongodb-desafio
```

### Acessar o shell do MongoDB:
```bash
docker exec -it mongodb-desafio mongosh
```

Dentro do MongoDB shell:
```javascript
use desafio-pedidos
db.orders.find().pretty()
```

## 🐳 Alternativa: Docker Compose (Opcional)

Crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb-desafio
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: desafio-pedidos
    volumes:
      - mongo-data:/data/db

  api:
    build: .
    container_name: api-desafio
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    environment:
      - MONGO_URL=mongodb://mongodb:27017/desafio-pedidos

volumes:
  mongo-data:
```

E um `Dockerfile`:

```dockerfile
FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "start"]
```

Então execute:

```bash
docker-compose up -d
```

## 🧪 Testar a Conexão

Após iniciar a API, você verá no terminal:

```
✅ Conectado ao MongoDB
API rodando em http://localhost:3000
Documentação em http://localhost:3000/api-docs
```

## ⚠️ Troubleshooting

### Erro de conexão com MongoDB:
- Verifique se o container está rodando: `docker ps`
- Verifique se a porta 27017 não está em uso: `sudo lsof -i :27017`
- Reinicie o container: `docker restart mongodb-desafio`

### Porta 3000 já em uso:
- Mude a porta no `server.js` ou mate o processo: `sudo lsof -i :3000`
