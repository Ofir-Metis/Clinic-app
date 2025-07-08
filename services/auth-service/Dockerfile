FROM node:18-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json yarn.lock ./
COPY services/auth-service/package.json ./services/auth-service/package.json
COPY services/auth-service/tsconfig.json ./services/auth-service/tsconfig.json
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set network-timeout 600000 -g
RUN yarn workspace auth-service install

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace auth-service build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/services/auth-service/dist ./dist
COPY services/auth-service/package.json ./package.json
RUN yarn install --production
CMD ["node", "dist/main.js"]
