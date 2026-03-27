# DEVI JEWELLERS - Gold Rate Management System

## Overview

A comprehensive jewelry store management system designed for DEVI JEWELLERS featuring real-time gold and silver rate displays, mobile controls, and promotional media management. The application provides a professional TV display interface for customers with live rate updates, promotional slideshows, and media rotation capabilities, while offering mobile-optimized control panels for staff to manage rates and content remotely.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React 18 with TypeScript for type safety and component-based architecture
- **Wouter**: Lightweight client-side routing solution instead of React Router
- **Vite**: Fast build tool and development server with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework with custom jewelry-themed color palette
- **Shadcn/ui**: Pre-built accessible UI components using Radix UI primitives
- **Framer Motion**: Animation library for smooth transitions and promotional slideshow effects
- **TanStack Query**: Server state management for API caching and synchronization

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript support
- **SQLite + Drizzle ORM**: Local database with type-safe schema definitions
- **Multer**: File upload handling for media and promotional content
- **Session-based State**: In-memory session management for real-time updates

### Data Storage Solutions
- **SQLite Database**: Local file-based database storing:
  - Gold/silver rates with historical tracking
  - Display configuration settings
  - Media items (videos/images) with metadata
  - Promotional images with transition effects
  - Banner settings and positioning
- **File System Storage**: Uploaded media files organized in structured directories
- **Real-time Synchronization**: 30-second polling intervals for cross-device updates

### Display Management System
- **Multi-device Support**: Separate interfaces for TV display, mobile control, and admin dashboard
- **Responsive Design**: Orientation-aware layouts (horizontal/vertical) with dynamic font sizing
- **Content Rotation**: Automated switching between rate displays and promotional content
- **Live Updates**: Real-time clock and automatic data refresh across all connected devices

### Media Management
- **Dual Media Systems**:
  - Primary media rotation (videos/images between rate displays)
  - Promotional slideshow (images below silver rates with custom transitions)
- **Upload Pipeline**: Drag-and-drop interface with file validation and automatic optimization
- **Content Control**: Individual activation/deactivation, duration settings, and display ordering
- **Preview Capabilities**: Real-time preview of slideshows and media content

### Configuration Management
- **Theme Customization**: Dynamic color schemes with jewelry-specific presets
- **Display Settings**: Configurable orientation, timing, font sizes, and refresh intervals
- **Banner System**: Optional header/footer banners with custom positioning and sizing
- **Persistence Layer**: All settings automatically saved and restored on application restart

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm + @neondatabase/serverless**: Database ORM with PostgreSQL driver support
- **express + multer**: Backend API server and file upload handling
- **wouter**: Lightweight React routing
- **framer-motion**: Animation and transition effects

### UI Component Libraries
- **@radix-ui/react-***: Accessible primitive components (dialogs, dropdowns, forms, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority + clsx**: Conditional CSS class management
- **lucide-react**: Icon library for modern UI elements

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety and developer experience
- **@hookform/resolvers + zod**: Form validation and schema management
- **date-fns**: Date formatting and manipulation

### Media and File Handling
- **react-dropzone**: Drag-and-drop file upload interface
- **embla-carousel-react**: Carousel components for media galleries

### Styling and Theming
- **@radix-ui/colors**: Accessible color system
- **tailwind-merge**: Utility for merging Tailwind classes
- **autoprefixer + postcss**: CSS processing and browser compatibility

### Database and Schema
- **drizzle-kit**: Database migration and schema management tools
- **better-sqlite3**: SQLite database driver for local development
- **connect-pg-simple**: PostgreSQL session store for production deployments