# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-10

### Changed
- Major architectural reorganization: consolidated services into domain-specific modules (`state`, `metadata`, `content`, `polling`).
- Root directory cleanup: moved all documentation and planning files to the `docs/` folder.
- Updated all import paths to reflect the new service structure.
- Refactored `metadataService` for better maintainability.

## [0.0.1] - 2026-03-27

### Added
- Action menus can now be opened by hovering over them ([6c04ba0](https://github.com/guitarbeat/electron/commit/6c04ba0))
- Circular navigation features ([15eb7cd](https://github.com/guitarbeat/electron/commit/15eb7cd))
- Daily palette and watchlist empty state improvements ([a39f2e4](https://github.com/guitarbeat/electron/commit/a39f2e4))
- Debug logging for user session and authentication actions ([da130ac](https://github.com/guitarbeat/electron/commit/da130ac))

### Fixed
- Issues with movie search autocomplete dropdown behavior ([61bcd83](https://github.com/guitarbeat/electron/commit/61bcd83))
