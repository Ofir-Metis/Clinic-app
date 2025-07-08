FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY services/appointments-service/package.json ./services/appointments-service/package.json
COPY services/appointments-service/tsconfig.json ./services/appointments-service/tsconfig.json
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set network-timeout 600000 -g
RUN yarn workspace appointments-service install

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn workspace appointments-service build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/services/appointments-service/dist ./dist
COPY services/appointments-service/package.json ./package.json
RUN yarn install --production
CMD ["node", "dist/main.js"]
