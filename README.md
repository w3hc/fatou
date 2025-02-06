# Fatou

Fatou is a Nest.js-based API that provides a powerful interface to interact with Claude. It currently uses `claude-3-opus-20240229` and is designed to handle both general queries and application analysis.

## Key Features

- 🤖 Claude AI Integration (claude-3-opus-20240229)
- 🔐 API Key Authentication with Master/User key system
- 📁 Context Management System with file upload/download
- 💰 Token-based Access Control (Base Chain)
- 📊 Usage Tracking and Cost Management
- 🔄 Conversation History Management
- 📝 Markdown File Analysis Support

We also can add interactions with any other LLM services. 

## Quick Links

- [Live Demo](https://ask-my-assistant.netlify.app/) - Try the UI interface (chat with Francesca, Julien's faithful assistant)
- [Technical Documentation](https://github.com/w3hc/fatou/blob/main/DOCS.md) - Full API documentation
- [Zhankai](https://github.com/w3hc/zhankai) - Generate app description files

## Prerequisites

- Node.js 16+
- pnpm
- Ethereum wallet (for authentication)
- Required token balance on Base Chain

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/fatou.git

# Install dependencies
pnpm i

# Configure environment variables
cp .env.template .env
# Edit .env with your values
```

Required environment variables:
```
ANTHROPIC_API_KEY=     # Your Claude API key
MASTER_KEY=           # Master key for admin access
BASE_RPC_URL=         # Base Chain RPC URL
BASE_TOKEN_ADDRESS=   # Token contract address
```

## Development

```bash
# Start development server
pnpm start:dev

# Run in production mode
pnpm start:prod

# Run tests
pnpm test            # Unit tests
pnpm test:e2e        # E2E tests
pnpm test:cov        # Test coverage
```

## Usage Examples

### 1. Get Authentication Message

```bash
curl -X POST http://localhost:3000/auth/get-message \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"}'
```

### 2. Ask Claude a Question

```bash
curl -X POST http://localhost:3000/ai/ask \
  -H "Content-Type: multipart/form-data" \
  -H "x-api-key: your-api-key-here" \
  -F "message=Your question here" \
  -F "file=@your_file.md"
```

### 3. Manage Context Files

```bash
# Upload context file
curl -X POST http://localhost:3000/context-files/add-context \
  -H "x-api-key: your-api-key-here" \
  -F "file=@context.md"

# Download context file
curl -X POST http://localhost:3000/context-files/download-context \
  -H "x-api-key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"filename": "context.md"}'
```

## File Structure

```
fatou/
├── data/                  # Persistent data storage
│   ├── contexts/         # Context files for API keys
│   ├── api-keys.json    # API key database
│   ├── costs.json      # Usage tracking
│   └── db.json        # Conversation history
├── uploads/            # Temporary file uploads
└── src/               # Source code
```

## Deployment

### Update on Infomaniak VPS

```bash
git pull origin main
pnpm i
pnpm build
pm2 restart fatou
pm2 logs
```

### Server Requirements

- 1GB RAM minimum
- 10GB storage
- Node.js 16+
- PM2 for process management
- HTTPS enabled

## Support and Contact

Feel free to reach out through any of these channels:

- 💬 Element: [@julienbrg:matrix.org](https://matrix.to/#/@julienbrg:matrix.org)
- 🦄 Farcaster: [julien-](https://warpcast.com/julien-)
- 📱 Telegram: [@julienbrg](https://t.me/julienbrg)
- 🐦 Twitter: [@julienbrg](https://twitter.com/julienbrg)
- 🎮 Discord: [julienbrg](https://discordapp.com/users/julienbrg)
- 💼 LinkedIn: [julienberanger](https://www.linkedin.com/in/julienberanger/)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.