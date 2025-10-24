# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-22

### Added
- Initial release of mjpin Discord bot
- Pinterest API v5 integration with OAuth2 authentication
- Multi-account Pinterest support with account switching
- Automatic image search and pinning via `/pin` command with keyword search
- OpenAI integration for Midjourney prompt generation
- Per-guild OpenAI model selection via `/model` command
- Modular system prompt system with live editing via `/editprompt`
- Rate limiting (100 pins per 12 hours per Pinterest account)
- OAuth callback handler for Pinterest authentication
- PM2 process management with restart confirmation
- File-based JSON storage for all persistent data
- Comprehensive error handling and graceful degradation

### Changed
- Consolidated image search and pinning into single `/pin` command
- Improved command interfaces and user experience

### Technical
- Node.js Discord bot using discord.js v14
- Pinterest API v5 integration
- OpenAI Chat Completions API
- File-based data persistence
- PM2 production deployment support</content>
</xai:function_call">The file has been written successfully to /Users/chubes/Developer/mjpin/docs/CHANGELOG.md