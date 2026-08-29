import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Avatar } from '@/components/common/Avatar';

describe('Avatar component unit tests', () => {
  it('should render avatar initials fallback when no image URL provided', () => {
    render(<Avatar name="John Doe" size="md" status="online" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('should render image element when src prop is provided', () => {
    render(<Avatar name="Jane Smith" src="https://example.com/avatar.jpg" size="lg" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Jane Smith');
  });
});
