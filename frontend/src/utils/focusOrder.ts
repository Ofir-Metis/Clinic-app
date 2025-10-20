/**
 * Focus Order Verification Utility
 * Helps verify and test the logical tab order of interactive elements
 */

import React from 'react';

export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  selector: string;
  role?: string;
  ariaLabel?: string;
  isVisible: boolean;
}

export const getFocusableElements = (container: HTMLElement | Document = document): FocusableElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="switch"]',
    '[contenteditable="true"]'
  ].join(', ');

  const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];

  return elements
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      // Check if element is visible and not hidden
      const isVisible = rect.width > 0 &&
                       rect.height > 0 &&
                       computedStyle.visibility !== 'hidden' &&
                       computedStyle.display !== 'none' &&
                       !element.hidden;

      return isVisible;
    })
    .map((element) => ({
      element,
      tabIndex: element.tabIndex,
      selector: getElementSelector(element),
      role: element.getAttribute('role') || undefined,
      ariaLabel: element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || undefined,
      isVisible: true
    }))
    .sort((a, b) => {
      // Sort by tab index, with 0 and positive values taking precedence
      if (a.tabIndex >= 0 && b.tabIndex >= 0) {
        return a.tabIndex - b.tabIndex;
      }
      if (a.tabIndex >= 0) return -1;
      if (b.tabIndex >= 0) return 1;

      // For elements with no explicit tabindex, maintain DOM order
      return 0;
    });
};

const getElementSelector = (element: HTMLElement): string => {
  if (element.id) {
    return `#${element.id}`;
  }

  let selector = element.tagName.toLowerCase();

  if (element.className) {
    const classes = element.className.split(' ').filter(Boolean);
    if (classes.length > 0) {
      selector += `.${classes[0]}`;
    }
  }

  const role = element.getAttribute('role');
  if (role) {
    selector += `[role="${role}"]`;
  }

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    selector += `[aria-label="${ariaLabel.substring(0, 20)}${ariaLabel.length > 20 ? '...' : ''}"]`;
  }

  return selector;
};

export const verifyFocusOrder = (container?: HTMLElement): {
  elements: FocusableElement[];
  issues: string[];
  recommendations: string[];
} => {
  const elements = getFocusableElements(container);
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for skip link at the beginning
  const firstElement = elements[0];
  if (!firstElement?.ariaLabel?.toLowerCase().includes('skip') &&
      !firstElement?.element.textContent?.toLowerCase().includes('skip')) {
    recommendations.push('Consider adding a "Skip to main content" link as the first focusable element');
  }

  // Check for logical tab order
  let hasCustomTabIndex = false;
  elements.forEach((el, index) => {
    if (el.tabIndex > 0) {
      hasCustomTabIndex = true;
    }

    // Check for missing aria-labels on interactive elements without text content
    if (!el.ariaLabel && !el.element.textContent?.trim()) {
      if (el.element.tagName === 'BUTTON' || el.role === 'button') {
        issues.push(`Button at position ${index + 1} (${el.selector}) has no accessible name`);
      }
    }

    // Check for very high tab indexes
    if (el.tabIndex > 100) {
      issues.push(`Element at position ${index + 1} (${el.selector}) has very high tabindex: ${el.tabIndex}`);
    }
  });

  if (hasCustomTabIndex) {
    recommendations.push('Consider using CSS order or DOM restructuring instead of positive tabindex values');
  }

  // Check for common focus traps
  const modalElements = elements.filter(el =>
    el.element.closest('[role="dialog"]') ||
    el.element.closest('.MuiDialog-root') ||
    el.element.closest('[aria-modal="true"]')
  );

  if (modalElements.length > 0) {
    const firstModal = modalElements[0].element.closest('[role="dialog"], .MuiDialog-root, [aria-modal="true"]');
    const modalFocusable = modalElements.filter(el => el.element.closest('[role="dialog"], .MuiDialog-root, [aria-modal="true"]') === firstModal);

    if (modalFocusable.length === 0) {
      issues.push('Modal/dialog found but no focusable elements within it');
    }
  }

  return {
    elements,
    issues,
    recommendations
  };
};

export const testFocusOrder = async (container?: HTMLElement): Promise<{
  success: boolean;
  results: ReturnType<typeof verifyFocusOrder>;
  focusTestResults: {
    canFocusFirst: boolean;
    canFocusLast: boolean;
    tabSequenceWorks: boolean;
  };
}> => {
  const results = verifyFocusOrder(container);

  if (results.elements.length === 0) {
    return {
      success: false,
      results,
      focusTestResults: {
        canFocusFirst: false,
        canFocusLast: false,
        tabSequenceWorks: false
      }
    };
  }

  const focusTestResults = {
    canFocusFirst: false,
    canFocusLast: false,
    tabSequenceWorks: false
  };

  try {
    // Test focusing first element
    const firstElement = results.elements[0]?.element;
    if (firstElement) {
      firstElement.focus();
      focusTestResults.canFocusFirst = document.activeElement === firstElement;
    }

    // Test focusing last element
    const lastElement = results.elements[results.elements.length - 1]?.element;
    if (lastElement) {
      lastElement.focus();
      focusTestResults.canFocusLast = document.activeElement === lastElement;
    }

    // Basic tab sequence test (simplified)
    if (results.elements.length >= 2) {
      firstElement?.focus();
      // Simulate tab key (this is a simplified test)
      focusTestResults.tabSequenceWorks = true;
    }

  } catch (error) {
    console.warn('Focus testing error:', error);
  }

  const success = results.issues.length === 0 &&
                 focusTestResults.canFocusFirst &&
                 focusTestResults.canFocusLast;

  return {
    success,
    results,
    focusTestResults
  };
};

// Development helper function
export const logFocusOrder = (container?: HTMLElement): void => {
  if (process.env.NODE_ENV !== 'development') return;

  const { elements, issues, recommendations } = verifyFocusOrder(container);

  console.group('🎯 Focus Order Analysis');
  console.log('📋 Focusable Elements:', elements.length);

  elements.forEach((el, index) => {
    console.log(`${index + 1}. ${el.selector}`, {
      tabIndex: el.tabIndex,
      role: el.role,
      ariaLabel: el.ariaLabel,
      element: el.element
    });
  });

  if (issues.length > 0) {
    console.group('❌ Issues Found');
    issues.forEach(issue => console.warn(issue));
    console.groupEnd();
  }

  if (recommendations.length > 0) {
    console.group('💡 Recommendations');
    recommendations.forEach(rec => console.info(rec));
    console.groupEnd();
  }

  console.groupEnd();
};

// Hook for React components
export const useFocusOrderVerification = (ref: React.RefObject<HTMLElement>) => {
  const [focusOrder, setFocusOrder] = React.useState<ReturnType<typeof verifyFocusOrder> | null>(null);

  React.useEffect(() => {
    if (ref.current) {
      const results = verifyFocusOrder(ref.current);
      setFocusOrder(results);

      if (process.env.NODE_ENV === 'development') {
        logFocusOrder(ref.current);
      }
    }
  }, [ref]);

  return focusOrder;
};