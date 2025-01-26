# Fatou API Documentation

## Overview

Fatou is a Nest.js-based API that provides an interface to Claude, an advanced language model. The API enables two primary modes of operation:

1. Application Analysis Mode - For analyzing codebases and providing technical insights
2. General Query Mode - For standard AI interactions and conversations

## Authentication

### API Key Types

1. **Master Key**
   - Full administrative access
   - Set via `MASTER_KEY` environment variable
   - Required for administrative endpoints

2. **User API Keys**
   - Generated after token verification
   - Limited to AI interaction endpoints
   - Automatically tracked for usage and billing

### Obtaining an API Key

1. Call `/auth/get-message`
2. Sign the message with your Ethereum wallet
3. Call `/auth/verify` with the signature
4. Hold minimum required token balance (1 token)

### Authentication Headers
```http
x-api-key: your-api-key-here
```

## Core Endpoints

### AI Interaction

#### POST /ai/ask

Primary endpoint for interacting with Claude in both analysis and general modes.

**Request Format**
```http
POST /ai/ask
Content-Type: multipart/form-data
x-api-key: your-api-key-here

Form Data:
- message: string (required)
- file: .md file (optional)
- conversationId: string (optional)
```

**File Requirements**
- Format: Markdown (.md) only
- Size Limit: 5MB
- Content: Application code, documentation, or project description
- Structure: Logical sections with clear headers

**Response Format**
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

### Authentication Flow

#### POST /auth/get-message

**Request**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

**Response**
```json
{
  "message": "zhankai_auth_0x742d...4438f44e_1729772340442_caa3334b-2dec-4f4e-8aa4-0415f2eb3e71"
}
```

#### POST /auth/verify

**Request**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "message": "zhankai_auth_0x742d..._1729772340442_caa3334b-2dec-4f4e-8aa4-0415f2eb3e71",
  "signature": "0x123...abc"
}
```

**Response**
```json
{
  "apiKey": "your-api-key"
}
```

## Conversation Management

### Context Persistence
- Conversations tracked via `conversationId`
- Maximum context: 10 previous messages
- File context persists throughout conversation
- Each new file upload creates new conversation

### Storage
- Files: `uploads/` directory
- Conversations: `data/db.json`
- API Keys: `data/api-keys.json`
- Costs: `data/costs.json`

### Cleanup
- Implement regular cleanup for uploaded files
- Archive old conversations periodically
- Monitor storage usage

## Rate Limiting & Costs

### Token Usage
- Input: $0.015 per 1K tokens
- Output: $0.075 per 1K tokens
- Costs tracked per request
- Billing aggregated by wallet address

### Rate Limits
- Maximum file size: 5MB
- Maximum context: 10 messages
- Maximum output tokens: 1500

## Error Handling

### HTTP Status Codes
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 413: File Too Large
- 415: Invalid File Type
- 500: Server Error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Error type"
}
```

## Best Practices

### Application Analysis
1. Structure markdown files logically
2. Include relevant code snippets
3. Add context and documentation
4. Use consistent conversation IDs
5. Clean file uploads regularly

### General Queries
1. Provide clear context
2. Use conversation IDs for related queries
3. Monitor token usage
4. Handle errors gracefully
5. Implement request retries

## Deployment

### Environment Variables
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
MASTER_KEY=your_master_key
BASE_RPC_URL=your_base_chain_rpc_url
BASE_TOKEN_ADDRESS=your_token_contract_address
```

### Server Requirements
- Node.js 16+
- pnpm package manager
- PM2 for production
- 1GB RAM minimum
- 10GB storage minimum

### Security Requirements
- Enable HTTPS
- Set secure CORS policies
- Rate limit by IP
- Monitor API key usage
- Regular security audits

### Update Process
```bash
git pull origin main
pnpm i
pnpm build
pm2 restart fatou
pm2 logs
```

## API Versioning

Current version: v1
- All endpoints prefixed with /v1
- Breaking changes trigger version increment
- Maintain backward compatibility
- Version sunset schedule: 6 months notice

## Monitoring

### Metrics to Track
- Request volume
- Response times
- Error rates
- Token usage
- API key usage
- File upload sizes
- Conversation lengths

### Health Checks
- Endpoint: /health
- Checks: Database, Claude API, Token contract
- Response format includes component status

## Development

### Local Setup
```bash
# Clone repository
git clone https://github.com/yourusername/fatou.git

# Install dependencies
pnpm i

# Configure environment
cp .env.template .env
# Edit .env with your values

# Start development server
pnpm start:dev
```

### Testing
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

## Support

Contact the maintainer:
- Element: @julienbrg:matrix.org
- Farcaster: julien-
- Telegram: @julienbrg
- Twitter: @julienbrg
- Discord: julienbrg
- LinkedIn: julienberanger

## API Reference

Interactive Swagger documentation available at `/api` endpoint.