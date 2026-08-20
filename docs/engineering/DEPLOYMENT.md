# Deployment

## Windows development

```powershell
Copy-Item .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev
```

For a production rehearsal:

```powershell
npm run typecheck
npm run build
npm run start
```

The production start script uses `cross-env` and Node.js rather than Unix-only environment assignment or Bun.

