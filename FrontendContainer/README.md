# FlowQuest Frontend

FlowQuest is an interactive educational game to explore vector calculus and fluid dynamics concepts, built with React and Phaser.js.

Features:
- Equation input and parsing (mathjs-based) for vector fields and ODEs
- Real-time simulation/animation of particles in dynamic vector fields
- Trajectory rendering, collision detection with obstacles
- Challenge mode with goals and traps
- Local leaderboard using localStorage
- API service layer with hooks (stubs) for backend integration
- Modular architecture using React + Zustand state management

Getting Started
1. Copy .env.example to .env and set values:
   - REACT_APP_API_BASE_URL
   - REACT_APP_SITE_URL
   - REACT_APP_APP_NAME
2. Install dependencies:
   - npm install
3. Run development server:
   - npm start
4. Build for production:
   - npm run build

Project Structure
- src/
  - index.js: App entry point
  - App.jsx: Routes and layout
  - routes/: Page components (Home, Play, Leaderboard, Help)
  - components/: UI building blocks (EquationInput, Controls, LeaderboardView)
  - game/: Phaser scene, physics/simulation utilities, vector field, collision detection
  - store/: Zustand store for global state
  - services/: API client and hooks (stubs)
  - utils/: Parsing, math, local storage helpers
  - styles/: CSS files

Notes
- This frontend is backend-ready but works fully offline with local storage.
- For backend integration, update REACT_APP_API_BASE_URL and implement API endpoints in services/apiClient.js and services/hooks.js.
- WebSockets or real-time features can be added via an additional service module.

License
MIT
