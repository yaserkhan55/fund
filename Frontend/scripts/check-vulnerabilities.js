#!/usr/bin/env node

/**
 * Script to check for npm vulnerabilities
 * Run with: node scripts/check-vulnerabilities.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendDir = join(__dirname, '..');

console.log('🔍 Checking for security vulnerabilities...\n');
console.log('Working directory:', frontendDir);
console.log('─'.repeat(50));

async function checkVulnerabilities() {
  try {
    console.log('\n📦 Running npm audit...\n');
    
    const { stdout, stderr } = await execAsync('npm audit --json', {
      cwd: frontendDir,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    if (stderr && !stderr.includes('found 0 vulnerabilities')) {
      console.log('⚠️  Audit warnings:', stderr);
    }

    const auditResult = JSON.parse(stdout);
    
    if (auditResult.vulnerabilities && Object.keys(auditResult.vulnerabilities).length > 0) {
      console.log('❌ Vulnerabilities found:\n');
      
      const vulnCount = Object.keys(auditResult.vulnerabilities).length;
      const severityCount = auditResult.metadata?.vulnerabilities || {};
      
      console.log(`Total vulnerabilities: ${vulnCount}`);
      console.log('By severity:');
      if (severityCount.critical) console.log(`  🔴 Critical: ${severityCount.critical}`);
      if (severityCount.high) console.log(`  🟠 High: ${severityCount.high}`);
      if (severityCount.moderate) console.log(`  🟡 Moderate: ${severityCount.moderate}`);
      if (severityCount.low) console.log(`  🟢 Low: ${severityCount.low}`);
      
      console.log('\n📋 Top vulnerabilities:');
      let count = 0;
      for (const [pkg, vuln] of Object.entries(auditResult.vulnerabilities)) {
        if (count >= 10) break; // Show top 10
        console.log(`\n  Package: ${pkg}`);
        if (vuln.severity) console.log(`    Severity: ${vuln.severity}`);
        if (vuln.title) console.log(`    Title: ${vuln.title}`);
        if (vuln.via && vuln.via.length > 0) {
          const viaInfo = typeof vuln.via[0] === 'string' ? vuln.via[0] : vuln.via[0].title;
          console.log(`    Issue: ${viaInfo}`);
        }
        count++;
      }
      
      console.log('\n💡 To fix vulnerabilities, run:');
      console.log('   npm audit fix');
      console.log('   Or for auto-fix: npm audit fix --force');
      
    } else {
      console.log('✅ No vulnerabilities found!');
    }

    // Check React specifically
    console.log('\n─'.repeat(50));
    console.log('\n⚛️  Checking React versions...\n');
    
    const { stdout: reactVersion } = await execAsync('npm list react react-dom --depth=0', {
      cwd: frontendDir
    });
    
    console.log('Current React versions:');
    console.log(reactVersion);
    
    console.log('\n📌 Latest available versions:');
    try {
      const { stdout: latestReact } = await execAsync('npm view react version', {
        cwd: frontendDir
      });
      const { stdout: latestReactDom } = await execAsync('npm view react-dom version', {
        cwd: frontendDir
      });
      
      console.log(`  react: ${latestReact.trim()}`);
      console.log(`  react-dom: ${latestReactDom.trim()}`);
    } catch (e) {
      console.log('  Could not fetch latest versions');
    }

  } catch (error) {
    if (error.code === 1) {
      // npm audit exits with code 1 when vulnerabilities are found
      console.log('\n⚠️  npm audit found vulnerabilities. Check the output above.');
    } else {
      console.error('\n❌ Error checking vulnerabilities:', error.message);
      console.error('\nMake sure you are in the Frontend directory and npm is installed.');
    }
  }
}

checkVulnerabilities();

