Development Notes
- This project is structured similar to Create React App with react-scripts.
- Ensure Node 18+ to match React 18.
- For backend integration, update REACT_APP_API_BASE_URL in the .env file (not committed).
- The game uses a 2D vector field: dx/dt = Fx(x,y,t), dy/dt = Fy(x,y,t).
- The player can click on the canvas to set a new starting position.
- Challenge mode adds a goal and random obstacles; reaching goals increases score and saves to local leaderboard.
- Additional visualizations (e.g., Plotly graphs of velocity magnitude along trajectory) can be implemented in a future iteration using the included plotly.js dependency.
