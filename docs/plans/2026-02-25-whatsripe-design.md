# WhatsRipe — Seasonal Meal Planning App Design

## Overview

A web app that generates weekly meal plans favoring seasonal ingredients, with automatic baby/toddler food adaptations for families with young children.

## Core User Flow

1. **Setup (one-time):** Configure household — add children with birthdates, set dietary preferences/allergies.
2. **Generate weekly plan:** App sends current season, household profile, and children's food stages to an LLM. It streams back a 7-day meal plan.
3. **Review & swap:** Weekly plan appears as a 7-day grid. Each meal shows the adult version and baby/toddler adaptations. User can swap any meal — the app generates 3 alternatives.
4. **Generate grocery list:** Compiles ingredients, deduplicates, groups by store section, presents an editable checklist.
5. **Shop & cook:** Check off items while shopping. Each meal has a recipe view with baby adaptation instructions.

Dinner is always planned. Breakfast and lunch are opt-in.

## Data Model

### Household Profile
- Dietary preferences (vegetarian, gluten-free, etc.)
- Allergies/exclusions
- Liked/disliked ingredients

### Children
- Name, birthdate
- Auto-calculated food stage: 6-12mo (purees/soft solids), 12-18mo (modified table food), 18-24mo (minor adjustments), 24mo+ (eats with family)
- Child-specific allergies

### Weekly Plan
- Week start date
- 7 daily plans, each with: dinner (always), breakfast (optional), lunch (optional)

### Meal
- Name, description, seasonal ingredients highlighted
- Full recipe (ingredients + instructions)
- Baby/toddler adaptations keyed by food stage
- Prep time, cook time

### Grocery List
- Generated from weekly plan
- Items grouped by store section (produce, dairy, meat, pantry, frozen)
- Each item: name, quantity, unit, checked-off status
- Manual additions supported

### Storage
SQLite via Prisma. Single-household app, no user accounts.

## Seasonal Ingredient System

- Static TypeScript data file mapping ingredients to US seasons
- 4 seasons: Spring (Mar-May), Summer (Jun-Aug), Fall (Sep-Nov), Winter (Dec-Feb)
- Categories: fruits, vegetables, herbs, proteins
- Ingredients can span multiple seasons
- LLM favors seasonal ingredients but pantry staples are always available

## AI Recipe Generation

Three prompt types, using Vercel AI SDK (provider-agnostic):

### 1. Weekly Plan Generation
- Input: season, seasonal ingredients, household profile, children's food stages, meal types to plan
- Output: structured JSON — 7 days of meals with names, descriptions, seasonal ingredients
- Uses structured output / JSON mode

### 2. Full Recipe Expansion (on-demand)
- Triggered when user views a meal
- Input: meal name + description, household profile, children's food stages
- Output: full recipe + baby/toddler adaptations per food stage
- Streamed to user

### 3. Meal Swap / Alternatives
- Triggered when user wants to replace a meal
- Input: same as weekly plan context + meals to avoid
- Output: 3 alternative meals

Two-step approach (plan first, expand on demand) minimizes API costs.

## UI Layout

Mobile-first, 4 views:

### 1. Weekly Planner (home)
- 7-day grid/list with meal cards
- Each card: meal name, seasonal ingredient tags, baby adaptation summary
- "Generate Week" button, breakfast/lunch toggles, season indicator

### 2. Meal Detail / Recipe
- Full adult recipe (ingredients, steps, times)
- Baby adaptation panel per child
- "Swap This Meal" button with 3 alternatives

### 3. Grocery List
- Grouped by store section, collapsible headers
- Checkboxes, manual "Add Item", "Clear Checked"

### 4. Settings
- Dietary preferences and allergies
- Children management (add/edit/remove)
- Meal planning preferences

Navigation: bottom tab bar (Plan, Groceries, Settings).

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **AI:** Vercel AI SDK (provider-agnostic)
- **Database:** SQLite via Prisma
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Seasonal Data:** Static TypeScript file
- **Deployment:** Vercel (free hobby tier)
