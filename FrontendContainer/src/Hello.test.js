import React from 'react';
import { render, screen } from '@testing-library/react';
function Hello(){ return <div>hi</div> }
test('renders hello', ()=>{ render(<Hello/>); expect(screen.getByText('hi')).toBeInTheDocument(); });
