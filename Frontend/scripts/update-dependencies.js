#!/usr/bin/env node

/**
 * Script to update all dependencies to their latest versions
 * Run with: node scripts/update-dependencies.js
 * 
 * This script will:
 * 1. Check for outdated packages
 * 2. Update package.json
 * 3. Install new versions
 * 4. Run audit to check for vulnerabilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendDir = join(__dirname, '..');
const packageJsonPath = join(frontendDir, 'package.json');

console.log('🔄 Updating dependencies...\n');
console.log('Working directory:', frontendDir);
console.log('─'.repeat(50));

async function updateDependencies() {
  try {
    // Read current package.json
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    console.log('\n📦 Current React versions:');
    console.log(`  react: ${packageJson.dependencies?.react || 'not found'}`);
    console.log(`  react-dom: ${packageJson.dependencies?.['react-dom'] || 'not found'}`);
    
    console.log('\n🔍 Checking for outdated packages...\n');
    
    try {
      const { stdout: outdated } = await execAsync('npm outdated --json', {
        cwd: frontendDir
      });
      
      const outdatedPkgs = JSON.parse(outdated);
      
      if (Object.keys(outdatedPkgs).length > 0) {
        console.log('📋 Outdated packages found:\n');
        
        for (const [pkg, info] of Object.entries(outdatedPkgs)) {
          console.log(`  ${pkg}:`);
          console.log(`    Current: ${info.current}`);
          console.log(`    Wanted: ${info.wanted}`);
          console.log(`    Latest: ${info.latest}`);
          console.log('');
        }
        
        console.log('💡 To update all dependencies, run:');
        console.log('   npm update');
        console.log('\n   Or install latest versions:');
        console.log('   npm install react@latest react-dom@latest');
        
      } else {
        console.log('✅ All packages are up to date!');
      }
    } catch (error) {
      if (error.code === 1) {
        // npm outdated exits with code 1 when packages are outdated
        const outdatedPkgs = JSON.parse(error.stdout);
        console.log('📋 Outdated packages found:\n');
        
        for (const [pkg, info] of Object.entries(outdatedPkgs)) {
          console.log(`  ${pkg}:`);
          console.log(`    Current: ${info.current}`);
          console.log(`    Wanted: ${info.wanted}`);
          console.log(`    Latest: ${info.latest}`);
          console.log('');
        }
      } else {
        throw error;
      }
    }
    
    // Specifically check React
    console.log('\n─'.repeat(50));
    console.log('\n⚛️  Checking React specifically...\n');
    
    try {
      const { stdout: reactLatest } = await execAsync('npm view react version', {
        cwd: frontendDir
      });
      const { stdout: reactDomLatest } = await execAsync('npm view react-dom version', {
        cwd: frontendDir
      });
      
      const latestReact = reactLatest.trim();
      const latestReactDom = reactDomLatest.trim();
      const currentReact = packageJson.dependencies?.react?.replace('^', '') || '';
      const currentReactDom = packageJson.dependencies?.['react-dom']?.replace('^', '') || '';
      
      console.log(`Latest React version: ${latestReact}`);
      console.log(`Current React version: ${currentReact}`);
      console.log(`Latest React-DOM version: ${latestReactDom}`);
      console.log(`Current React-DOM version: ${currentReactDom}`);
      
      if (latestReact !== currentReact || latestReactDom !== currentReactDom) {
        console.log('\n🔄 Updating React packages...\n');
        
        // Update package.json
        if (packageJson.dependencies) {
          packageJson.dependencies.react = `^${latestReact}`;
          packageJson.dependencies['react-dom'] = `^${latestReactDom}`;
        }
        
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log('✅ Updated package.json with latest React versions');
        
        console.log('\n📥 Installing updated packages...\n');
        await execAsync('npm install', {
          cwd: frontendDir,
          maxBuffer: 1024 * 1024 * 10
        });
        
        console.log('✅ React packages updated successfully!');
      } else {
        console.log('\n✅ React is already at the latest version!');
      }
      
    } catch (error) {
      console.error('⚠️  Could not update React automatically:', error.message);
      console.log('\n💡 Please update manually:');
      console.log('   npm install react@latest react-dom@latest');
    }
    
    // Run audit after update
    console.log('\n─'.repeat(50));
    console.log('\n🔍 Running security audit after update...\n');
    
    try {
      await execAsync('npm audit', {
        cwd: frontendDir
      });
    } catch (error) {
      if (error.code === 1) {
        console.log('⚠️  Some vulnerabilities may still exist. Run: npm audit fix');
      }
    }
    
    console.log('\n✅ Dependency update process completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test your application thoroughly');
    console.log('   2. Run: npm audit fix (if vulnerabilities found)');
    console.log('   3. Commit changes to package.json and package-lock.json');
    
  } catch (error) {
    console.error('\n❌ Error updating dependencies:', error.message);
    console.error('\nPlease check:');
    console.error('  1. You are in the Frontend directory');
    console.error('  2. npm is installed and accessible');
    console.error('  3. You have write permissions to package.json');
  }
}

updateDependencies();

