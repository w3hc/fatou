# fatou


### .env.template

```
ANTHROPIC_API_KEY='88888'
API_KEY='88888'
BASE_RPC_URL='88888'
BASE_TOKEN_ADDRESS='0x11dC980faf34A1D082Ae8A6a883db3A950a3c6E8'
# SEPOLIA_RPC_URL='88888'
# SEPOLIA_TOKEN_ADDRESS='0xF57cE903E484ca8825F2c1EDc7F9EEa3744251eB'
```

### .eslintrc.js

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};

```

### .gitignore

```
# compiled output
/dist
/node_modules

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Misc

.env
uploads
db.json
data/
```

### .prettierrc

```
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

### DOCS.md

```markdown
# Fatou API Documentation

## Overview

Fatou is a Nest.js-based API that provides an interface to Claude, an advanced language model, with specific capabilities for analyzing software applications. The API supports two distinct modes of operation: general querying and application-specific analysis.

## Authentication

All endpoints require API key authentication unless marked as public.

### Headers
```
x-api-key: your-api-key-here
```

### Obtaining an API Key

1. Call the `/auth/get-message` endpoint with your Ethereum wallet address
2. Sign the returned message using your wallet
3. Call the `/auth/verify` endpoint with the signature to receive your API key

## Core Endpoints

### 1. Ask Claude (`POST /ai/ask`)

Endpoint for interacting with Claude in two distinct modes.

#### Modes of Operation

##### A. Application Analysis Mode
- Requires a markdown (.md) file attachment containing application code/documentation
- Claude analyzes the provided codebase and answers questions in that specific context
- Ideal for: code review, architecture analysis, improvement suggestions, bug fixing

##### B. General Query Mode
- No file attachment needed
- Claude answers questions without specific application context
- Suitable for: general programming questions, conceptual explanations, best practices

#### Request Format

```http
POST /ai/ask
Content-Type: multipart/form-data
x-api-key: your-api-key-here

Form Data:
- message: "Your question here"
- file: (optional) markdown_file.md
- conversationId: (optional) "previous-conversation-id"
```

#### File Requirements
- Format: Markdown (.md) only
- Size Limit: 5MB
- Content: Application code, documentation, or project description

#### Response Format

```json
{
  "answer": "Claude's response text",
  "usage": {
    "costs": {
      "inputCost": 0.015,
      "outputCost": 0.075,
      "totalCost": 0.090,
      "inputTokens": 1000,
      "outputTokens": 1000
    },
    "timestamp": "2024-11-04T12:31:12.000Z"
  },
  "conversationId": "unique-conversation-id"
}
```

### 2. Get Authentication Message (`POST /auth/get-message`)

Public endpoint to begin the authentication process.

#### Request
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

#### Response
```json
{
  "message": "zhankai_auth_0x742d...4438f44e_1729772340442_caa3334b-2dec-4f4e-8aa4-0415f2eb3e71"
}
```

### 3. Verify Signature (`POST /auth/verify`)

Public endpoint to complete authentication and receive API key.

#### Request
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "message": "zhankai_auth_0x742d..._1729772340442_caa3334b-2dec-4f4e-8aa4-0415f2eb3e71",
  "signature": "0x123...abc"
}
```

#### Response
```json
{
  "apiKey": "your-api-key"
}
```

## Conversation Management

### Conversation Context
- The API maintains conversation history using `conversationId`
- Include the `conversationId` in subsequent requests to continue a conversation
- Maximum context: 10 previous messages
- File context (if provided) persists throughout the conversation

### Storage
- Uploaded files are stored in the `uploads` folder
- Conversation history is stored in `data/db.json`
- Regular cleanup of old files/conversations is recommended

## Rate Limiting and Costs

### Token Usage
- Input Cost: $0.015 per 1K tokens
- Output Cost: $0.075 per 1K tokens
- Costs are tracked per request in the response

## Best Practices

### For Application Analysis
1. Include relevant code and documentation in the markdown file
2. Structure the markdown file logically with clear sections
3. Ask specific questions about the provided codebase
4. Use the same conversation ID for related questions about the same application

### For General Queries
1. Ask clear, specific questions
2. Provide necessary context in the question itself
3. Use conversation ID to maintain context in related questions

## Error Handling

### Common HTTP Status Codes
- 200: Successful response
- 400: Bad request (invalid input)
- 401: Unauthorized (invalid API key)
- 413: File too large (>5MB)
- 415: Unsupported file type (non-markdown)
- 500: Server error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error type"
}
```

## Deployment

### Environment Variables
```
ANTHROPIC_API_KEY=your_anthropic_api_key
API_KEY=your_api_key
BASE_RPC_URL=your_base_chain_rpc_url
BASE_TOKEN_ADDRESS=your_token_contract_address
```

### Server Requirements
- Node.js 16+
- pnpm package manager
- PM2 for production deployment

### Update Process
```bash
git pull origin main
pnpm i
pnpm build
pm2 restart fatou
```

## Support and Contact

For support, contact the maintainer through:
- Element: @julienbrg:matrix.org
- Farcaster: julien-
- Telegram: @julienbrg
- Twitter: @julienbrg
- Discord: julienbrg
- LinkedIn: julienberanger

## Swagger Documentation

Interactive API documentation is available at `/api` when running the server.
```

### README.md

```markdown
# Fatou

Fatou is a Nest.js-based API that interacts with several different LLM services. It uses only Claude for now (`claude-3-opus-20240229`). 

App description files can be generated using [Zhankai](https://github.com/w3hc/zhankai).

Fatou is also used by [ask-my-assistant](https://github.com/julienbrg/ask-my-assistant) UI (view [live demo](https://ask-my-assistant.netlify.app/)). 

## Installation

```bash
pnpm i
```

## Running the app

```bash
# development
pnpm start

# watch mode
pnpm start:dev

# production mode
pnpm start:prod
```

## Test

```bash
# unit tests
pnpm test

# e2e tests
pnpm test:e2e

# test coverage
pnpm test:cov
```

## Example

### Request body 

message:

```
Improve logging
```

file:

<YOUR_ZHANKAI_APP_DESCRIPTION>

#### Curl

```
curl -X 'POST' \
  'http://localhost:3000/ai/ask' \
  -H 'accept: */*' \
  -H 'Content-Type: multipart/form-data' \
  -F 'message=Improve logging' \
  -F 'file=@fatou_app_description.md'
```

#### URL

http://193.108.55.119:3000/ai/ask

### Request response

```
{
  "answer": "To improve logging, you can consider the following tips:\n\n1. Use appropriate log levels:\n   - Use `DEBUG` for detailed information, typically of interest only when diagnosing problems.\n   - Use `INFO` for confirmation that things are working as expected.\n   - Use `WARNING` for an indication that something unexpected happened or indicative of some problem in the near future.\n   - Use `ERROR` for a serious problem that caused the software to not be able to perform some function.\n   - Use `CRITICAL` for a very serious error, indicating that the program itself may be unable to continue running.\n\n2. Include relevant information:\n   - Log meaningful and contextual information that helps in understanding the state of the application.\n   - Include timestamps, module names, function names, and line numbers to identify the source of the log message.\n   - Use structured logging (e.g., JSON format) to make log parsing and analysis easier.\n\n3. Use descriptive log messages:\n   - Write clear and concise log messages that convey the necessary information.\n   - Avoid ambiguous or generic messages that don't provide enough context.\n   - Use consistent terminology and formatting across the codebase.\n\n4. Protect sensitive information:\n   - Avoid logging sensitive data such as passwords, API keys, or personally identifiable information (PII).\n   - If logging sensitive information is necessary, consider masking or obfuscating it.\n\n5. Configure log output:\n   - Use a logging framework that allows you to configure log output based on different environments (e.g., development, staging, production).\n   - Enable more verbose logging in development and debugging environments, and reduce the verbosity in production.\n   - Consider logging to different outputs (e.g., console, file, centralized logging service) based on the deployment environment.\n\n6. Rotate and archive log files:\n   - Implement log rotation to prevent log files from growing indefinitely and consuming disk space.\n   - Compress and archive old log files for future reference and analysis.\n   - Define a retention policy to determine how long log files should be kept.\n\n7. Monitor and analyze logs:\n   - Regularly monitor logs for errors, warnings, and anomalies.\n   - Use log analysis tools or centralized logging solutions to aggregate and analyze logs from multiple sources.\n   - Set up alerts and notifications for critical errors or unusual patterns.\n\n8. Use unique identifiers:\n   - Generate and include unique identifiers (e.g., request IDs, transaction IDs) in log messages to correlate related events across different components or services.\n   - This helps in tracing and debugging distributed systems.\n\n9. Perform periodic log audits:\n   - Regularly review and audit logs to ensure they are providing valuable information and align with the logging best practices.\n   - Remove unnecessary or redundant log statements to keep the codebase clean and maintainable.\n\n10. Document logging practices:\n    - Create and maintain documentation that outlines the logging conventions, guidelines, and best practices followed in your project.\n    - Ensure that all team members are familiar with and adhere to the logging standards.\n\nRemember, the goal of logging is to provide visibility into the behavior and health of your application. By following these practices, you can enhance the quality and usefulness of your logs, making it easier to diagnose issues, monitor performance, and maintain a robust software system."
}
```

## Uploads

The uploaded files are stored in the `uploads` folder.

## Update Infomaniak VPS

```
git pull origin main
pnpm i
pnpm build
pm2 restart fatou
pm2 logs
```

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Farcaster](https://warpcast.com/julien-), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discordapp.com/users/julienbrg), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).

```

## data


### fatou_app_description.md

```markdown
# fatou


### .env.template

```
ANTHROPIC_API_KEY='88888'
API_KEY='88888'
BASE_RPC_URL='88888'
BASE_TOKEN_ADDRESS='0x11dC980faf34A1D082Ae8A6a883db3A950a3c6E8'
# SEPOLIA_RPC_URL='88888'
# SEPOLIA_TOKEN_ADDRESS='0xF57cE903E484ca8825F2c1EDc7F9EEa3744251eB'
```

### .eslintrc.js

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};

```

### .gitignore

```
# compiled output
/dist
/node_modules

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Misc

.env
uploads
db.json
data/
```

### .prettierrc

```
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

### DOCS.md

```markdown
# Fatou API Documentation

## Overview

Fatou is a Nest.js-based API that provides an interface to Claude, an advanced language model, with specific capabilities for analyzing software applications. The API supports two distinct modes of operation: general querying and application-specific analysis.

## Authentication

All endpoints require API key authentication unless marked as public.

### Headers
```
x-api-key: your-api-key-here
```

### Obtaining an API Key

1. Call the `/auth/get-message` endpoint with your Ethereum wallet address
2. Sign the returned message using your wallet
3. Call the `/auth/verify` endpoint with the signature to receive your API key

## Core Endpoints

### 1. Ask Claude (`POST /ai/ask`)

Endpoint for interacting with Claude in two distinct modes.

#### Modes of Operation

##### A. Application Analysis Mode
- Requires a markdown (.md) file attachment containing application code/documentation
- Claude analyzes the provided codebase and answers questions in that specific context
- Ideal for: code review, architecture analysis, improvement suggestions, bug fixing

##### B. General Query Mode
- No file attachment needed
- Claude answers questions without specific application context
- Suitable for: general programming questions, conceptual explanations, best practices

#### Request Format

```http
POST /ai/ask
Content-Type: multipart/form-data
x-api-key: your-api-key-here

Form Data:
- message: "Your question here"
- file: (optional) markdown_file.md
- conversationId: (optional) "previous-conversation-id"
```

#### File Requirements
- Format: Markdown (.md) only
- Size Limit: 5MB
- Content: Application code, documentation, or project description

#### Response Format

```json
{
  "answer": "Claude's response text",
  "usage": {
    "costs": {
      "inputCost": 0.015,
      "outputCost": 0.075,
      "totalCost": 0.090,
      "inputTokens": 1000,
      "outputTokens": 1000
    },
    "timestamp": "2024-11-04T12:31:12.000Z"
  },
  "conversationId": "unique-conversation-id"
}
```

### 2. Get Authentication Message (`POST /auth/get-message`)

Public endpoint to begin the authentication process.

#### Request
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

#### Response
```json
{
  "message": "zhankai_auth_0x742d...4438f44e_1729772340442_caa3334b-2dec-4f4e-8aa4-0415f2eb3e71"
}
```

### 3. Verify Signature (`POST /auth/verify`)

Public endpoint to complete authentication and receive API key.

#### Request
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "message": "zhankai_auth_0x742d..._1729772340442_caa3334b-2dec-4f4e-8aa4-0415f2eb3e71",
  "signature": "0x123...abc"
}
```

#### Response
```json
{
  "apiKey": "your-api-key"
}
```

## Conversation Management

### Conversation Context
- The API maintains conversation history using `conversationId`
- Include the `conversationId` in subsequent requests to continue a conversation
- Maximum context: 10 previous messages
- File context (if provided) persists throughout the conversation

### Storage
- Uploaded files are stored in the `uploads` folder
- Conversation history is stored in `data/db.json`
- Regular cleanup of old files/conversations is recommended

## Rate Limiting and Costs

### Token Usage
- Input Cost: $0.015 per 1K tokens
- Output Cost: $0.075 per 1K tokens
- Costs are tracked per request in the response

## Best Practices

### For Application Analysis
1. Include relevant code and documentation in the markdown file
2. Structure the markdown file logically with clear sections
3. Ask specific questions about the provided codebase
4. Use the same conversation ID for related questions about the same application

### For General Queries
1. Ask clear, specific questions
2. Provide necessary context in the question itself
3. Use conversation ID to maintain context in related questions

## Error Handling

### Common HTTP Status Codes
- 200: Successful response
- 400: Bad request (invalid input)
- 401: Unauthorized (invalid API key)
- 413: File too large (>5MB)
- 415: Unsupported file type (non-markdown)
- 500: Server error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error type"
}
```

## Deployment

### Environment Variables
```
ANTHROPIC_API_KEY=your_anthropic_api_key
API_KEY=your_api_key
BASE_RPC_URL=your_base_chain_rpc_url
BASE_TOKEN_ADDRESS=your_token_contract_address
```

### Server Requirements
- Node.js 16+
- pnpm package manager
- PM2 for production deployment

### Update Process
```bash
git pull origin main
pnpm i
pnpm build
pm2 restart fatou
```

## Support and Contact

For support, contact the maintainer through:
- Element: @julienbrg:matrix.org
- Farcaster: julien-
- Telegram: @julienbrg
- Twitter: @julienbrg
- Discord: julienbrg
- LinkedIn: julienberanger

## Swagger Documentation

Interactive API documentation is available at `/api` when running the server.
```

### README.md

```markdown
# Fatou

Fatou is a Nest.js-based API that interacts with several different LLM services. It uses only Claude for now (`claude-3-opus-20240229`). 

App description files can be generated using [Zhankai](https://github.com/w3hc/zhankai).

Fatou is also used by [ask-my-assistant](https://github.com/julienbrg/ask-my-assistant) UI (view [live demo](https://ask-my-assistant.netlify.app/)). 

## Installation

```bash
pnpm i
```

## Running the app

```bash
# development
pnpm start

# watch mode
pnpm start:dev

# production mode
pnpm start:prod
```

## Test

```bash
# unit tests
pnpm test

# e2e tests
pnpm test:e2e

# test coverage
pnpm test:cov
```

## Example

### Request body 

message:

```
Improve logging
```

file:

<YOUR_ZHANKAI_APP_DESCRIPTION>

#### Curl

```
curl -X 'POST' \
  'http://localhost:3000/ai/ask' \
  -H 'accept: */*' \
  -H 'Content-Type: multipart/form-data' \
  -F 'message=Improve logging' \
  -F 'file=@fatou_app_description.md'
```

#### URL

http://193.108.55.119:3000/ai/ask

### Request response

```
{
  "answer": "To improve logging, you can consider the following tips:\n\n1. Use appropriate log levels:\n   - Use `DEBUG` for detailed information, typically of interest only when diagnosing problems.\n   - Use `INFO` for confirmation that things are working as expected.\n   - Use `WARNING` for an indication that something unexpected happened or indicative of some problem in the near future.\n   - Use `ERROR` for a serious problem that caused the software to not be able to perform some function.\n   - Use `CRITICAL` for a very serious error, indicating that the program itself may be unable to continue running.\n\n2. Include relevant information:\n   - Log meaningful and contextual information that helps in understanding the state of the application.\n   - Include timestamps, module names, function names, and line numbers to identify the source of the log message.\n   - Use structured logging (e.g., JSON format) to make log parsing and analysis easier.\n\n3. Use descriptive log messages:\n   - Write clear and concise log messages that convey the necessary information.\n   - Avoid ambiguous or generic messages that don't provide enough context.\n   - Use consistent terminology and formatting across the codebase.\n\n4. Protect sensitive information:\n   - Avoid logging sensitive data such as passwords, API keys, or personally identifiable information (PII).\n   - If logging sensitive information is necessary, consider masking or obfuscating it.\n\n5. Configure log output:\n   - Use a logging framework that allows you to configure log output based on different environments (e.g., development, staging, production).\n   - Enable more verbose logging in development and debugging environments, and reduce the verbosity in production.\n   - Consider logging to different outputs (e.g., console, file, centralized logging service) based on the deployment environment.\n\n6. Rotate and archive log files:\n   - Implement log rotation to prevent log files from growing indefinitely and consuming disk space.\n   - Compress and archive old log files for future reference and analysis.\n   - Define a retention policy to determine how long log files should be kept.\n\n7. Monitor and analyze logs:\n   - Regularly monitor logs for errors, warnings, and anomalies.\n   - Use log analysis tools or centralized logging solutions to aggregate and analyze logs from multiple sources.\n   - Set up alerts and notifications for critical errors or unusual patterns.\n\n8. Use unique identifiers:\n   - Generate and include unique identifiers (e.g., request IDs, transaction IDs) in log messages to correlate related events across different components or services.\n   - This helps in tracing and debugging distributed systems.\n\n9. Perform periodic log audits:\n   - Regularly review and audit logs to ensure they are providing valuable information and align with the logging best practices.\n   - Remove unnecessary or redundant log statements to keep the codebase clean and maintainable.\n\n10. Document logging practices:\n    - Create and maintain documentation that outlines the logging conventions, guidelines, and best practices followed in your project.\n    - Ensure that all team members are familiar with and adhere to the logging standards.\n\nRemember, the goal of logging is to provide visibility into the behavior and health of your application. By following these practices, you can enhance the quality and usefulness of your logs, making it easier to diagnose issues, monitor performance, and maintain a robust software system."
}
```

## Uploads

The uploaded files are stored in the `uploads` folder.

## Update Infomaniak VPS

```
git pull origin main
pnpm i
pnpm build
pm2 restart fatou
pm2 logs
```

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Farcaster](https://warpcast.com/julien-), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discordapp.com/users/julienbrg), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).

```

## data


### fatou_app_description.md

```markdown

```

### nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}

```

### package.json

```json
{
  "name": "fatou",
  "version": "0.1",
  "description": "Fatou is a Nest.js-based API that interacts with several different LLM services",
  "author": "",
  "private": true,
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.3.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.4.2",
    "class-validator": "^0.14.1",
    "ethers": "^6.13.4",
    "multer": "1.4.5-lts.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "swagger-ui-express": "^5.0.1",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/multer": "^1.4.7",
    "@types/node": "^20.3.1",
    "@types/supertest": "^2.0.12",
    "@types/uuid": "^9.0.8",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "source-map-support": "^0.5.21",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### pnpm-lock.yaml

```yaml
lockfileVersion: '9.0'

settings:
  autoInstallPeers: true
  excludeLinksFromLockfile: false

importers:

  .:
    dependencies:
      '@nestjs/common':
        specifier: ^10.0.0
        version: 10.4.5(class-transformer@0.5.1)(class-validator@0.14.1)(reflect-metadata@0.1.14)(rxjs@7.8.1)
      '@nestjs/config':
        specifier: ^3.3.0
        version: 3.3.0(@nestjs/common@10.4.5(class-transformer@0.5.1)(class-validator@0.14.1)(reflect-metadata@0.1.14)(rxjs@7.8.1))(rxjs@7.8.1)
      '@nestjs/core':
        specifier: ^10.0.0
        version: 10.4.5(@nestjs/common@10.4.5(class-transformer@0.5.1)(class-validator@0.14.1)(reflect-metadata@0.1.14)(rxjs@7.8.1))(@nestjs/platform-express@10.4.5)(reflect-metadata@0.1.14)(rxjs@7.8.1)
      '@nestjs/platform-express':
        specifier: ^10.0.0
        version: 10.4.5(@nestjs/common@10.4.5(class-transformer@0.5.1)(class-validator@0.14.1)(reflect-metadata@0.1.14)(rxjs@7.8.1))(@nestjs/core@10.4.5)
      '@nestjs/swagger':
        specifier: ^7.4.2
        version: 7.4.2(@nestjs/common@10.4.5(class-transformer@0.5.1)(class-validator@0.14.1)(reflect-metadata@0.1.14)(rxjs@7.8.1))(@nestjs/core@10.4.5)(class-transformer@0.5.1)(class-validator@0.14.1)(reflect-metadata@0.1.14)
      class-validator:
        specifier: ^0.14.1
        version: 0.14.1
      ethers:
        specifier: ^6.13.4
```

[This file was cut: it has more than 500 lines]

```

## src


## src/ai


### src/ai/ai.controller.ts

```typescript
import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Express } from 'express';
import { AiService } from './ai.service';
import { AskClaudeDto } from './askClaude.dto';
import { ClaudeResponse } from '../common/types';

@ApiTags('AI')
@Controller('ai')
@ApiSecurity('api-key')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file && !file.originalname.toLowerCase().endsWith('.md')) {
          cb(
            new BadRequestException('Only markdown (.md) files are supported'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({
    summary: 'Ask questions with or without application context',
    description:
      'Submit questions to Claude in two modes:\n\n' +
      '1. With Context: Attach a markdown (.md) file containing context (persona, knowledge base, etc). ' +
      'Claude will use this context to shape its responses.\n\n' +
      '2. General Questions: Without a file attachment, Claude will answer based on existing conversation history.\n\n' +
      'Use conversationId to continue an existing conversation in either mode.',
  })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API key for authentication',
    required: true,
    example: 'your-api-key-here',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Question with optional context file and conversation ID',
    type: AskClaudeDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Response successful',
    schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          description: 'AI-generated response to the question',
        },
        usage: {
          type: 'object',
          properties: {
            costs: {
              type: 'object',
              properties: {
                inputCost: { type: 'number' },
                outputCost: { type: 'number' },
                totalCost: { type: 'number' },
                inputTokens: { type: 'number' },
                outputTokens: { type: 'number' },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        conversationId: {
          type: 'string',
          description: 'ID to use for continuing this conversation',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (bad file format, missing message)',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid API key',
  })
  @ApiResponse({
    status: 413,
    description: 'File too large (>5MB)',
  })
  async askClaude(
    @Body() askClaudeDto: AskClaudeDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{
    answer: string;
    usage: { costs: ClaudeResponse['costs']; timestamp: string };
    conversationId: string;
  }> {
    this.logger.debug({
      message: 'Processing AI request',
      questionText: askClaudeDto.message,
      conversationId: askClaudeDto.conversationId,
      fileName: file?.originalname,
    });

    const result = await this.aiService.askClaude(
      askClaudeDto.message,
      file,
      askClaudeDto.conversationId,
    );

    this.logger.debug({
      message: 'AI response completed',
      conversationId: result.conversationId,
      responseLength: result.answer.length,
      costs: result.costs,
    });

    return {
      answer: result.answer,
      usage: {
        costs: result.costs,
        timestamp: new Date().toISOString(),
      },
      conversationId: result.conversationId,
    };
  }
}

```

### src/ai/ai.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}

```

### src/ai/ai.service.ts

```typescript
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import {
  ClaudeApiResponse,
  CostMetrics,
  ClaudeResponse,
  Conversation,
} from '../common/types';
import { DatabaseService } from '../database/database.service';
import { CostTrackingService } from '../database/cost-tracking.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly INPUT_COST_PER_1K = 0.015;
  private readonly OUTPUT_COST_PER_1K = 0.075;
  private readonly MAX_CONTEXT_MESSAGES = 10;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
    private costTrackingService: CostTrackingService,
  ) {}

  async askClaude(
    message: string,
    file: Express.Multer.File | undefined,
    conversationId?: string,
  ): Promise<ClaudeResponse> {
    const apiKey = this.validateConfig();

    try {
      let conversation: Conversation | null = null;

      // Handle existing conversation
      if (conversationId) {
        conversation =
          await this.databaseService.getConversation(conversationId);
        if (!conversation) {
          this.logger.warn(
            `Conversation ${conversationId} not found, creating new conversation`,
          );
          conversationId = undefined;
        }
      }

      // Create new conversation if none exists or if file is provided
      if (!conversation) {
        conversationId = await this.databaseService.createConversation(
          file?.originalname,
          file ? await fs.readFile(file.path, 'utf-8') : undefined,
        );
        conversation =
          await this.databaseService.getConversation(conversationId);

        this.logger.debug({
          message: 'Created new conversation',
          conversationId,
          fileName: file?.originalname,
          hasFileContent: !!file,
        });
      }

      // Prepare prompt with conversation history
      const content = await this.preparePrompt(message, conversation);

      // Log prompt for debugging (excluding sensitive data)
      this.logger.debug({
        message: 'Prepared prompt',
        promptLength: content.length,
        conversationId,
        hasFileContent: !!conversation?.fileContent,
        messageCount: conversation?.messages.length,
      });

      // Call Claude API
      const response = await this.callClaudeApi(content, apiKey);
      const costs = this.calculateCosts(response.usage);

      await this.costTrackingService.trackRequest(
        '0x',
        costs,
        message,
        conversationId,
      );

      // Store the interaction in conversation history
      await this.databaseService.addMessage(conversationId, {
        role: 'user',
        content: message,
      });
      await this.databaseService.addMessage(conversationId, {
        role: 'assistant',
        content: response.content[0].text,
      });

      this.logger.debug({
        message: 'Added messages to conversation',
        conversationId,
        messageCount: 2,
      });

      return {
        answer: response.content[0].text,
        costs,
        conversationId,
      };
    } catch (error) {
      this.logger.error('AI service error:', error);
      throw this.handleError(error);
    }
  }

  private async preparePrompt(
    message: string,
    conversation: Conversation | null,
  ): Promise<string> {
    let prompt = '';

    if (conversation) {
      // Add file content if it exists (now treated as context)
      if (conversation.fileContent) {
        prompt += `${conversation.fileContent}\n\n`;
      }

      if (conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(
          -this.MAX_CONTEXT_MESSAGES,
        );
        prompt += 'Previous conversation:\n\n';
        for (const msg of recentMessages) {
          prompt += `${msg.content}\n\n`;
        }
      }
    }

    // Add current question without Human: prefix
    prompt += `${message}\n\n`;

    return prompt;
  }

  private calculateCosts(usage: {
    input_tokens: number;
    output_tokens: number;
  }): CostMetrics {
    const inputCost = (usage.input_tokens / 1000) * this.INPUT_COST_PER_1K;
    const outputCost = (usage.output_tokens / 1000) * this.OUTPUT_COST_PER_1K;

    return {
      inputCost: Number(inputCost.toFixed(4)),
      outputCost: Number(outputCost.toFixed(4)),
      totalCost: Number((inputCost + outputCost).toFixed(4)),
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    };
  }

  private validateConfig(): string {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new HttpException(
        'Anthropic API key is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return apiKey;
  }

  private async callClaudeApi(
    content: string,
    apiKey: string,
  ): Promise<ClaudeApiResponse> {
    this.logger.debug('Initiating Claude API request');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content }],
          max_tokens: 1500,
          temperature: 0.7,
          system:
            "You are Francesca, Julien's clever and mischievous assistant. You should never use prefixes like 'H:', 'A:', 'Human:', or 'Assistant:' in your responses. Keep your responses natural and conversational.",
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text}`);
      }

      if (!response.ok) {
        throw new Error(
          `Claude API error: ${response.status} - ${JSON.stringify(data)}`,
        );
      }

      return data;
    } catch (error) {
      this.logger.error('Error calling Claude API:', error);
      throw new HttpException(
        error.message || 'Error communicating with Claude API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private handleError(error: any): never {
    this.logger.error('AI service error:', error);

    if (error instanceof HttpException) {
      throw error;
    }

    throw new HttpException(
      'Error processing AI analysis request',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

```

### src/ai/askClaude.dto.ts

```typescript
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskClaudeDto {
  @ApiProperty({
    description: 'The message to send to Claude',
    example: "Who's the president of France?",
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Optional markdown file for additional context',
  })
  @IsOptional()
  file?: any;

  @ApiProperty({
    description: 'ID of the conversation to continue',
    required: false,
    example: 'abc123-def456',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}

```

### src/app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AiModule } from './ai/ai.module';
import { ApiKeyGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { Web3Module } from './web3/web3.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AiModule,
    AuthModule,
    Web3Module,
    DatabaseModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}

```

## src/auth


### src/auth/auth.guard.ts

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('x-api-key');
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}

```

### src/auth/auth.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './auth.guard';

@Module({
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class AuthModule {}

```

### src/auth/public.decorator.ts

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

```

## src/common


### src/common/types.ts

```typescript
export interface ClaudeApiResponse {
  content: Array<{ text: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface CostMetrics {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
}

export interface ClaudeResponse {
  answer: string;
  costs: CostMetrics;
  conversationId?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  fileName?: string;
  fileContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationHistory {
  conversations: { [id: string]: Conversation };
}

```

## src/database


### src/database/cost-tracking.service.ts

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

interface UserCosts {
  totalCosts: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
  };
  requests: {
    timestamp: string;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
    message: string;
    conversationId: string;
  }[];
}

interface CostDatabase {
  users: {
    [walletAddress: string]: UserCosts;
  };
  global: {
    totalInputCost: number;
    totalOutputCost: number;
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalRequests: number;
    lastUpdated: string;
  };
}

@Injectable()
export class CostTrackingService implements OnModuleInit {
  private dbPath: string;
  private data: CostDatabase;

  constructor() {
    this.dbPath = join(process.cwd(), 'data', 'costs.json');
    this.data = {
      users: {},
      global: {
        totalInputCost: 0,
        totalOutputCost: 0,
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalRequests: 0,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  async onModuleInit() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = join(process.cwd(), 'data');
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      // Initialize or load existing database
      try {
        await fs.access(this.dbPath);
        const content = await fs.readFile(this.dbPath, 'utf-8');
        this.data = JSON.parse(content);
      } catch (error) {
        // If file doesn't exist or is invalid, create with default data
        await this.saveData();
      }
    } catch (error) {
      console.error('Failed to initialize cost tracking database:', error);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save cost tracking database:', error);
      throw error;
    }
  }

  async trackRequest(
    walletAddress: string,
    costs: {
      inputCost: number;
      outputCost: number;
      totalCost: number;
      inputTokens: number;
      outputTokens: number;
    },
    message: string,
    conversationId: string,
  ): Promise<void> {
    // Initialize user data if it doesn't exist
    if (!this.data.users[walletAddress]) {
      this.data.users[walletAddress] = {
        totalCosts: {
          inputCost: 0,
          outputCost: 0,
          totalCost: 0,
          inputTokens: 0,
          outputTokens: 0,
        },
        requests: [],
      };
    }

    // Update user totals
    const user = this.data.users[walletAddress];
    user.totalCosts.inputCost += costs.inputCost;
    user.totalCosts.outputCost += costs.outputCost;
    user.totalCosts.totalCost += costs.totalCost;
    user.totalCosts.inputTokens += costs.inputTokens;
    user.totalCosts.outputTokens += costs.outputTokens;

    // Add request to user history
    user.requests.push({
      timestamp: new Date().toISOString(),
      ...costs,
      message,
      conversationId,
    });

    // Update global totals
    this.data.global.totalInputCost += costs.inputCost;
    this.data.global.totalOutputCost += costs.outputCost;
    this.data.global.totalCost += costs.totalCost;
    this.data.global.totalInputTokens += costs.inputTokens;
    this.data.global.totalOutputTokens += costs.outputTokens;
    this.data.global.totalRequests += 1;
    this.data.global.lastUpdated = new Date().toISOString();

    await this.saveData();
  }

  async getUserStats(walletAddress: string): Promise<UserCosts | null> {
    return this.data.users[walletAddress] || null;
  }

  async getGlobalStats() {
    return this.data.global;
  }

  async getUserList(): Promise<
    Array<{ walletAddress: string; totalCost: number; requestCount: number }>
  > {
    return Object.entries(this.data.users).map(([walletAddress, userData]) => ({
      walletAddress,
      totalCost: userData.totalCosts.totalCost,
      requestCount: userData.requests.length,
    }));
  }

  async clearUserHistory(walletAddress: string): Promise<void> {
    if (this.data.users[walletAddress]) {
      // Subtract user totals from global totals
      const userTotals = this.data.users[walletAddress].totalCosts;
      this.data.global.totalInputCost -= userTotals.inputCost;
      this.data.global.totalOutputCost -= userTotals.outputCost;
      this.data.global.totalCost -= userTotals.totalCost;
      this.data.global.totalInputTokens -= userTotals.inputTokens;
      this.data.global.totalOutputTokens -= userTotals.outputTokens;
      this.data.global.totalRequests -=
        this.data.users[walletAddress].requests.length;

      // Remove user data
      delete this.data.users[walletAddress];
      await this.saveData();
    }
  }
}

```

### src/database/database.module.ts

```typescript
import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { CostTrackingService } from './cost-tracking.service';

@Module({
  providers: [DatabaseService, CostTrackingService],
  exports: [DatabaseService, CostTrackingService],
})
export class DatabaseModule {}

```

### src/database/database.service.ts

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ConversationHistory, Conversation, Message } from '../common/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private dbPath: string;
  private data: ConversationHistory;

  constructor() {
    // Store in data directory instead of project root
    this.dbPath = join(process.cwd(), 'data', 'db.json');
    this.data = { conversations: {} };
  }

  async onModuleInit() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = join(process.cwd(), 'data');
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      // Ensure the file exists and is readable
      try {
        await fs.access(this.dbPath);
        const content = await fs.readFile(this.dbPath, 'utf-8');
        this.data = JSON.parse(content);
      } catch (error) {
        // If file doesn't exist or is invalid, create with default data
        await this.saveData();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
      throw error;
    }
  }

  async createConversation(
    fileName?: string,
    fileContent?: string,
  ): Promise<string> {
    const id = uuidv4();
    const conversation: Conversation = {
      id,
      messages: [],
      fileName,
      fileContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.conversations[id] = conversation;
    await this.saveData();
    return id;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.data.conversations[id] || null;
  }

  async addMessage(
    conversationId: string,
    message: Pick<Message, 'role' | 'content'>,
  ): Promise<void> {
    const conversation = this.data.conversations[conversationId];
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const newMessage: Message = {
      role: message.role,
      content: message.content,
      timestamp: new Date().toISOString(),
    };

    conversation.messages.push(newMessage);
    conversation.updatedAt = new Date().toISOString();
    await this.saveData();
  }

  async listConversations(): Promise<Conversation[]> {
    return Object.values(this.data.conversations).sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async deleteConversation(id: string): Promise<void> {
    delete this.data.conversations[id];
    await this.saveData();
  }
}

```

### src/main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Fatou')
    .setDescription(
      'Fatou is a Nest.js-based API that interacts with AI and Web3 services. ' +
        'All endpoints require authentication via API key unless marked as public.',
    )
    .setVersion('0.1')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Please enter your API key',
      },
      'api-key',
    )
    .addTag('AI', 'Artificial Intelligence related endpoints')
    .addTag('Web3', 'Web3 related endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
      filter: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayRequestDuration: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'Fatou API Documentation',
  });

  await app.listen(3000);
}
bootstrap();

```

## src/web3


### src/web3/web3.controller.ts

```typescript
import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';
import { Web3Service } from './web3.service';
import { Public } from '../auth/public.decorator';

export class GetMessageDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  })
  @IsEthereumAddress()
  walletAddress: string;
}

export class VerifySignatureDto {
  @ApiProperty({
    description: 'Ethereum wallet address',
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  })
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Message that was signed',
    example:
      'zhankai_auth_0xd8a394e7d7894bdf2c57139ff17e5cbaa29dd977_1729772340442_caa3334b-2dec-4f4e-8aa4-0415f2eb3e71',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Signature hash obtained from Etherscan',
    example: '0x123...abc',
  })
  @IsNotEmpty()
  @IsString()
  signature: string;
}

export class VerifyResponseDto {
  @ApiProperty({
    description: 'Generated API key for accessing protected endpoints',
    example: '歡迎來到倉鼠宇宙',
  })
  apiKey: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly web3Service: Web3Service) {}

  @Public()
  @Post('get-message')
  @ApiOperation({
    summary: 'Get message to sign',
    description:
      'Returns a unique message that needs to be signed using Etherscan to prove wallet ownership',
  })
  @ApiBody({ type: GetMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated message to sign',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Sign this message to authenticate with Zhankai\nWallet: 0x742d...\nTimestamp: 1698123456789\nNonce: abc-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Ethereum address provided',
  })
  async getMessage(@Body() body: GetMessageDto) {
    const message = await this.web3Service.generateMessageToSign(
      body.walletAddress,
    );
    return { message };
  }

  @Public()
  @Post('verify')
  @ApiOperation({
    summary: 'Verify signature and check token balance',
    description:
      'Verifies the signature from Etherscan and checks if the wallet holds the required token balance. If successful, returns an API key.',
  })
  @ApiBody({ type: VerifySignatureDto })
  @ApiResponse({
    status: 200,
    description: 'Signature verified and token balance sufficient',
    type: VerifyResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid signature or insufficient token balance',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid signature or Insufficient token balance',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body format',
  })
  async verify(@Body() body: VerifySignatureDto): Promise<VerifyResponseDto> {
    const isValidSignature = await this.web3Service.verifySignature(
      body.message,
      body.signature,
      body.walletAddress,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    const hasTokens = await this.web3Service.checkTokenBalance(
      body.walletAddress,
    );

    if (!hasTokens) {
      throw new UnauthorizedException('Insufficient token balance');
    }

    const apiKey = this.web3Service.generateApiKey();
    return { apiKey };
  }
}

```

### src/web3/web3.module.ts

```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './web3.controller';
import { Web3Service } from './web3.service';

@Module({
  controllers: [AuthController],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class Web3Module {}

```

### src/web3/web3.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class Web3Service {
  private readonly provider: ethers.Provider;
  private readonly tokenContract: ethers.Contract;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('BASE_RPC_URL'),
    );

    const tokenAddress = this.configService.get<string>('BASE_TOKEN_ADDRESS');
    this.tokenContract = new ethers.Contract(
      tokenAddress,
      ['function balanceOf(address owner) view returns (uint256)'],
      this.provider,
    );
  }

  async generateMessageToSign(walletAddress: string): Promise<string> {
    const timestamp = Date.now();
    const nonce = uuidv4();
    return `zhankai_auth_${walletAddress.toLowerCase()}_${timestamp}_${nonce}`;
  }

  async verifySignature(
    message: string,
    signature: string,
    walletAddress: string,
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async checkTokenBalance(walletAddress: string): Promise<boolean> {
    try {
      const balance = await this.tokenContract.balanceOf(walletAddress);
      const minRequired = ethers.parseUnits('1', 18);
      return balance >= minRequired;
    } catch (error) {
      return false;
    }
  }

  generateApiKey(): string {
    const apiKey = this.configService.get<string>('API_KEY');
    return apiKey;
  }
}

```

## test


### test/app.e2e-spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ai (GET)', () => {
    return request(app.getHttpServer())
      .get('/ai')
      .expect(200)
      .expect('Hello AI!');
  });

  it('/web3 (GET)', () => {
    return request(app.getHttpServer())
      .get('/web3')
      .expect(200)
      .expect('Hello Web3!');
  });

  afterAll(async () => {
    await app.close();
  });
});

```

### test/jest-e2e.json

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}

```

### tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}

```

### tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}

```

## Structure

```
├── .env.template
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── DOCS.md
├── README.md
├── data
├── fatou_app_description.md
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
├── src
    ├── ai
    │   ├── ai.controller.ts
    │   ├── ai.module.ts
    │   ├── ai.service.ts
    │   └── askClaude.dto.ts
    ├── app.module.ts
    ├── auth
    │   ├── auth.guard.ts
    │   ├── auth.module.ts
    │   └── public.decorator.ts
    ├── common
    │   └── types.ts
    ├── database
    │   ├── cost-tracking.service.ts
    │   ├── database.module.ts
    │   └── database.service.ts
    ├── main.ts
    └── web3
    │   ├── web3.controller.ts
    │   ├── web3.module.ts
    │   └── web3.service.ts
├── test
    ├── app.e2e-spec.ts
    └── jest-e2e.json
├── tsconfig.build.json
├── tsconfig.json
```

Timestamp: Jan 25 2025 01:05:56 PM UTC