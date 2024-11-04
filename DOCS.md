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