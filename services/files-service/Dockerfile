FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY services/files-service/package.json ./services/files-service/package.json
COPY services/files-service/tsconfig.json ./services/files-service/tsconfig.json
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set network-timeout 600000 -g
RUN yarn workspace files-service install

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace files-service build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/services/files-service/dist ./dist
COPY services/files-service/package.json ./package.json
RUN yarn install --production
CMD ["node", "dist/main.js"]
