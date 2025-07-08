FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY services/ai-service/package.json ./services/ai-service/package.json
COPY services/ai-service/tsconfig.json ./services/ai-service/tsconfig.json
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set network-timeout 600000 -g
RUN yarn workspace ai-service install

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace ai-service build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/services/ai-service/dist ./dist
COPY services/ai-service/package.json ./package.json
RUN yarn install --production
CMD ["node", "dist/main.js"]
