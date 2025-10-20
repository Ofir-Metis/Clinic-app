const fs = require('fs');
const yaml = require('js-yaml');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function analyzeFullSystem() {
  console.log('🔍 COMPREHENSIVE DOCKER COMPOSE SYSTEM ANALYSIS');
  console.log('===============================================\n');

  // Find all docker-compose files
  const composeFiles = [
    'docker-compose.yml',
    'docker-compose.core.yml', 
    'docker-compose.enhanced.yml',
    'docker-compose.monitoring.yml',
    'docker-compose.staging.yml',
    'docker-compose.production-ready.yml'
  ];

  const allServices = new Map();
  let totalServices = 0;

  console.log('📋 ANALYZING DOCKER COMPOSE FILES:\n');

  for (const file of composeFiles) {
    try {
      if (fs.existsSync(file)) {
        console.log(`📄 ${file}:`);
        const content = fs.readFileSync(file, 'utf8');
        const compose = yaml.load(content);
        
        if (compose.services) {
          const serviceNames = Object.keys(compose.services);
          console.log(`   Services (${serviceNames.length}): ${serviceNames.join(', ')}`);
          
          serviceNames.forEach(name => {
            if (!allServices.has(name)) {
              const service = compose.services[name];
              allServices.set(name, {
                file: file,
                ports: service.ports || [],
                build: !!service.build,
                image: service.image || 'custom build',
                depends_on: service.depends_on || []
              });
            }
          });
          totalServices += serviceNames.length;
        }
        console.log('');
      }
    } catch (error) {
      console.log(`   ❌ Error reading ${file}: ${error.message}\n`);
    }
  }

  console.log(`🎯 TOTAL UNIQUE SERVICES AVAILABLE: ${allServices.size}`);
  console.log(`📊 TOTAL SERVICE DEFINITIONS: ${totalServices}\n`);

  // Get currently running containers
  console.log('🔄 CHECKING CURRENTLY RUNNING CONTAINERS:\n');
  
  try {
    const { stdout } = await execAsync('docker ps --format "{{.Names}}\t{{.Status}}\t{{.Ports}}"');
    const runningContainers = stdout.trim().split('\n').filter(line => line.trim());
    
    console.log(`✅ Currently Running: ${runningContainers.length} containers\n`);
    
    // Parse running container names
    const runningNames = new Set();
    runningContainers.forEach(line => {
      const [name] = line.split('\t');
      if (name && name.includes('clinic-app-')) {
        const serviceName = name.replace('clinic-app-', '').replace('-1', '');
        runningNames.add(serviceName);
      }
    });

    console.log('📊 SERVICE ANALYSIS:\n');

    // Categorize services
    const categories = {
      'Core Application Services': [],
      'Infrastructure Services': [],  
      'Advanced Features': [],
      'Monitoring & Admin': [],
      'Development Tools': []
    };

    allServices.forEach((config, name) => {
      const status = runningNames.has(name) ? '✅ RUNNING' : '⭐ AVAILABLE';
      const ports = config.ports.length > 0 ? ` (${config.ports.join(', ')})` : '';
      
      if (['postgres', 'redis', 'nats', 'minio', 'maildev', 'elasticsearch'].includes(name)) {
        categories['Infrastructure Services'].push(`${name}${ports} - ${status}`);
      } else if (['prometheus', 'grafana', 'nginx', 'pgadmin', 'redis-commander'].includes(name)) {
        categories['Monitoring & Admin'].push(`${name}${ports} - ${status}`);
      } else if (['ai-service', 'search-service', 'cdn-service', 'google-integration-service'].includes(name)) {
        categories['Advanced Features'].push(`${name}${ports} - ${status}`);
      } else if (name.includes('-service') || name === 'api-gateway') {
        categories['Core Application Services'].push(`${name}${ports} - ${status}`);
      } else {
        categories['Development Tools'].push(`${name}${ports} - ${status}`);
      }
    });

    Object.entries(categories).forEach(([category, services]) => {
      if (services.length > 0) {
        console.log(`🔸 ${category} (${services.length}):`);
        services.forEach(service => console.log(`   ${service}`));
        console.log('');
      }
    });

    // Full system command
    console.log('🚀 TO START THE COMPLETE 30+ CONTAINER SYSTEM:\n');
    console.log('docker-compose \\');
    console.log('  -f docker-compose.yml \\');
    console.log('  -f docker-compose.enhanced.yml \\');
    console.log('  -f docker-compose.monitoring.yml \\');
    console.log('  up -d\n');

    console.log('📈 SYSTEM STATUS SUMMARY:');
    console.log(`   • Total Available Services: ${allServices.size}`);
    console.log(`   • Currently Running: ${runningNames.size}`);
    console.log(`   • Missing/Stopped: ${allServices.size - runningNames.size}`);
    console.log(`   • System Completeness: ${Math.round((runningNames.size / allServices.size) * 100)}%`);

    // Missing services
    const missingServices = Array.from(allServices.keys()).filter(name => !runningNames.has(name));
    if (missingServices.length > 0) {
      console.log(`\n❌ MISSING SERVICES (${missingServices.length}):`);
      missingServices.forEach(name => {
        const config = allServices.get(name);
        console.log(`   • ${name} (from ${config.file})`);
      });
    }

  } catch (error) {
    console.log(`❌ Error checking running containers: ${error.message}`);
  }
}

// Check if js-yaml is available
try {
  require('js-yaml');
  analyzeFullSystem().catch(console.error);
} catch (error) {
  console.log('❌ js-yaml not available. Installing...');
  console.log('💡 Run: npm install js-yaml');
  console.log('🔄 Then run this script again');
}