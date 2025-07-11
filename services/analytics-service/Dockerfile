# --- Base dependencies stage ---
# This stage installs all dependencies for the entire monorepo.
FROM node:18-alpine AS deps
WORKDIR /app

# IMPORTANT: Copy the root tsconfig.json first, so the build stage can access it.
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
RUN yarn config set registry https://registry.npmmirror.com
RUN yarn config set network-timeout 600000 -g
RUN yarn install --frozen-lockfile

# --- Builder stage ---
# This stage builds only the analytics-service.
FROM node:18-alpine AS build
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
FROM node:18-alpine
WORKDIR /app

# Copy the compiled code from the 'build' stage.
COPY --from=build /app/services/analytics-service/dist ./dist

# Copy only the production package.json for this specific service.
COPY --from=build /app/services/analytics-service/package.json ./package.json

# Install only production dependencies.
COPY --from=build /app/node_modules ./node_modules

# Set the command to run the application.
CMD ["node", "dist/main.js"]
