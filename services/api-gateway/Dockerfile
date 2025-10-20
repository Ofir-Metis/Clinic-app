FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./
COPY services ./services
COPY libs ./libs
COPY frontend ./frontend
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set network-timeout 600000 -g
RUN yarn install
RUN yarn workspaces run build

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/api-gateway ./services/api-gateway
COPY --from=deps /app/libs ./libs
COPY --from=deps /app/tsconfig.base.json ./tsconfig.base.json
WORKDIR /app/services/api-gateway
ENV PATH="../../node_modules/.bin:$PATH"
RUN yarn build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/services/api-gateway/dist ./dist
COPY --from=build /app/services/api-gateway/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/libs/common/dist ./libs/common/dist
RUN rm -rf ./node_modules/@clinic/common && \
    mkdir -p ./node_modules/@clinic/common && \
    cp -r ./libs/common/dist/* ./node_modules/@clinic/common/
    
# Ensure absolute import path used by compiled code resolves inside container
RUN mkdir -p /libs/common && ln -s /app/libs/common/dist /libs/common/dist
CMD ["node", "dist/main.js"]
