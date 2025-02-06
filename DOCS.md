# Fatou API Documentation

## Overview

Fatou is a Nest.js-based API that provides an interface to Claude, an advanced language model. The API enables two primary modes of operation:

1. Application Analysis Mode - For analyzing codebases and providing technical insights
2. General Query Mode - For standard AI interactions and conversations

## Authentication

### API Key Types

1. **Master Key**
   - Full administrative access to all endpoints
   - Set via `MASTER_KEY` environment variable
   - Required for managing API keys and administrative functions
   - Example usage: Creating/revoking user API keys

2. **User API Keys**
   - Generated after token verification
   - Limited to AI interaction endpoints and context management
   - Automatically tracked for usage and billing
   - Each key has its own isolated context directory

### Obtaining an API Key

1. Call `/auth/get-message`
2. Sign the message with your Ethereum wallet
3. Call `/auth/verify` with the signature
4. Hold minimum required token balance (1 token)

### Authentication Headers
```http
x-api-key: your-api-key-here
```

## Context Management

### Context Directory Structure
- Each API key has a dedicated context directory
- Located at `data/contexts/<api-key-id>/`
- Created automatically when API key is generated
- Supports multiple markdown files per API key

### Managing Context Files

#### Upload Context File
```http
POST /context-files/add-context
Content-Type: multipart/form-data
x-api-key: your-api-key-here

Form Data:
- file: .md file (required)
```

**Notes:**
- Only markdown (.md) files are accepted
- 5MB file size limit
- Duplicate filenames will replace existing files
- Returns upload status and replacement information

#### Download Context File
```http
POST /context-files/download-context
Content-Type: application/json
x-api-key: your-api-key-here

{
  "filename": "context.md"
}
```

**Notes:**
- Returns file as downloadable attachment
- Content-Type: text/markdown
- Returns 404 if file not found

#### Delete Context File
```http
DELETE /context-files/delete-context
Content-Type: application/json
x-api-key: your-api-key-here

{
  "filename": "context.md"
}
```

#### List Context Files
```http
POST /context-files/list-files
Content-Type: application/json
x-api-key: your-api-key-here

{
  "id": "api-key-id"
}
```

## API Key Management

### Create API Key (Admin Only)
```http
POST /api-keys
x-api-key: master-key-here

{
  "walletAddress": "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"
}
```

### Revoke API Key (Admin Only)
```http
DELETE /api-keys/:key
x-api-key: master-key-here
```

### List API Keys for Wallet
```http
GET /api-keys/wallet/:address
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

## Storage Structure

### Main Directories
```
data/
├── contexts/             # Context files for each API key
│   ├── <api-key-id-1>/  # Isolated context directory
│   │   ├── context1.md
│   │   └── context2.md
│   └── <api-key-id-2>/
├── api-keys.json        # API key database
├── costs.json          # Usage tracking
└── db.json            # Conversation history

uploads/               # Temporary upload directory
```

### Data Files

#### api-keys.json
```json
{
  "<api-key>": {
    "id": "unique-id",
    "key": "api-key",
    "walletAddress": "0x...",
    "createdAt": "ISO-date",
    "lastUsedAt": "ISO-date",
    "isActive": true
  }
}
```

#### costs.json
```json
{
  "users": {
    "<wallet-address>": {
      "totalCosts": {
        "inputCost": 0.015,
        "outputCost": 0.075,
        "totalCost": 0.090,
        "inputTokens": 1000,
        "outputTokens": 1000
      },
      "requests": [...]
    }
  },
  "global": {
    "totalInputCost": 0.015,
    "totalOutputCost": 0.075,
    "totalCost": 0.090,
    "totalRequests": 1,
    "lastUpdated": "ISO-date"
  }
}
```

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
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid API key)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
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

## Development

### Environment Setup
```bash
# Required environment variables
ANTHROPIC_API_KEY=your_anthropic_api_key
MASTER_KEY=your_master_key
BASE_RPC_URL=your_base_chain_rpc_url
BASE_TOKEN_ADDRESS=your_token_contract_address
```

### Local Development
```bash
# Install dependencies
pnpm i

# Start development server
pnpm start:dev

# Run tests
pnpm test
```

### Deployment
```bash
git pull origin main
pnpm i
pnpm build
pm2 restart fatou
pm2 logs
```

## Security Best Practices

1. API Key Management
   - Rotate API keys regularly
   - Never share or expose the MASTER_KEY
   - Monitor API key usage for suspicious activity
   - Revoke unused or compromised keys immediately

2. File Security
   - Validate all file uploads
   - Enforce file size and type restrictions
   - Clean up temporary files
   - Regular security audits of stored files

3. Access Control
   - Use HTTPS in production
   - Implement proper CORS policies
   - Rate limit by IP and API key
   - Regular security audits

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