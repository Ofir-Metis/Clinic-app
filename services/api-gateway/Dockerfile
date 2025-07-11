FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY services ./services
COPY libs ./libs
COPY frontend ./frontend
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set network-timeout 600000 -g
RUN yarn install

FROM node:18-alpine AS build
WORKDIR /app/services/api-gateway
COPY --from=deps /app/node_modules ../../node_modules
COPY --from=deps /app/services/api-gateway ./
COPY --from=deps /app/libs /app/libs
COPY /tsconfig.base.json /app/tsconfig.base.json
COPY services/api-gateway/tsconfig.json ./tsconfig.json
COPY services/api-gateway/src ./src
ENV PATH="../../node_modules/.bin:$PATH"
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/services/api-gateway/dist ./dist
COPY --from=build /app/services/api-gateway/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
