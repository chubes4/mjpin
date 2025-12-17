# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-17

### Added
- Automatic Pinterest token refresh with periodic background refresh system
- Support for GPT-5.x model variants (gpt-5.1, gpt-5.2, etc.) in model selection

### Changed
- Updated OpenAI model filtering to exclude GPT-4 series and include GPT-5.x variants
- Improved pin counting order of operations for better accuracy
- Updated model selection documentation to reflect GPT-5 focus
- Enhanced `/pin` command with optional board parameter support

### Fixed
- Pin counting order of operations bug that could cause incorrect rate limit tracking

### Breaking Changes
- GPT-4 models are no longer available in the `/model` command selection
- Guilds currently using GPT-4 models will need to reselect a model via `/model` command

### Technical
- Implemented background token refresh system for Pinterest OAuth tokens
- Updated regex pattern in `filterChatModels()` from `/^(gpt|o[34]|gpt-4|gpt-5)/i` to `/^(gpt|o[34]|gpt-5(?:\.\d+)?)/i`
- Aligned all documentation with current implementation state

## [1.1.0] - 2025-11-03

### Added
- Optional `board` parameter to `/pin` command for specifying custom board names
- Production build script (`build.sh`) with automated file exclusion and validation
- Build ignore file (`.buildignore`) for clean production deployments
- Pluralize library integration for improved keyword variant generation
- Enhanced error handling and user feedback across all commands
- Comprehensive documentation updates and alignment

### Changed
- Improved `/pin` command to support custom board names separate from search keywords
- Enhanced build system with automated production packaging
- Updated documentation to reflect current implementation state
- Refined prompt system with better file discovery and ordering
- Improved rate limiting display and user notifications

### Fixed
- Various bug fixes and stability improvements
- Enhanced error messages and user guidance
- Improved command validation and input handling

### Technical
- Added pluralize library for better keyword matching
- Enhanced build process with file validation and compression
- Improved documentation structure and accuracy
- Updated deployment workflow with build script integration

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