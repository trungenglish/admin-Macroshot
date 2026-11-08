# Test support

Keep global test setup and reusable test helpers in this directory.

Feature tests should be colocated with their owner, for example:

```text
src/features/auth/__tests__/
src/features/users/__tests__/
```

Do not use a second root-level `src/__tests__` directory.
