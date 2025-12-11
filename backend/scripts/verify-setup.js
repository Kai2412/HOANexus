/**
 * Verification script to check if all services are properly configured
 * Run with: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying HOA Nexus Development Setup...\n');

let allGood = true;

// Check 1: .env file exists
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file exists');
  
  // Read and check required variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'CHROMA_USE_SERVER',
    'CHROMA_SERVER_HOST',
    'CHROMA_SERVER_PORT',
    'ENABLE_AI',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY'
  ];
  
  const missingVars = [];
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=`, 'm');
    if (!regex.test(envContent)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log(`   ⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    allGood = false;
  } else {
    console.log('   ✅ All required environment variables present');
  }
} else {
  console.log('   ❌ .env file not found');
  allGood = false;
}

// Check 2: Docker is running
console.log('\n2. Checking Docker...');
try {
  execSync('docker ps', { stdio: 'ignore' });
  console.log('   ✅ Docker is running');
} catch (error) {
  console.log('   ❌ Docker is not running. Please start Docker Desktop.');
  allGood = false;
}

// Check 3: ChromaDB container
console.log('\n3. Checking ChromaDB container...');
try {
  const output = execSync('docker ps -a --filter "name=chromadb" --format "{{.Names}}"', { encoding: 'utf8' });
  if (output.trim() === 'chromadb') {
    // Check if it's running
    const status = execSync('docker ps --filter "name=chromadb" --format "{{.Names}}"', { encoding: 'utf8' });
    if (status.trim() === 'chromadb') {
      console.log('   ✅ ChromaDB container is running');
    } else {
      console.log('   ⚠️  ChromaDB container exists but is not running');
      console.log('      Run: npm run chromadb');
      allGood = false;
    }
  } else {
    console.log('   ⚠️  ChromaDB container not found');
    console.log('      Run: npm run chromadb');
    allGood = false;
  }
} catch (error) {
  console.log('   ⚠️  Could not check ChromaDB container');
  allGood = false;
}

// Check 4: Required directories
console.log('\n4. Checking data directories...');
const directories = [
  path.join(__dirname, '../../chroma-data'),
  path.join(__dirname, '../../azurite-data')
];

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${path.basename(dir)} directory exists`);
  } else {
    console.log(`   ⚠️  ${path.basename(dir)} directory will be created automatically`);
  }
});

// Check 5: Port availability
console.log('\n5. Checking ports...');
const ports = [
  { name: 'Backend', port: 5001 },
  { name: 'Frontend', port: 3000 },
  { name: 'Azurite', port: 10000 },
  { name: 'ChromaDB', port: 8000 }
];

ports.forEach(({ name, port }) => {
  try {
    // Try to check if port is in use (Windows)
    if (process.platform === 'win32') {
      const netstat = execSync(`netstat -an | findstr :${port}`, { encoding: 'utf8' });
      if (netstat.includes(`:${port}`)) {
        console.log(`   ✅ Port ${port} (${name}) is available/in use`);
      } else {
        console.log(`   ⚠️  Port ${port} (${name}) appears free`);
      }
    } else {
      // Linux/Mac
      execSync(`lsof -i :${port}`, { stdio: 'ignore' });
      console.log(`   ✅ Port ${port} (${name}) is in use`);
    }
  } catch (error) {
    console.log(`   ⚠️  Port ${port} (${name}) is free (may need to start service)`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ Setup looks good! You should be ready to go.');
  console.log('\nNext steps:');
  console.log('1. Start Frontend: cd frontend && npm run dev');
  console.log('2. Start Backend: cd backend && npm run dev');
  console.log('3. Start Azurite: cd backend && npm run azurite');
  console.log('4. Start ChromaDB: cd backend && npm run chromadb');
} else {
  console.log('⚠️  Some issues found. Please fix them before proceeding.');
  console.log('\nSee backend/DOCKER_SETUP_GUIDE.md for detailed setup instructions.');
}
console.log('='.repeat(50));

process.exit(allGood ? 0 : 1);

