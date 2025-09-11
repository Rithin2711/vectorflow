# FlowQuest Frontend

An interactive educational game to explore vector fields and ODEs in real time.

Features
- Equation input and parsing (dx/dt = f(x,y), dy/dt = g(x,y))
- Real-time simulation with RK4 integration
- Interactive canvas rendering of vector field, trajectory, target, obstacles
- Challenge mode presets
- Collision detection and basic bounds bounce
- Local leaderboard and player profile
- Local storage persistence
- Event logging (console) and API stubs for backend

Project Structure
- src/components: UI components (EquationInput, VectorFieldCanvas, SimulationControls, MetricsPanel, ProfilePanel, Leaderboard, ChallengeMode)
- src/hooks: useLocalStorage, useSimulation
- src/services: api (stubs), logging
- src/utils: equationParser (mathjs-based), math helpers, challenges presets, profile utils

Environment
- REACT_APP_API_URL: optional base URL for backend; if not set, API functions gracefully no-op.

Run
- npm start

Build
- npm run build

Notes
- The vector field arrows are normalized for visual clarity.
- Scoring increases while moving, penalizes collisions, and rewards reaching the target (via VectorFieldCanvas onReachTarget callback).
- Replace API stubs in src/services/api.js with actual endpoints when backend is ready.
- CI/headless: MetricsPanel lazily imports Plotly and guards DOM access to avoid build/test hangs.
