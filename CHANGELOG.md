# Change Log

All notable changes to the "otak-committer" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.1] - 2025-02-16

### Changed
- 📝 Updated README.md with improved documentation
- 🔄 Minor version bump for documentation updates

## [1.0.0] - 2025-02-16

### Added
- **Proxy Support**: Added support for VS Code's HTTP proxy settings
  - Automatically detects and uses system proxy configuration
  - Compatible with corporate proxy environments
  - Improved network connectivity in restricted environments

### Changed
- 🔄 Upgraded to version 1.0.0, marking the first stable release

## [0.0.2] - 2025-02-16

### Changed
- 🔄 Upgraded to version 0.0.2 with improved stability and performance

## [0.0.1] - 2025-02-16

### Added
- **Multilingual Commit Message Generation**: Support for 9 languages
  - 🇺🇸 English
  - 🇫🇷 French (Français)
  - 🇩🇪 German (Deutsch)
  - 🇮🇹 Italian (Italiano)
  - 🇯🇵 Japanese (日本語)
  - 🇨🇳 Chinese (中文)
  - 🇰🇷 Korean (한국어)
  - 🇻🇳 Vietnamese (Tiếng Việt)
  - 🇷🇺 Russian (Русский)

- **Flexible Message Styles**: Three levels of detail
  - Simple: Concise summary (100 tokens)
  - Normal: Standard length with context (200 tokens)
  - Detailed: Comprehensive explanation (500 tokens)

- **Git SCM Integration**
  - Dedicated button in VS Code's Git interface
  - Seamless integration with SCM view

### Requirements
- Visual Studio Code ^1.9.0
- Git installed and configured
- OpenAI API key (GPT-4o enabled)