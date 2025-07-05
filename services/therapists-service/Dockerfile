FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock tsconfig.json ./
RUN yarn install --production

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
RUN yarn install --production
CMD ["node", "dist/main.js"]
