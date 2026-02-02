FROM node:20-alpine

WORKDIR /app

# Copia apenas os arquivos necessários
COPY package.json ./
RUN npm install --production

# Copia o código da aplicação
COPY server.js ./

# Cria usuário não-root e transfere dono dos arquivos para ele
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check otimizado - timeout maior e menos retries
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
  CMD node -e "require('http').get('http://localhost:3000/health', {timeout: 4000}, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

CMD ["node", "server.js"]

