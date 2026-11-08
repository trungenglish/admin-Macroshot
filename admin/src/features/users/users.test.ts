import { describe, expect, it } from 'vitest';

import { normalizeUserList } from './api/users-api';
import { parseUserSearchParams, writeUserSearchParams } from './user-query';

describe('users API contract', () => {
  it('normalizes the nested list response and onboarding meaning', () => {
    expect(
      normalizeUserList({
        success: true,
        data: {
          items: [
            {
              id: 7,
              full_name: 'Nguyen Minh Anh',
              username: 'minhanh',
              email: 'anh@example.com',
              gender: 'female',
              role: 'user',
              date_of_birth: '1992-06-12',
              avatar_url: null,
              height_cm: 162,
              weight_kg: 54,
              activity_level: 'lightly_active',
              desired_weight_kg: 50,
              goal_pace_kg_per_week: 0.3,
              created_at: '2026-10-03T16:21:53.231Z',
              updated_at: '2026-10-03T16:21:53.231Z',
              is_new_user: true,
            },
          ],
          meta: {
            total: 21,
            skip: 10,
            limit: 10,
            count: 1,
            total_pages: 3,
            current_page: 2,
            has_next: true,
            has_prev: true,
          },
        },
        message: 'OK',
        timestamp: '2026-10-03T16:21:53.231Z',
      }),
    ).toMatchObject({
      total: 21,
      page: 2,
      pageSize: 10,
      items: [
        {
          id: 7,
          fullName: 'Nguyen Minh Anh',
          isNewUser: true,
          username: 'minhanh',
        },
      ],
    });
  });

  it('keeps search and pagination synchronized with the URL', () => {
    const parsed = parseUserSearchParams(
      new URLSearchParams('page=3&pageSize=25&search=minh'),
    );
    expect(parsed).toEqual({ page: 3, pageSize: 25, search: 'minh' });
    expect(writeUserSearchParams(parsed).toString()).toBe(
      'page=3&pageSize=25&search=minh',
    );
  });
});
