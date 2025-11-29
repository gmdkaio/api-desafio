// Importa as bibliotecas necessárias
const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
const port = 3000;

app.use(express.json());

// --- 1. CONFIGURAÇÃO DO MONGODB ---
// Conecta ao banco local (Docker)
mongoose.connect('mongodb://127.0.0.1:27017/desafio-pedidos')
    .then(() => console.log('✅ Conectado ao MongoDB'))
    .catch(err => console.error('❌ Erro ao conectar no Mongo:', err));

// --- 2. DEFINIÇÃO DO SCHEMA ---
const ItemSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
});

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true }, 
    value: { type: Number, required: true },                
    creationDate: { type: Date, required: true },            
    items: [ItemSchema]                                      
});

// Cria o Modelo
const Order = mongoose.model('Order', OrderSchema);

// --- 3. CONFIGURAÇÃO DO SWAGGER ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Pedidos',
            version: '1.0.0',
            description: 'API para gerenciamento de pedidos (Desafio Jitterbit)',
        },
    },
    apis: ['server.js'], // Lê as anotações neste arquivo
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- ROTA ROOT ---
app.get('/', (req, res) => {
    res.json({
        message: 'API de Pedidos',
        endpoints: {
            docs: '/api-docs',
            createOrder: 'POST /order',
            listOrders: 'GET /order/list',
            getOrder: 'GET /order/:id',
            updateOrder: 'PUT /order/:id',
            deleteOrder: 'DELETE /order/:id'
        }
    });
});

// --- 4. FUNÇÃO DE MAPEAMENTO ---
const mapToDatabaseFormat = (input) => {
    return {
        orderId: input.numeroPedido,
        value: input.valorTotal,
        creationDate: input.dataCriacao,
        items: input.items.map(item => ({
            productId: parseInt(item.idItem),
            quantity: item.quantidadeItem,
            price: item.valorItem
        }))
    };
};

// --- 5. ROTAS ---

/**
 * @swagger
 * /order:
 *   post:
 *     summary: Cria um novo pedido
 *     description: Recebe JSON em português, converte e salva no Banco.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numeroPedido:
 *                 type: string
 *                 description: Número do pedido
 *               valorTotal:
 *                 type: number
 *                 description: Valor total do pedido
 *               dataCriacao:
 *                 type: string
 *                 format: date-time
 *                 description: Data de criação do pedido
 *               items:
 *                 type: array
 *                 description: Lista de itens do pedido
 *                 items:
 *                   type: object
 *                   properties:
 *                     idItem:
 *                       type: string
 *                       description: ID do produto
 *                     quantidadeItem:
 *                       type: number
 *                       description: Quantidade do item
 *                     valorItem:
 *                       type: number
 *                       description: Valor unitário do item
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       409:
 *         description: Pedido duplicado
 *       500:
 *         description: Erro no servidor
 */
app.post('/order', async (req, res) => {
    try {
        const dadosEntrada = req.body;
        
        // Mapeia (Transformação)
        const dadosFormatados = mapToDatabaseFormat(dadosEntrada);

        // Cria instância do Mongoose e Salva
        const novoPedido = new Order(dadosFormatados);
        await novoPedido.save();

        console.log("Pedido salvo no Banco:", dadosFormatados.orderId);
        res.status(201).json({ message: "Sucesso", order: dadosFormatados });

    } catch (error) {
        // Tratamento de erro robusto (ex: ID duplicado)
        if (error.code === 11000) {
            return res.status(409).json({ error: "Pedido com este ID já existe." });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /order/list:
 *   get:
 *     summary: Lista todos os pedidos
 *     responses:
 *       200:
 *         description: Lista retornada com sucesso
 */
app.get('/order/list', async (req, res) => {
    try {
        const pedidos = await Order.find();
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /order/{id}:
 *   get:
 *     summary: Busca pedido por ID
 *     description: Retorna os dados de um pedido específico pelo número do pedido
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Número do pedido a ser buscado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro no servidor
 */
app.get('/order/:id', async (req, res) => {
    try {
        const pedido = await Order.findOne({ orderId: req.params.id });
        pedido ? res.status(200).json(pedido) : res.status(404).json({ error: "Pedido não encontrado." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /order/{id}:
 *   put:
 *     summary: Atualiza um pedido
 *     description: Atualiza os dados de um pedido existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Número do pedido a ser atualizado
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numeroPedido:
 *                 type: string
 *                 description: Número do pedido
 *               valorTotal:
 *                 type: number
 *                 description: Valor total do pedido
 *               dataCriacao:
 *                 type: string
 *                 format: date-time
 *                 description: Data de criação do pedido
 *               items:
 *                 type: array
 *                 description: Lista de itens do pedido
 *                 items:
 *                   type: object
 *                   properties:
 *                     idItem:
 *                       type: string
 *                       description: ID do produto
 *                     quantidadeItem:
 *                       type: number
 *                       description: Quantidade do item
 *                     valorItem:
 *                       type: number
 *                       description: Valor unitário do item
 *     responses:
 *       200:
 *         description: Pedido atualizado com sucesso
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro no servidor
 */
app.put('/order/:id', async (req, res) => {
    try {
        const dadosEntrada = req.body;
        const dadosFormatados = mapToDatabaseFormat(dadosEntrada);

        const pedidoAtualizado = await Order.findOneAndUpdate(
            { orderId: req.params.id },
            dadosFormatados,
            { new: true, runValidators: true }
        );

        if (pedidoAtualizado) {
            res.status(200).json({ message: "Pedido atualizado com sucesso", order: pedidoAtualizado });
        } else {
            res.status(404).json({ error: "Pedido não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /order/{id}:
 *   delete:
 *     summary: Deleta um pedido
 *     description: Remove um pedido do banco de dados
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Número do pedido a ser removido
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido removido com sucesso
 *       404:
 *         description: Pedido não encontrado
 *       500:
 *         description: Erro no servidor
 */
app.delete('/order/:id', async (req, res) => {
    try {
        const resultado = await Order.deleteOne({ orderId: req.params.id });
        if (resultado.deletedCount > 0) {
            res.status(200).json({ message: "Pedido removido com sucesso." });
        } else {
            res.status(404).json({ error: "Pedido não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inicia
app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
    console.log(`Documentação em http://localhost:${port}/api-docs`);
});