# Etapa 1: compilação
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY patches ./patches

RUN npm ci

COPY . .

RUN npm run build


# Etapa 2: execução
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY patches ./patches

RUN npm ci --omit=dev --ignore-scripts

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "dist/main.js"]
