FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Copy shared library
COPY libs ./libs

# Install dependencies
RUN yarn install

# Copy service source
COPY services/client-relationships-service ./services/client-relationships-service

# Build shared library first
RUN yarn workspace @clinic/common build

# Build the service
RUN yarn workspace @clinic/client-relationships-service build

# Expose port
EXPOSE 3014

# Start the service
CMD ["yarn", "workspace", "@clinic/client-relationships-service", "start:prod"]