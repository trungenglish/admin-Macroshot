# Macroshot Admin and Docs

This repository contains the admin app and the documentation folder as siblings:

```text
admin-Macroshot/
├── admin/       # React + Vite admin app
├── docs-site/   # Documentation site
└── .git/        # Shared Git repository
```

Run the admin app from the repository root:

```sh
pnpm --dir admin install
pnpm --dir admin dev
```

The current `docs-site` folder was moved from `NutriPal_FE` as-is. It does not currently contain a `package.json` or site source files, so it cannot be started until those files are restored.

Commit and push both folders from this repository root:

```sh
git add admin docs-site
git commit -m "Organize admin and docs apps"
git push
```
