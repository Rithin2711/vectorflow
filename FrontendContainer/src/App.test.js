import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders nav brand', () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  const brand = screen.getByText(/FlowQuest/i);
  expect(brand).toBeInTheDocument();
});
