FROM node:20-alpine
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Copy shared library
COPY libs ./libs

# Install dependencies
RUN yarn install

# Copy service source
COPY services/progress-service ./services/progress-service

# Build shared library first
RUN yarn workspace @clinic/common build

# Build the service
RUN yarn workspace @clinic/progress-service build

# Expose port
EXPOSE 3015

# Start the service
CMD ["yarn", "workspace", "@clinic/progress-service", "start:prod"]
