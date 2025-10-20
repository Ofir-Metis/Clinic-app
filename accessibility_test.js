const puppeteer = require('puppeteer');

async function testAccessibility() {
  console.log('♿ Testing Accessibility and Visual Design...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Test main login page
    await page.goto('http://localhost:5173/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Comprehensive accessibility and design analysis
    const accessibilityInfo = await page.evaluate(() => {
      // Color contrast analysis
      const computedStyles = window.getComputedStyle(document.body);
      const textColor = computedStyles.color;
      const backgroundColor = computedStyles.backgroundColor;

      // Find all interactive elements
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent?.trim(),
        hasAriaLabel: !!btn.getAttribute('aria-label'),
        hasRole: !!btn.getAttribute('role'),
        disabled: btn.disabled,
        tabIndex: btn.tabIndex
      }));

      const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        placeholder: input.placeholder,
        hasLabel: !!input.labels?.length || !!document.querySelector(`label[for="${input.id}"]`),
        hasAriaLabel: !!input.getAttribute('aria-label'),
        hasAriaDescribedBy: !!input.getAttribute('aria-describedby'),
        required: input.required,
        name: input.name || input.id
      }));

      const links = Array.from(document.querySelectorAll('a')).map(link => ({
        text: link.textContent?.trim(),
        href: link.href,
        hasAriaLabel: !!link.getAttribute('aria-label'),
        hasTitle: !!link.title,
        opensNewWindow: link.target === '_blank'
      }));

      // Check for semantic HTML
      const semanticElements = {
        nav: document.querySelectorAll('nav').length,
        main: document.querySelectorAll('main').length,
        header: document.querySelectorAll('header').length,
        footer: document.querySelectorAll('footer').length,
        section: document.querySelectorAll('section').length,
        article: document.querySelectorAll('article').length,
        aside: document.querySelectorAll('aside').length
      };

      // Check for ARIA landmarks
      const ariaElements = {
        landmarks: document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"]').length,
        liveRegions: document.querySelectorAll('[aria-live]').length,
        hiddenElements: document.querySelectorAll('[aria-hidden="true"]').length,
        labelledBy: document.querySelectorAll('[aria-labelledby]').length,
        describedBy: document.querySelectorAll('[aria-describedby]').length
      };

      // Check heading structure
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim(),
        hasId: !!h.id
      }));

      // Check for images and alt text
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        hasAlt: !!img.alt,
        decorative: img.alt === '' || img.getAttribute('role') === 'presentation'
      }));

      // Typography analysis
      const typographyInfo = {
        fontFamily: computedStyles.fontFamily,
        fontSize: computedStyles.fontSize,
        lineHeight: computedStyles.lineHeight,
        fontWeight: computedStyles.fontWeight
      };

      // Check for focus management
      const focusableElements = document.querySelectorAll(
        'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
      ).length;

      return {
        colors: { textColor, backgroundColor },
        interactivity: { buttons, inputs, links, focusableElements },
        semantics: semanticElements,
        aria: ariaElements,
        headings,
        images,
        typography: typographyInfo,
        totalElements: document.querySelectorAll('*').length
      };
    });

    console.log('\n🎨 VISUAL DESIGN ANALYSIS');
    console.log('=' * 40);
    console.log(`Typography:`);
    console.log(`  Font Family: ${accessibilityInfo.typography.fontFamily}`);
    console.log(`  Font Size: ${accessibilityInfo.typography.fontSize}`);
    console.log(`  Line Height: ${accessibilityInfo.typography.lineHeight}`);
    console.log(`  Font Weight: ${accessibilityInfo.typography.fontWeight}`);

    console.log(`\nColors:`);
    console.log(`  Text Color: ${accessibilityInfo.colors.textColor}`);
    console.log(`  Background: ${accessibilityInfo.colors.backgroundColor}`);

    console.log('\n♿ ACCESSIBILITY ANALYSIS');
    console.log('=' * 40);

    console.log(`Semantic HTML Elements:`);
    Object.entries(accessibilityInfo.semantics).forEach(([element, count]) => {
      const status = count > 0 ? '✅' : '❌';
      console.log(`  ${status} ${element}: ${count}`);
    });

    console.log(`\nARIA Implementation:`);
    Object.entries(accessibilityInfo.aria).forEach(([feature, count]) => {
      console.log(`  ${feature}: ${count}`);
    });

    console.log(`\nHeading Structure:`);
    if (accessibilityInfo.headings.length === 0) {
      console.log('  ❌ No headings found');
    } else {
      accessibilityInfo.headings.forEach((heading, index) => {
        console.log(`  H${heading.level}: "${heading.text}"`);
      });
    }

    console.log(`\nInteractive Elements:`);
    console.log(`  Buttons: ${accessibilityInfo.interactivity.buttons.length}`);
    console.log(`  Input Fields: ${accessibilityInfo.interactivity.inputs.length}`);
    console.log(`  Links: ${accessibilityInfo.interactivity.links.length}`);
    console.log(`  Total Focusable: ${accessibilityInfo.interactivity.focusableElements}`);

    console.log(`\nButton Analysis:`);
    accessibilityInfo.interactivity.buttons.forEach((button, index) => {
      const issues = [];
      if (!button.text && !button.hasAriaLabel) issues.push('No accessible name');
      if (button.tabIndex < 0) issues.push('Not keyboard accessible');

      const status = issues.length === 0 ? '✅' : '⚠️';
      console.log(`  ${status} Button ${index + 1}: "${button.text}"`);
      if (issues.length > 0) {
        console.log(`    Issues: ${issues.join(', ')}`);
      }
    });

    console.log(`\nInput Field Analysis:`);
    accessibilityInfo.interactivity.inputs.forEach((input, index) => {
      const issues = [];
      if (!input.hasLabel && !input.hasAriaLabel && !input.placeholder) {
        issues.push('No accessible label');
      }
      if (input.required && !input.hasAriaDescribedBy) {
        issues.push('Required field not properly indicated');
      }

      const status = issues.length === 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${input.type} input: "${input.placeholder || input.name}"`);
      if (issues.length > 0) {
        console.log(`    Issues: ${issues.join(', ')}`);
      }
    });

    console.log(`\nImage Analysis:`);
    if (accessibilityInfo.images.length === 0) {
      console.log('  ℹ️ No images found');
    } else {
      accessibilityInfo.images.forEach((img, index) => {
        const status = img.hasAlt || img.decorative ? '✅' : '❌';
        console.log(`  ${status} Image ${index + 1}: Alt="${img.alt}"`);
      });
    }

    // Calculate accessibility score
    let score = 0;
    let maxScore = 0;

    // Semantic HTML (20 points)
    maxScore += 20;
    const semanticCount = Object.values(accessibilityInfo.semantics).reduce((a, b) => a + b, 0);
    score += Math.min(semanticCount * 3, 20);

    // Interactive elements (30 points)
    maxScore += 30;
    const goodButtons = accessibilityInfo.interactivity.buttons.filter(btn =>
      btn.text || btn.hasAriaLabel
    ).length;
    const goodInputs = accessibilityInfo.interactivity.inputs.filter(input =>
      input.hasLabel || input.hasAriaLabel || input.placeholder
    ).length;

    if (accessibilityInfo.interactivity.buttons.length > 0) {
      score += (goodButtons / accessibilityInfo.interactivity.buttons.length) * 15;
    }
    if (accessibilityInfo.interactivity.inputs.length > 0) {
      score += (goodInputs / accessibilityInfo.interactivity.inputs.length) * 15;
    }

    // Headings (20 points)
    maxScore += 20;
    if (accessibilityInfo.headings.length > 0) {
      const hasH1 = accessibilityInfo.headings.some(h => h.level === 1);
      score += hasH1 ? 20 : 10;
    }

    // ARIA usage (20 points)
    maxScore += 20;
    const ariaCount = Object.values(accessibilityInfo.aria).reduce((a, b) => a + b, 0);
    score += Math.min(ariaCount * 2, 20);

    // Images (10 points)
    maxScore += 10;
    if (accessibilityInfo.images.length === 0) {
      score += 10; // No images is fine
    } else {
      const goodImages = accessibilityInfo.images.filter(img => img.hasAlt || img.decorative).length;
      score += (goodImages / accessibilityInfo.images.length) * 10;
    }

    const accessibilityScore = Math.round((score / maxScore) * 100);

    console.log('\n📊 ACCESSIBILITY SCORE');
    console.log('=' * 30);
    console.log(`Overall Score: ${accessibilityScore}%`);

    if (accessibilityScore >= 90) {
      console.log('🏆 Excellent accessibility implementation!');
    } else if (accessibilityScore >= 70) {
      console.log('👍 Good accessibility, some improvements possible');
    } else if (accessibilityScore >= 50) {
      console.log('⚠️ Moderate accessibility, needs attention');
    } else {
      console.log('❌ Poor accessibility, significant improvements needed');
    }

  } catch (error) {
    console.error('❌ Error testing accessibility:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testAccessibility().catch(console.error);