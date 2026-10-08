import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/shared/api/api-client', () => ({
  API_BASE_URL: 'https://api.example.com',
  apiClient: { post },
}));

import { authenticateAdmin } from '@/features/auth/api/admin-auth-api';

describe('authenticateAdmin', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('posts admin credentials to the auth admin login endpoint', async () => {
    post.mockResolvedValue({
      data: {
        message: 'Admin login successful',
        data: {
          access_token: 'access-token',
          user: {
            id: 1,
            full_name: 'Admin User',
            email: 'admin@example.com',
          },
        },
      },
    });

    await authenticateAdmin({ username: 'admin', password: 'secret' });

    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/admin/login', {
      username: 'admin',
      password: 'secret',
    });
  });
});
