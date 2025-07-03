# Clinic App Monorepo

This repository uses Yarn workspaces to manage multiple services and a React frontend.

## Requirements
- Node.js >= 18
- Yarn
- Docker

## Setup
```bash
yarn install
```

## Development
Each service is a NestJS application. To run a service:
```bash
cd services/<service-name>
yarn start:dev
```

The frontend is built with Vite and Material UI:
```bash
cd frontend
yarn dev
```

## Testing
```bash
yarn test
```

## Docker Compose
To run the stack:
```bash
docker-compose up --build
```

Copy `.env.example` to `.env` and adjust values before running.

## Build
To generate production builds of all workspaces:
```bash
yarn workspaces run build
```

## Acknowledgements
- Nora Zinger
