FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY libs/ libs/
COPY services/billing-service/package.json services/billing-service/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy billing service source
COPY services/billing-service/ services/billing-service/

# Build common library first
RUN yarn workspace @clinic/common build

# Build billing service
RUN yarn workspace @clinic/billing-service build

# Expose port
EXPOSE 3009

# Start the billing service
CMD ["yarn", "workspace", "@clinic/billing-service", "start:prod"]