FROM node:18-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json vite.config.ts ./
COPY index.html ./
COPY src ./src
RUN yarn install && yarn build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
