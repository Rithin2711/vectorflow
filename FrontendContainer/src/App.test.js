import { render, screen } from '@testing-library/react';
import App from './App';

test('renders FlowQuest brand', () => {
  render(<App />);
  const brand = screen.getByText(/FlowQuest/i);
  expect(brand).toBeInTheDocument();
});
