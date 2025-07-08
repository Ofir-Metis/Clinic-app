FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY services/notifications-service/package.json ./services/notifications-service/package.json
COPY services/notifications-service/tsconfig.json ./services/notifications-service/tsconfig.json
RUN npm config set registry https://registry.npmmirror.com
RUN npm config set fetch-timeout 600000
RUN npm install

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace notifications-service build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/services/notifications-service/dist ./dist
COPY services/notifications-service/package.json ./package.json
RUN yarn install --production
CMD ["node", "dist/main.js"]
