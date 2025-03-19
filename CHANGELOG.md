# Change Log

All notable changes to the "DOM2Code" extension will be documented in this file.

## [0.3.0] - 2024-03-19

### Added
- Timestamps for command responses and tracking
- Enhanced notification system with icons and better styling
- More detailed connection status in popup title
- Success/error messages for connection/disconnection events
- Improved state synchronization across tabs

### Changed
- Enhanced WebSocket communication with better error handling
- Improved notification UI with animations and icons
- More robust connection state management
- Better cleanup of UI elements and event listeners
- Enhanced button states and visual feedback

### Fixed
- Selection mode not being disabled on disconnection
- Inconsistent connection state across tabs
- Missing error feedback for failed commands
- Notification cleanup issues
- Connection state persistence issues

### Improved
- Command response handling and validation
- Error messages and user feedback
- UI consistency and styling
- State management and synchronization
- Connection reliability and error recovery

## [0.2.0] - 2024-03-19

### Added
- Enter key support for submitting commands
- Improved focus management for chat panel
- Better state management for extension UI
- Enhanced error handling and user feedback
- Settings persistence for extension preferences

### Changed
- Improved HTML content injection process
- Enhanced focus sequence for chat panel
- Better context menu positioning and behavior
- More robust command execution with retries
- Improved logging system for debugging

### Fixed
- Duplicate submissions after pressing submit
- Incorrect editor focus when injecting content
- Missing Enter key functionality
- Focus management issues in chat panel
- Event listener cleanup on extension unload

### Improved
- Code organization and error handling
- User feedback and notifications
- Extension state management
- Debug logging and error reporting
- Performance and reliability

## [0.1.0] - 2023-03-14

- Initial release
- Static HTML selection functionality
- Localhost URL integration with iframe
- HTML formatting options (pretty, minified, raw)
- Configuration settings for localhost URL, formatting, and highlight color 