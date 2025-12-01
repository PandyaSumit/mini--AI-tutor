# Troubleshooting Guide

## Common Issues and Solutions

### Error: Cannot find module 'caniuse-lite/dist/unpacker/agents'

This is a common issue on Windows systems with Next.js projects. The `caniuse-lite` module is used by browserslist to determine browser compatibility.

#### Quick Fix (Recommended)

Run this command in the `nextjs-app` directory:

```bash
npm run fix:caniuse
```

This will update the browserslist database and fix the caniuse-lite module.

#### Alternative Solutions

If the quick fix doesn't work, try these solutions in order:

**Solution 1: Update browserslist database manually**
```bash
npx update-browserslist-db@latest
```

**Solution 2: Delete and reinstall node_modules**
```bash
# Delete node_modules and lock file
rmdir /s /q node_modules
del package-lock.json

# Reinstall dependencies
npm install
```

**Solution 3: Clear npm cache and reinstall**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rmdir /s /q node_modules
del package-lock.json

# Reinstall dependencies
npm install
```

**Solution 4: Use --legacy-peer-deps flag**
```bash
npm install --legacy-peer-deps
```

#### Automatic Prevention

The project now includes a `postinstall` script that automatically updates the browserslist database after every `npm install`. This should prevent this issue from occurring in the future.

#### Why This Happens

This issue typically occurs because:
- Corrupted or outdated browserslist database
- Issues with how npm installs packages on Windows
- Cached node_modules with incompatible versions
- Network interruptions during package installation

#### Still Having Issues?

If none of these solutions work, try:
1. Ensure you're using Node.js version 18 or higher
2. Check that you have write permissions in the project directory
3. Disable antivirus temporarily during installation (some antivirus software interferes with npm)
4. Try using yarn instead of npm: `yarn install`

---

## Other Common Issues

### Port 3000 Already in Use

If you see an error about port 3000 being in use:

```bash
# On Windows, find and kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <process-id> /F
```

### Build Errors

If you encounter build errors:
```bash
# Clean build cache
npm run build -- --no-cache

# Or delete .next directory
rmdir /s /q .next
npm run build
```

### TypeScript Errors

If you see TypeScript errors:
```bash
# Run type checking
npm run type-check

# This will show all TypeScript errors without building
```
