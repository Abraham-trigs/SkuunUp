🎓 School Management System

A full-stack academic operations platform built with Next.js, Prisma, PostgreSQL, Redis, and role-based access control.

This system manages admissions, students, staff, classes, exams, library workflows, authentication, and AI-assisted actions — all within a structured, dashboard-driven environment.

It is not just a website.
It is an operational control system for school administration.

🚀 Core Capabilities

Multi-step student admission workflow

Role-based authentication & authorization

Class & attendance management

Exams & grading workflows

Library inventory & borrowing lifecycle

Staff management

Student lifecycle tracking

Dashboard analytics & summaries

AI-assisted academic tooling (SkuunAI)

Redis-backed performance optimization

Queue-aware async actions

🏗 System Architecture

Built using the Next.js App Router with co-located API routes and Prisma ORM.

Tech Stack

Frontend: Next.js (App Router), TypeScript, Zustand

Backend (API Routes): Next.js Route Handlers

Database: PostgreSQL (Prisma ORM)

Caching / Performance: Redis

Authentication: Cookie-based auth + token refresh

Testing: Jest

State Management: Zustand stores

Validation: Custom validation schemas

📂 Project Structure Overview
/app

Application routes, pages, API endpoints, and dashboard UI.

Key Areas

admission/ → Multi-step admission workflow

dashboard/ → Protected administrative dashboards

api/ → RESTful route handlers

auth/ → Login and authentication pages

store/ → Zustand state containers

hooks/ → Reusable async + debounce hooks

types/ → Domain-specific types

utils/ → Decision helpers and data utilities

🧾 Admissions Module

Structured 8-step admission process:

Step0UserInfo → Step1PersonalInfo → Step2LanguagesReligion → Step3WardDetails → Step4ContactEmergency → Step5MedicalInfo → Step6PreviousFamily → Step7FeesDeclaration

Designed to:

Reduce incomplete submissions

Enforce progressive validation

Maintain state consistency

Improve data integrity

📊 Dashboard Modules

Classes (attendance tracking, charts, CRUD)

Students (admission, assignment, lifecycle)

Staff (profile management, attendance)

Exams (creation, deletion, performance tracking)

Library (inventory + borrowing workflows)

Summary & analytics endpoints

AI Chat integration (SkuunAI)

🔐 Authentication & Authorization

Implements:

Login / Logout / Refresh flows

Cookie-based session handling

Role inference logic

Protected routes via AuthGuard

Server + client user resolution

Role definitions and inference logic are located under:

lib/api/constants

🧠 AI Integration (SkuunAI)

Includes:

Action-triggered AI workflows

Automated educational assistance

AI state management via Zustand

Server-side AI action handlers

Located under:

/api/skuunAi
/dashboard/SkuunAi

⚡ Performance & Async Control

Implements:

Redis caching

Async action queue provider

Queue-aware loader buttons

Debounced user input

Centralized API client abstraction

Files of interest:

lib/redis.ts

context/AsyncActionQueueProvider.tsx

hooks/useAsyncAction.tsx

🛡 Data Integrity & Validation

Prisma relational schema enforcement

Controlled mutation endpoints

Admission-specific validation helpers

Structured error handling utilities

Located under:

/prisma/schema.prisma
/lib/helpers/errorHandler.ts
/lib/validation/

🧪 Testing

Testing framework: Jest

Test coverage includes:

Health check routes

Redis connectivity

API validation flows

Test files located in:

/app/_test/__tests__/

Run tests:

pnpm test

▶️ Running the Project
Install dependencies
pnpm install

Configure environment

Create a .env file:

DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...

Setup database
pnpm prisma migrate dev
pnpm prisma db seed

Run development server
pnpm dev

🎯 Design Goals

Maintain institutional data integrity

Enforce role-based operational boundaries

Reduce manual administrative overhead

Provide dashboard-first administrative workflows

Support scalable academic operations

🌍 Intended Use

This system is designed for:

Private and public schools

Academic institutions

Multi-role administrative environments

Structured student lifecycle management
