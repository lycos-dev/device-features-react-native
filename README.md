# Job Finder App
A mobile job search application built with React Native and Expo.

## Features
- Browse and search job listings from a live API
- Save jobs for later review
- Apply for jobs via an application form
- Light and dark mode support

## Screens
- **Job Finder** — browse and search jobs, save or apply
- **Saved Jobs** — view and manage your saved jobs
- **Application Form** — fill out and submit a job application
- **Settings** — toggle light/dark mode

## Tech Stack
- React Native + Expo
- TypeScript
- React Navigation (Native Stack)
- React Context API (theme + saved jobs state)

## Project Structure
```
src/
├── components/       # Shared UI components (JobCard, BottomTabBar)
├── constants/        # Theme colors, country data
├── context/          # Global state (ThemeContext, SavedJobsContext)
├── hooks/            # Custom hooks (useJobs)
├── navigation/       # Stack navigator and route types
├── screens/          # App screens, each with its own folder
├── types/            # Shared TypeScript types
└── utils/            # Utility functions (phone formatting)
```

## API
Job listings are fetched from [Empllo](https://empllo.com/api/v1).