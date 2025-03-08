# BeeBuildR - Construction Budgeting App

A web application for construction budgeting, connecting contractors and stores.

## Features

- **User Authentication**: Login via Auth.js (formerly NextAuth) with email and social providers
- **Organizations**: Two types - "Contractor" (create budgets) and "Store" (sell items)
- **Role-Based Access Control**: Per-organization permissions (admin/member/viewer)
- **Budgets**: Created by contractor organizations
- **Items**: Managed by store organizations
- **Price Snapshots**: Historical item prices are stored when added to budgets

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19
- **Backend**: Next.js API Routes
- **Database**: Vercel Postgres, Prisma ORM
- **Authentication**: Auth.js (NextAuth)
- **UI**: Shadcn/UI + Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Vercel Postgres database or any PostgreSQL database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/beebuildr.git
   cd beebuildr
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL connection string
   - Add your OAuth provider credentials

4. Initialize the database:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable UI components
- `/contexts` - React context providers
- `/lib` - Utility functions and shared code
- `/prisma` - Prisma schema and migrations
- `/public` - Static assets
- `/types` - TypeScript type definitions

## License

This project is licensed under the MIT License - see the LICENSE file for details.
