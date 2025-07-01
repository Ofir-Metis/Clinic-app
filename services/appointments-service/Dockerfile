FROM node:18-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
RUN yarn install --production
COPY src ./src
CMD ["node", "dist/main.js"]
