# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2025-10-11

- **Message Copy Feature**: Added clipboard copy functionality for messages ([c389b32](https://github.com/tubone24/docker-cagent-playground/commit/c389b32))
- **Agent Import/Export**: Added import/export functionality for agent configuration files ([9c27139](https://github.com/tubone24/docker-cagent-playground/commit/9c27139))

### Changed - 2025-10-11

- **Code Internationalization**: Translated Japanese text to English in UI components ([9549d1a](https://github.com/tubone24/docker-cagent-playground/commit/9549d1a))

### Added - 2025-10-10

- **YAML Management**: Added YAML editor dialog to edit agent configuration files directly from the UI ([4b8df1e](https://github.com/tubone24/docker-cagent-playground/commit/4b8df1e), [78c6baa](https://github.com/tubone24/docker-cagent-playground/commit/78c6baa), [4955228](https://github.com/tubone24/docker-cagent-playground/commit/4955228), [d443ac8](https://github.com/tubone24/docker-cagent-playground/commit/d443ac8))
- **OAuth Authentication**: Added OAuth authentication flow for remote MCP server connections ([0af44dd](https://github.com/tubone24/docker-cagent-playground/commit/0af44dd))
- **Dark Mode**: Implemented theme toggle functionality with light/dark mode support ([4b5af0e](https://github.com/tubone24/docker-cagent-playground/commit/4b5af0e), [a18eb5a](https://github.com/tubone24/docker-cagent-playground/commit/a18eb5a))
- **Token Usage Display**: Added token usage (input/output) display in the header for each message ([da04a10](https://github.com/tubone24/docker-cagent-playground/commit/da04a10))
- **Tool Approval Enhancement**: Added approve all option to improve user control over tool execution ([8f6d25b](https://github.com/tubone24/docker-cagent-playground/commit/8f6d25b))

### Improved - 2025-10-10

- **Chat Area Layout**: Enhanced with scroll functionality for comfortable navigation in long conversations ([5444531](https://github.com/tubone24/docker-cagent-playground/commit/5444531))
- **Message Display**: Improved layout for better visibility ([02a3855](https://github.com/tubone24/docker-cagent-playground/commit/02a3855))
- **Session and Token Management**: Enhanced store management for more robust state handling ([87be930](https://github.com/tubone24/docker-cagent-playground/commit/87be930))

### Changed - 2025-10-10

- **Code Internationalization**: Translated comments and button labels to English ([959c812](https://github.com/tubone24/docker-cagent-playground/commit/959c812))

### Added - 2025-10-09

- **Session Deletion**: Added functionality to delete unnecessary sessions ([a4f1bc4](https://github.com/tubone24/docker-cagent-playground/commit/a4f1bc4))
- **Session Loading**: Automatically load session list when switching agents ([ea25def](https://github.com/tubone24/docker-cagent-playground/commit/ea25def))
- **Tool Arguments Display**: Visualize tool execution arguments for easier debugging ([715add0](https://github.com/tubone24/docker-cagent-playground/commit/715add0))
- **Composition State Management**: Properly manage IME input state during message composition ([cb2671f](https://github.com/tubone24/docker-cagent-playground/commit/cb2671f))

### Fixed - 2025-10-09

- **Loading State After Streaming**: Properly clear loading state when streaming completes ([18686df](https://github.com/tubone24/docker-cagent-playground/commit/18686df))
- **Session Management**: Ensure new session creation when switching agents ([921a5a9](https://github.com/tubone24/docker-cagent-playground/commit/921a5a9))
- **Gitignore**: Added and fixed .gitignore file to exclude unnecessary files from repository ([ff53ec2](https://github.com/tubone24/docker-cagent-playground/commit/ff53ec2), [eb7bdab](https://github.com/tubone24/docker-cagent-playground/commit/eb7bdab))

### Changed - 2025-10-09

- **UI Language**: Translated UI text from Japanese to English for internationalization ([a8fbd63](https://github.com/tubone24/docker-cagent-playground/commit/a8fbd63))
- **User Message Style**: Changed text color for improved visibility ([f3a3951](https://github.com/tubone24/docker-cagent-playground/commit/f3a3951))

### Documentation - 2025-10-09

- **Project Renaming**: Changed official name to Docker Cagent Playground ([fa2278d](https://github.com/tubone24/docker-cagent-playground/commit/fa2278d))
- **Installation Instructions**: Added Cagent installation instructions for macOS and Linux ([f64dc51](https://github.com/tubone24/docker-cagent-playground/commit/f64dc51))
- **README Enhancement**: Added overview and feature descriptions for Cagent Playground ([cad788d](https://github.com/tubone24/docker-cagent-playground/commit/cad788d))

### Added - 2025-10-08

- **Renovate Configuration**: Added renovate.json for automatic dependency updates ([fb45c6b](https://github.com/tubone24/docker-cagent-playground/commit/fb45c6b))
- **Special Display for create_todos Results**: Visually highlight specific tool results ([f0b0ea5](https://github.com/tubone24/docker-cagent-playground/commit/f0b0ea5))
- **Project Initialization**: Added new files and configurations to initialize the project ([e3f8b1c](https://github.com/tubone24/docker-cagent-playground/commit/e3f8b1c))

### Added - 2025-10-03

- **Experimental Features**: Conducted tests and experiments for new functionality ([f8e39bc](https://github.com/tubone24/docker-cagent-playground/commit/f8e39bc))

### Added - 2025-09-30

- **DMR Configuration**: Created dmr.yaml and configured AI assistant for Docker Model Runner ([c7ceb9f](https://github.com/tubone24/docker-cagent-playground/commit/c7ceb9f))

### Added - 2025-09-27

- **Web Search Functionality**: Added capability for agents to perform web searches ([acaf692](https://github.com/tubone24/docker-cagent-playground/commit/acaf692))

### Documentation - 2025-09-27

- **README Update**: Updated project description ([95e1a6a](https://github.com/tubone24/docker-cagent-playground/commit/95e1a6a))

### Added - 2025-09-26

- **Initial Commit**: Initial project setup and base code ([915232d](https://github.com/tubone24/docker-cagent-playground/commit/915232d), [1385c57](https://github.com/tubone24/docker-cagent-playground/commit/1385c57))

---

## Key Features

This project is a web-based chat UI for interacting with Docker Cagent agents. It provides the following features:

- 🤖 **Agent Management**: Display and switch between multiple agents
- 💬 **Real-time Streaming**: Display agent responses in real-time
- 🧠 **Reasoning Visualization**: Separate display of agent reasoning process and final choices
- 📝 **Markdown Support**: Messages are rendered in Markdown format (GFM supported)
- 🔧 **Tool Execution Visualization**: Dedicated UI for tool calls and their results
- 📊 **Token Usage Display**: Shows input/output token counts and session titles in the header
- ⏸️ **Streaming Control**: Ability to stop ongoing responses
- ✏️ **YAML Editor**: Edit agent configuration files directly from the UI
- 🔐 **Tool Approval**: Control tool execution and remote MCP server access
- 🌓 **Dark Mode**: Toggle between light/dark themes
- 🗑️ **Session Management**: Create, load, and delete sessions

## Roadmap

- [ ] Add version tags and release management

---

[Unreleased]: https://github.com/tubone24/docker-cagent-playground/compare/915232d...HEAD
