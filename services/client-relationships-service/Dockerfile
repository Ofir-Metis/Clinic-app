FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json yarn.lock ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./
COPY services ./services
COPY libs ./libs
COPY frontend ./frontend
RUN yarn config set registry https://registry.yarnpkg.com
RUN yarn config set network-timeout 600000 -g
RUN yarn install
RUN yarn workspace @clinic/common build
RUN yarn workspace @clinic/client-relationships-service build

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=deps /app/services/client-relationships-service/dist ./dist
COPY --from=deps /app/services/client-relationships-service/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/libs/common/dist /app/libs/common/dist
RUN rm -rf ./node_modules/@clinic/common && \
    mkdir -p ./node_modules/@clinic/common && \
    cp -r /app/libs/common/dist/* ./node_modules/@clinic/common/
EXPOSE 3014
CMD ["node", "dist/main.js"]
