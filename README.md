# Fatou

Fatou is a Nest.js-based API that interacts with several different LLM services.

App description files can beb generated using [Zhankai](https://github.com/w3hc/zhankai).

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
