# AkiraDocs: VSCode Block-Based Document Editor

## Project Overview

A sophisticated block-based document editor transitioning from a web-based Next.js implementation to a VSCode extension, preserving core functionality while adapting to VSCode's extension architecture.

## Original Web-Based Editor Characteristics

- Built with Next.js, React, TypeScript
- Shadcn/UI for styling
- DND-kit for block reordering
- Rich text editing capabilities
- Block-based document structure

## Migration Architecture

### Core Components

- Block System
- Custom State Management
- Dynamic Block Types (text, heading, list)
- Rich Editing Capabilities

## VSCode Extension Implementation

### File Structure

src/ directory with:

- sidebar/: Folder view management
- utils/: Parsing and conversion utilities
- webview/: Editor panel and HTML template
- EditorProvider.ts: VSCode custom editor provider
- extension.ts: Extension activation logic

### Key Challenges:

- Component architecture translation
- State management adaptation
- Webview integration
- Message passing between extension and webview
- Document parsing and synchronization

### Migration Strategies:

- JSON-based document structure
- Custom message handling
- Robust error management
- Consistent block manipulation
- Edit/Preview mode implementation

### Technical Implementations:

- Developed JsonParser for document parsing
- Created dynamic webview with edit/preview toggles
- Implemented block-level operations (add, delete, move)
- Ensured cross-platform document compatibility

### Next Phase: React Component Migration

### Target: Port Shadcn/UI React components into VSCode webview context, maintaining original design and - interactivity principles.
