import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

describe('shared test cleanup', () => {
  it('mounts a real React tree', () => {
    render(createElement('div', null, 'Mounted by the previous test'));

    expect(
      screen.getByText('Mounted by the previous test'),
    ).toBeInTheDocument();
  });

  it('removes the previous test tree before the next test', () => {
    expect(screen.queryByText('Mounted by the previous test')).toBeNull();
  });
});
