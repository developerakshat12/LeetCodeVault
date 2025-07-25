# LeetCode Tracker Application

## Overview

This is a full-stack web application for tracking LeetCode problem-solving progress by organizing problems into topics. The application allows users to sync their LeetCode submissions, categorize problems by different algorithmic topics, and visualize their progress across different areas of study.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database. It uses a monorepo structure with shared types and schemas between the client and server.

### Directory Structure
- `client/` - React frontend application built with Vite
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript types and database schemas
- `migrations/` - Database migration files

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for development and production
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens and dark/light theme support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation resolvers

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with proper HTTP status codes and error handling
- **Database ORM**: Drizzle ORM for type-safe database interactions
- **Validation**: Zod schemas for request/response validation
- **Storage**: Configurable storage interface with in-memory implementation for development

### Database Schema
The application uses PostgreSQL with three main entities:
- **Users**: Store LeetCode usernames and solving statistics
- **Topics**: Categorize problems (both default and user-custom topics)
- **Problems**: Store LeetCode problem details, submission data, and topic associations

Key relationships:
- Users can have custom topics and problems
- Problems belong to topics and users
- Topics can be shared (default) or user-specific (custom)

## Data Flow

1. **User Registration/Login**: Users provide their LeetCode username
2. **Data Synchronization**: Backend fetches user's LeetCode submissions via external API
3. **Problem Categorization**: Problems are automatically or manually assigned to topics
4. **Progress Tracking**: Frontend displays statistics and progress visualization
5. **Topic Management**: Users can create custom topics and organize problems

### External API Integration
- Uses alfa-leetcode-api.onrender.com for fetching LeetCode user profiles and submissions
- Handles rate limiting and error scenarios gracefully
- Caches user data to minimize external API calls

## External Dependencies

### Frontend Dependencies
- **UI Components**: Comprehensive Radix UI primitive library
- **Styling**: Tailwind CSS with PostCSS for processing
- **Date Handling**: date-fns for date manipulation
- **Icons**: Lucide React for consistent iconography
- **Carousel**: Embla Carousel for content sliders

### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Validation**: Zod for runtime type checking

### Development Dependencies
- **TypeScript**: Full type safety across the stack
- **ESBuild**: Fast bundling for production builds
- **TSX**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- Frontend served by Vite dev server with HMR
- Backend runs with tsx for TypeScript execution
- Database migrations managed through Drizzle Kit
- Replit-specific configurations for cloud development

### Production Build
- Frontend: Static assets built with Vite and served from Express
- Backend: Bundled with ESBuild for Node.js execution
- Database: PostgreSQL with connection pooling via Neon
- Environment variables for database connection and API keys

### Key Configuration Files
- `vite.config.ts`: Frontend build and development configuration
- `drizzle.config.ts`: Database schema and migration settings
- `tsconfig.json`: Shared TypeScript configuration
- `tailwind.config.ts`: Design system and theming configuration

The application is designed to be easily deployable on cloud platforms with support for environment-based configuration and automatic database migrations.