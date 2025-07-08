FROM node:18-alpine
WORKDIR /app
# Copy root package.json and yarn.lock
COPY package.json yarn.lock ./
# Copy service package.json
COPY services/api-gateway/package.json ./services/api-gateway/package.json
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set network-timeout 600000 -g
RUN yarn workspace api-gateway install --production
COPY . .
CMD ["node", "dist/main.js"]
