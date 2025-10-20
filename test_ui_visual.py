#!/usr/bin/env python3
"""
Live Visual UI/UX Testing Script for Clinic Management Application
Performs actual browser automation and screenshots
"""

import os
import time
import json
from datetime import datetime

def test_with_playwright():
    """Test using Playwright browser automation"""
    try:
        from playwright.sync_api import sync_playwright

        print("🚀 Starting Playwright browser automation...")

        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=False)  # Set to False to see browser
            page = browser.new_page()

            # Set viewport size for desktop testing
            page.set_viewport_size({"width": 1920, "height": 1080})

            # Create screenshots directory
            os.makedirs("screenshots", exist_ok=True)

            # Navigate to application
            print("🔍 TESTING LANDING PAGE...")
            page.goto("http://localhost:5173")

            # Wait for page to load
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            # Take screenshot of landing page
            page.screenshot(path="screenshots/01_landing_page_desktop.png", full_page=True)
            print("✅ Screenshot saved: 01_landing_page_desktop.png")

            # Get page title and URL
            title = page.title()
            url = page.url
            print(f"📄 Page Title: {title}")
            print(f"🌐 Current URL: {url}")

            # Check for common elements
            try:
                # Look for React root element
                root = page.locator("#root")
                if root.is_visible():
                    print("✅ React root element found and visible")

                # Look for navigation
                nav_elements = page.locator("nav").count()
                print(f"🧭 Navigation elements: {nav_elements}")

                # Look for buttons
                button_elements = page.locator("button").count()
                print(f"🔘 Button elements: {button_elements}")

                # Look for links
                link_elements = page.locator("a").count()
                print(f"🔗 Link elements: {link_elements}")

                # Look for forms
                form_elements = page.locator("form").count()
                print(f"📝 Form elements: {form_elements}")

                # Look for input fields
                input_elements = page.locator("input").count()
                print(f"📝 Input elements: {input_elements}")

            except Exception as e:
                print(f"⚠️ Error analyzing page elements: {e}")

            # Test for authentication pages
            print("\n🔐 TESTING AUTHENTICATION...")

            # Look for login/register links or buttons
            try:
                # Common authentication element selectors
                auth_selectors = [
                    "text=Login", "text=Sign In", "text=Register", "text=Sign Up",
                    "[href*='login']", "[href*='register']", "[href*='auth']",
                    "button:has-text('Login')", "button:has-text('Register')"
                ]

                for selector in auth_selectors:
                    elements = page.locator(selector)
                    if elements.count() > 0:
                        print(f"✅ Found authentication element: {selector}")
                        try:
                            # Try to click and screenshot
                            elements.first.click()
                            page.wait_for_load_state("networkidle")
                            time.sleep(1)

                            # Take screenshot
                            screenshot_name = f"screenshots/02_auth_page_{selector.replace(':', '_').replace('(', '_').replace(')', '_')}.png"
                            page.screenshot(path=screenshot_name, full_page=True)
                            print(f"✅ Screenshot saved: {screenshot_name}")

                            # Go back to continue testing
                            page.go_back()
                            page.wait_for_load_state("networkidle")
                            break

                        except Exception as e:
                            print(f"⚠️ Could not interact with {selector}: {e}")

            except Exception as e:
                print(f"⚠️ Error testing authentication: {e}")

            # Test responsive design
            print("\n📱 TESTING RESPONSIVE DESIGN...")

            # Test mobile viewport
            page.set_viewport_size({"width": 375, "height": 667})
            time.sleep(2)
            page.screenshot(path="screenshots/03_mobile_layout.png", full_page=True)
            print("✅ Mobile screenshot saved: 03_mobile_layout.png")

            # Test tablet viewport
            page.set_viewport_size({"width": 768, "height": 1024})
            time.sleep(2)
            page.screenshot(path="screenshots/04_tablet_layout.png", full_page=True)
            print("✅ Tablet screenshot saved: 04_tablet_layout.png")

            # Back to desktop
            page.set_viewport_size({"width": 1920, "height": 1080})
            time.sleep(2)

            # Test page content
            print("\n📄 ANALYZING PAGE CONTENT...")

            # Get page HTML for analysis
            html_content = page.content()

            # Look for common React/Material-UI patterns
            patterns = {
                "Material-UI": "MuiBox" in html_content or "MuiButton" in html_content,
                "React": "react" in html_content.lower(),
                "CSS-in-JS": "emotion" in html_content or "styled" in html_content,
                "TypeScript": ".tsx" in html_content or ".ts" in html_content
            }

            for tech, found in patterns.items():
                status = "✅" if found else "❌"
                print(f"{status} {tech}: {'Found' if found else 'Not detected'}")

            # Close browser
            browser.close()

            return True

    except ImportError:
        print("❌ Playwright not available, trying alternative method...")
        return False
    except Exception as e:
        print(f"❌ Error with Playwright: {e}")
        return False

def test_with_requests():
    """Fallback testing using requests to analyze HTML content"""
    try:
        import requests
        from bs4 import BeautifulSoup

        print("🔍 Analyzing HTML content with requests...")

        response = requests.get("http://localhost:5173")
        soup = BeautifulSoup(response.content, 'html.parser')

        # Analyze HTML structure
        print(f"📄 Page Title: {soup.title.string if soup.title else 'No title'}")
        print(f"📊 HTML Elements:")

        # Count common elements
        elements = {
            "Scripts": len(soup.find_all('script')),
            "Stylesheets": len(soup.find_all('link', rel='stylesheet')),
            "Meta tags": len(soup.find_all('meta')),
            "Divs": len(soup.find_all('div')),
            "Forms": len(soup.find_all('form')),
            "Buttons": len(soup.find_all('button')),
            "Inputs": len(soup.find_all('input'))
        }

        for element, count in elements.items():
            print(f"  {element}: {count}")

        # Check for React app indicators
        root_div = soup.find('div', id='root')
        if root_div:
            print("✅ React root div found")

        # Look for external dependencies
        scripts = soup.find_all('script', src=True)
        for script in scripts:
            src = script.get('src')
            if src:
                print(f"📦 Script: {src}")

        return True

    except Exception as e:
        print(f"❌ Error with requests analysis: {e}")
        return False

def main():
    """Main testing function"""
    print("=" * 60)
    print("🎨 LIVE VISUAL UI/UX TESTING - CLINIC MANAGEMENT APP")
    print("=" * 60)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Target URL: http://localhost:5173")
    print("")

    # Try Playwright first, fall back to requests
    success = test_with_playwright()

    if not success:
        print("\n🔄 Falling back to HTML content analysis...")
        test_with_requests()

    print("\n" + "=" * 60)
    print("✅ UI/UX Testing Completed!")
    print("📁 Screenshots saved in: ./screenshots/")
    print("=" * 60)

if __name__ == "__main__":
    main()