require('dotenv').config();
const fastify = require('fastify')({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        hostname: req.hostname
      }),
      res: (res) => ({
        statusCode: res.statusCode
      })
    }
  }
});

const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL otimizado para alta performance
const pool = new Pool({
  host: process.env.DB_HOST || '45.4.183.128',
  database: process.env.DB_NAME || 'disparador_gupshup',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'mudar123',
  port: process.env.DB_PORT || 55432,
  max: 20, // Máximo de clientes no pool
  idleTimeoutMillis: 30000, // Fecha clientes inativos após 30s
  connectionTimeoutMillis: 5000, // Timeout de conexão de 5s
  allowExitOnIdle: true
});

// Testa a conexão ao iniciar
pool.on('connect', () => {
  fastify.log.info('Conexão PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  fastify.log.error('Erro inesperado no pool PostgreSQL:', err);
});

// API Key de autenticação
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  fastify.log.warn('⚠️  API_KEY não configurada! A API estará vulnerável.');
}

// Hook de autenticação via API Key
fastify.addHook('onRequest', async (request, reply) => {
  // Permite acesso ao health check e rota raiz sem autenticação
  if (request.url === '/health' || request.url === '/') {
    return;
  }

  // Se não há API_KEY configurada, permite acesso (modo desenvolvimento)
  if (!API_KEY) {
    return;
  }

  // Valida a API Key do header
  const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey || apiKey !== API_KEY) {
    fastify.log.warn({
      ip: request.ip,
      url: request.url,
      userAgent: request.headers['user-agent']
    }, 'Tentativa de acesso não autorizada');

    reply.code(401);
    return reply.send({
      error: 'Não autorizado',
      message: 'API Key inválida ou ausente. Use o header X-API-Key ou Authorization: Bearer <key>'
    });
  }
});

// Health check otimizado - sem query ao banco para ser mais rápido
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'running' };
});

// Health check completo com verificação do banco (opcional)
fastify.get('/health/db', async (request, reply) => {
  try {
    const result = await pool.query('SELECT 1 as check');
    return { status: 'ok', database: 'connected' };
  } catch (error) {
    fastify.log.error('Health check DB failed:', error);
    reply.code(503);
    return { status: 'error', database: 'disconnected' };
  }
});

// Rota principal: GET /convenio/:phone
fastify.get('/convenio/:phone', async (request, reply) => {
  const startTime = Date.now();
  const { phone } = request.params;

  // Validação básica do telefone
  if (!phone || phone.trim().length === 0) {
    reply.code(400);
    return { error: 'Telefone é obrigatório' };
  }

  // Valida se contém apenas números (0-9)
  if (!/^\d+$/.test(phone)) {
    reply.code(400);
    return { 
      error: 'Telefone inválido',
      message: 'O telefone deve conter apenas números (0-9)'
    };
  }

  // Pega apenas os 8 últimos dígitos
  const last8Digits = phone.slice(-8);

  // Valida se tem pelo menos 8 dígitos
  if (last8Digits.length < 8) {
    reply.code(400);
    return { 
      error: 'Telefone inválido',
      message: 'O telefone deve ter pelo menos 8 dígitos'
    };
  }

  try {
    // Query otimizada usando LIKE com índice - busca pelos 8 últimos dígitos
    const query = `
      SELECT convenio 
      FROM campanhas 
      WHERE telefone LIKE $1 
      ORDER BY data_insercao DESC 
      LIMIT 1
    `;
    
    const values = [`%${last8Digits}`];
    
    const result = await pool.query(query, values);
    
    const responseTime = Date.now() - startTime;
    fastify.log.info({
      phone: phone,
      last8Digits: last8Digits,
      responseTime: `${responseTime}ms`,
      found: result.rows.length > 0
    }, 'Consulta realizada');

    // Retorna o resultado ou null
    return {
      convenio: result.rows.length > 0 ? result.rows[0].convenio : null
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    fastify.log.error({
      phone: phone,
      last8Digits: last8Digits,
      error: error.message,
      responseTime: `${responseTime}ms`
    }, 'Erro na consulta');

    reply.code(500);
    return { 
      error: 'Erro interno do servidor',
      convenio: null
    };
  }
});

// Rota raiz
fastify.get('/', async (request, reply) => {
  return { 
    service: 'API Consulta Convênio',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      convenio: '/convenio/:phone'
    }
  };
});

// Inicia o servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Servidor rodando em http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM recebido, encerrando servidor...');
  await pool.end();
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  fastify.log.info('SIGINT recebido, encerrando servidor...');
  await pool.end();
  await fastify.close();
  process.exit(0);
});

start();

