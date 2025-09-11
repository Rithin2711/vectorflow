import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css';

// PUBLIC_INTERFACE
export default function Home() {
  /** Home page with a brief introduction and CTA to Play. */
  return (
    <div className="panel home">
      <h1>Welcome to FlowQuest</h1>
      <p>
        Explore vector fields and differential equations through an interactive game.
        Define motion using ODEs, visualize trajectories, and complete challenges while learning.
      </p>
      <div className="row">
        <Link to="/play" className="button">Start Playing</Link>
        <Link to="/help" className="button secondary">How it works</Link>
      </div>
      <div className="features">
        <div className="feature">
          <h3>Equation-driven gameplay</h3>
          <p>Enter your vector field and see particles move accordingly in real-time.</p>
        </div>
        <div className="feature">
          <h3>Challenges</h3>
          <p>Reach targets while avoiding obstacles. Learn from successes and mistakes.</p>
        </div>
        <div className="feature">
          <h3>Leaderboard</h3>
          <p>Compete locally or integrate with backend later for global rankings.</p>
        </div>
      </div>
    </div>
  );
}
