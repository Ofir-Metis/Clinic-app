#!/usr/bin/env node

/**
 * UI Analysis Tool for Clinic App
 * This script analyzes the React components to understand the UI structure
 */

const fs = require('fs');
const path = require('path');

function analyzeReactComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract JSX structure and UI elements
    const jsxElements = [];
    const materialUIComponents = [];
    const textContent = [];
    
    // Find Material-UI components
    const muiMatches = content.match(/@mui\/[^'"]*/g) || [];
    materialUIComponents.push(...muiMatches);
    
    // Find Typography, Button, TextField, etc.
    const componentMatches = content.match(/<(\w+)[\s>]/g) || [];
    jsxElements.push(...componentMatches.map(m => m.replace(/[<>\s]/g, '')));
    
    // Find text content (strings in JSX)
    const textMatches = content.match(/['"`]([^'"`]{5,})['"`]/g) || [];
    textContent.push(...textMatches.map(m => m.replace(/['"`]/g, '')));
    
    return {
      fileName: path.basename(filePath),
      materialUIComponents: [...new Set(materialUIComponents)],
      jsxElements: [...new Set(jsxElements)],
      textContent: textContent.filter(t => 
        !t.includes('import') && 
        !t.includes('export') && 
        !t.includes('http') &&
        !t.includes('.') &&
        t.length > 3
      ).slice(0, 10)
    };
  } catch (error) {
    return { fileName: path.basename(filePath), error: error.message };
  }
}

function analyzeUIStructure() {
  console.log('🎨 CLINIC APP UI STRUCTURE ANALYSIS');
  console.log('===================================\n');

  // Analyze key UI components
  const keyFiles = [
    'frontend/src/App.tsx',
    'frontend/src/pages/LoginPage.tsx',
    'frontend/src/pages/RegistrationPage.tsx',
    'frontend/src/pages/client/ClientLoginPage.tsx',
    'frontend/src/pages/client/ClientRegisterPage.tsx',
    'frontend/src/pages/DashboardPage.tsx',
    'frontend/src/pages/client/ClientDashboard.tsx',
    'frontend/src/pages/AdminDashboardPage.tsx'
  ];

  console.log('📱 ANALYZING KEY USER INTERFACE PAGES:');
  console.log('=====================================\n');

  keyFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const analysis = analyzeReactComponent(fullPath);
      
      console.log(`🔍 ${analysis.fileName.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      if (analysis.error) {
        console.log(`❌ Error: ${analysis.error}\n`);
        return;
      }
      
      if (analysis.materialUIComponents.length > 0) {
        console.log('📦 Material-UI Components Used:');
        analysis.materialUIComponents.forEach(comp => console.log(`   • ${comp}`));
        console.log('');
      }
      
      if (analysis.jsxElements.length > 0) {
        console.log('🧩 UI Elements Found:');
        analysis.jsxElements.slice(0, 15).forEach(elem => console.log(`   • ${elem}`));
        console.log('');
      }
      
      if (analysis.textContent.length > 0) {
        console.log('📝 User-Visible Text:');
        analysis.textContent.forEach(text => console.log(`   • "${text}"`));
        console.log('');
      }
      
      console.log('\n');
    } else {
      console.log(`❌ File not found: ${file}\n`);
    }
  });

  // Analyze theme and styling
  console.log('🎨 THEME AND STYLING ANALYSIS:');
  console.log('==============================\n');

  const themeFile = path.join(__dirname, 'frontend/src/theme.ts');
  if (fs.existsSync(themeFile)) {
    const themeContent = fs.readFileSync(themeFile, 'utf8');
    
    // Extract colors
    const colorMatches = themeContent.match(/#[0-9a-fA-F]{6}/g) || [];
    if (colorMatches.length > 0) {
      console.log('🎨 Color Palette:');
      [...new Set(colorMatches)].forEach(color => console.log(`   • ${color}`));
      console.log('');
    }

    // Extract fonts
    const fontMatches = themeContent.match(/fontFamily:\s*['"`]([^'"`]*)['"`]/g) || [];
    if (fontMatches.length > 0) {
      console.log('🔤 Typography:');
      fontMatches.forEach(font => console.log(`   • ${font.replace(/fontFamily:\s*['"`]|['"`]/g, '')}`));
      console.log('');
    }
  }

  // Check for responsive design
  console.log('📱 RESPONSIVE DESIGN ANALYSIS:');
  console.log('==============================\n');
  
  const components = ['frontend/src/pages/client/ClientRegisterPage.tsx'];
  components.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for responsive breakpoints
      const breakpoints = content.match(/xs|sm|md|lg|xl/g) || [];
      const responsive = content.match(/useTheme|breakpoint/g) || [];
      
      if (breakpoints.length > 0 || responsive.length > 0) {
        console.log(`📱 ${path.basename(file)} - Responsive Features:`);
        if (breakpoints.length > 0) {
          console.log(`   • Breakpoints used: ${[...new Set(breakpoints)].join(', ')}`);
        }
        if (responsive.length > 0) {
          console.log(`   • Responsive hooks: ${[...new Set(responsive)].join(', ')}`);
        }
        console.log('');
      }
    }
  });

  console.log('✅ Analysis complete! This gives us insight into the UI structure.');
  console.log('🌐 To fully test, we need to register users through the actual web interface.');
}

// Run the analysis
analyzeUIStructure();