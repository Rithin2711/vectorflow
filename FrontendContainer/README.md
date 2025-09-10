# VectorFlow FrontendContainer

Interactive vector field game and learning tool built with React, Canvas, and D3.

Features:
- Equation input with validation: define f(x,y,t) and g(x,y,t) for dx/dt, dy/dt
- Real-time simulation with Euler or RK4 integrators
- D3-based vector field quiver overlay
- Trajectory rendering and live metric plotting (speed) via lightweight canvas
- Challenge mode with obstacles, bounds, target and time goals
- Collision detection and win handling
- Local leaderboard and player profile (localStorage)
- Cross-platform layout (desktop browsers and tablets)

Getting started:
1. Install dependencies:
   npm install

2. Run dev server:
   npm run start

3. Build:
   npm run build

4. Tests (Hello test):
   npm run test

Notes:
- No backend integration is required. All data persists locally via localStorage.
- If later integrating a backend, add API client files under src/api and wire into Leaderboard/Profiles as needed.
- Environment variables: none required for current build. If you add any, document them here and provide a .env.example.

Keyboard:
- Space: Pause/Resume
- Click on the simulation area in Free Mode to set a new start position.

Public interfaces are marked with PUBLIC_INTERFACE comments and docstrings in code where applicable.
