import React from 'react';

// PUBLIC_INTERFACE
export default function SettingsPage() {
  return (
    <section className="panel" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h3>Settings</h3>
      <p>Backend URL: <code>{process.env.REACT_APP_BACKEND_URL || 'Not configured'}</code></p>
      <p>Note: To enable backend submission, set REACT_APP_BACKEND_URL in your environment.</p>
      <p>Phaser/Unity integrations can be added as optional modes in future iterations.</p>
    </section>
  );
}
