# Overview

This is a comprehensive Discord bot for CLA Designs community featuring multiple systems:
- **Careers Application System**: Interactive ER:LC career applications with private DM questionnaires
- **Rule Display & Point Management**: Interactive rules command with user infraction tracking and auto-moderation
- **Embedded Ordering System**: Dynamic ordering system with status control for design services
- **Admin Tools**: Point management, order status control, and comprehensive moderation capabilities

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Bot Framework
- **Discord.js v14**: Modern Discord API wrapper with slash command support
- **Event-driven architecture**: Handles user interactions through Discord gateway events
- **Command system**: Modular command structure with automatic loading and registration
- **Multi-system integration**: Careers, rules/points, and ordering systems in unified bot

## Core Systems

### 1. Careers Application System
- **Slash command initiation**: Users start with `/careers` command
- **Interactive components**: Button clicks and select menus for position selection
- **State management**: In-memory storage for tracking active applications with automatic timeouts
- **Dynamic questionnaires**: Position-specific questions loaded from JSON configuration
- **Data persistence**: Applications saved to JSON files for HR review

### 2. Rule Display & Point Management
- **Interactive rules display**: `/rules` command with embedded buttons
- **Point tracking system**: JSON-based infraction point storage
- **Auto-moderation**: Automatic ban at 16 points threshold
- **Admin commands**: `/addpoints`, `/removepoints`, `/checkpoints` for staff management
- **History tracking**: Complete audit trail of all point changes

### 3. Embedded Ordering System
- **Dynamic status control**: `/setorderstatus` for availability management
- **Order type selection**: Liveries, Avatars, ELS, and custom work
- **Private channel creation**: Automatic order-specific channels with proper permissions
- **Terms & Conditions**: Required acceptance before work begins
- **Designer notifications**: Automatic alerts to design team

## Data Storage
- **JSON-based configuration**: Settings, questions, and all system data in JSON files
- **File system storage**: Applications (`data/applications.json`), points (`data/points.json`), orders (`data/orders.json`)
- **In-memory state**: Active application sessions managed in memory with automatic cleanup
- **Audit trails**: Complete history for points and order management

## Component Architecture
- **Handler pattern**: Separate handlers for interactions and applications
- **Utility modules**: Reusable embed builders, state management, points manager, order manager
- **Configuration-driven**: All system definitions externalized to JSON
- **Permission-based access**: Role validation for admin functions

## Security & Validation
- **Role-based access**: HR team, management, designer, and moderator role configurations
- **Permission checks**: Discord permission validation for sensitive commands
- **Input validation**: Error handling for malformed data and failed operations
- **Timeout management**: Automatic cleanup of abandoned applications and sessions
- **Auto-moderation**: Configurable point thresholds and automatic enforcement

# External Dependencies

## Core Dependencies
- **discord.js**: Discord API client library for bot functionality
- **Node.js fs module**: File system operations for configuration and data persistence

## Discord Integration
- **Gateway intents**: Guilds, messages, and direct message permissions
- **Slash commands**: Global application command registration
- **Interactive components**: Buttons, select menus, and embed messages
- **Channel notifications**: HR team alerts and application logging

## Configuration Requirements
- **Discord bot token**: Required for authentication with Discord API
- **Channel IDs**: HR notifications and application logging channels
- **Role IDs**: HR team and management role permissions
- **Asset URLs**: Logo and icon placeholders for embeds