# Dependency Update Guide

This guide helps you keep your dependencies up-to-date and secure.

## Quick Commands

### Check for Vulnerabilities
```bash
npm run check-vulnerabilities
```
Or directly:
```bash
npm audit
```

### Update React Only
```bash
npm run update-react
```
Or:
```bash
npm install react@latest react-dom@latest
```

### Update All Dependencies
```bash
npm run update-dependencies
```

### Fix Vulnerabilities Automatically
```bash
npm run audit-fix
```

## Detailed Steps

### 1. Check Current Security Status

First, check for vulnerabilities:
```bash
npm run check-vulnerabilities
```

This will:
- Run `npm audit` to find security issues
- Show current React versions
- Display latest available React versions
- List top 10 vulnerabilities with details

### 2. Update React (Recommended First)

React is often the main concern. Update it first:
```bash
npm run update-react
```

This installs the latest stable versions of React and React-DOM.

### 3. Update All Dependencies

To update all dependencies to their latest compatible versions:
```bash
npm run update-dependencies
```

This script will:
- Check for outdated packages
- Update React to the latest version
- Install all updates
- Run a security audit after updates

### 4. Fix Vulnerabilities

After updating, check if vulnerabilities are fixed:
```bash
npm audit
```

To automatically fix issues that can be resolved:
```bash
npm audit fix
```

For more aggressive fixes (may break compatibility):
```bash
npm audit fix --force
```

**⚠️ Warning**: `--force` may update packages in ways that break your app. Test thoroughly!

### 5. Test Your Application

After any dependency updates:
1. **Run the dev server**: `npm run dev`
2. **Test all features**: Make sure everything works
3. **Build for production**: `npm run build`
4. **Check for errors**: Look for console errors or warnings

## Using npm-check-updates (Alternative)

For more control over updates, you can use `npm-check-updates`:

1. **Install globally**:
   ```bash
   npm install -g npm-check-updates
   ```

2. **Check what would be updated**:
   ```bash
   ncu
   ```

3. **Update package.json**:
   ```bash
   ncu -u
   ```

4. **Install updates**:
   ```bash
   npm install
   ```

## Current Configuration

- **Node.js**: 24.x (specified in `engines` field)
- **React**: ^19.1.0 (check with `npm list react`)
- **React-DOM**: ^19.1.0 (check with `npm list react-dom`)

## Troubleshooting

### PowerShell Execution Policy Error

If you get PowerShell execution policy errors on Windows:
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy RemoteSigned`
3. Or use Git Bash or Command Prompt instead

### Version Conflicts

If you get dependency conflicts:
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### React Version Mismatch

If React and React-DOM versions don't match:
```bash
npm install react@latest react-dom@latest --save-exact
```

## Best Practices

1. **Update regularly**: Check for updates at least monthly
2. **Test thoroughly**: Always test after updating
3. **Read changelogs**: Check breaking changes before major updates
4. **Use semantic versioning**: `^` allows minor updates, `~` allows patch updates
5. **Keep lock file in git**: Commit `package-lock.json` to ensure consistent installs

## Automated Updates

Consider using Dependabot or Renovate for automated dependency updates:
- **Dependabot**: Built into GitHub
- **Renovate**: More configurable, available as a GitHub App

## Resources

- [npm audit documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [React releases](https://github.com/facebook/react/releases)
- [npm-check-updates](https://www.npmjs.com/package/npm-check-updates)

