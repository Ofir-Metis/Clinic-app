# --- Base dependencies stage ---
# This stage installs all dependencies for the entire monorepo.
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++

# IMPORTANT: Copy the root tsconfig.json first, so the build stage can access it.
COPY tsconfig.base.json ./
COPY tsconfig.json ./
# If you have other root tsconfig files like tsconfig.build.json, copy them too.
# COPY tsconfig.build.json ./

# Copy package manager files
COPY package.json yarn.lock ./

# Copy all source code required for installation
COPY services ./services
COPY libs ./libs
COPY frontend ./frontend

# Install all dependencies
# Using a mirror can speed things up.
RUN yarn config set registry https://registry.yarnpkg.com
RUN yarn config set network-timeout 600000 -g
# Skip Puppeteer Chrome download during Docker build
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN yarn install
RUN yarn workspaces run build

# --- Builder stage ---
# This stage builds only the analytics-service.
FROM node:20-alpine AS build
WORKDIR /app

# Copy the root tsconfig.json from the 'deps' stage. This is the critical fix.
COPY --from=deps /app/tsconfig.json ./tsconfig.json

# Set the working directory for the specific service we are building.
WORKDIR /app/services/analytics-service

# Copy pre-installed node_modules and the shared 'libs' folder from the 'deps' stage.
# This is much faster than running 'yarn install' again.
COPY --from=deps /app/node_modules ../../node_modules
COPY --from=deps /app/libs ../../libs

# Copy the source code for the service from the 'deps' stage.
COPY --from=deps /app/services/analytics-service ./

# Set the PATH to include local binaries, allowing 'tsc' to be found.
ENV PATH /app/node_modules/.bin:$PATH

# Copy tsconfig.base.json from root into /app in the build stage before running yarn build, so TypeScript can resolve extends.
COPY /tsconfig.base.json /app/tsconfig.base.json

# Copy services/analytics-service/tsconfig.json ./tsconfig.json
COPY services/analytics-service/tsconfig.json ./tsconfig.json

# Copy services/analytics-service/src ./src
COPY services/analytics-service/src ./src

# Run the build. It will now find the extended tsconfig at /app/tsconfig.json
RUN yarn build

# --- Final Production stage ---
# This stage creates the small, final image with only production dependencies.
FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app

# Copy the compiled code from the 'build' stage.
COPY --from=build /app/services/analytics-service/dist ./dist

# Copy only the production package.json for this specific service.
COPY --from=build /app/services/analytics-service/package.json ./package.json

# Install only production dependencies.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/libs/common/dist /app/libs/common/dist
RUN rm -rf ./node_modules/@clinic/common && \
    mkdir -p ./node_modules/@clinic/common && \
    cp -r /app/libs/common/dist/* ./node_modules/@clinic/common/

# Set the command to run the application.
CMD ["node", "dist/main.js"]
