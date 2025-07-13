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
RUN yarn install --frozen-lockfile
RUN yarn workspaces run build

FROM node:20-alpine AS build
WORKDIR /app/services/appointments-service
COPY --from=deps /app/node_modules ../../node_modules
COPY --from=deps /app/services/appointments-service ./
COPY --from=deps /app/libs /app/libs
COPY --from=deps /app/tsconfig.json /app/tsconfig.json
COPY services/appointments-service/tsconfig.json ./tsconfig.json
COPY services/appointments-service/src ./src
ENV PATH="../../node_modules/.bin:$PATH"
RUN yarn build

FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=build /app/services/appointments-service/dist ./dist
COPY --from=build /app/services/appointments-service/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/libs/common/dist /app/libs/common/dist
RUN rm -rf ./node_modules/@clinic/common && \
    mkdir -p ./node_modules/@clinic/common && \
    cp -r /app/libs/common/dist/* ./node_modules/@clinic/common/
CMD ["node", "dist/main.js"]
