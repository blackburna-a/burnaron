# burnaron.com

Personal portfolio website for Aron Blackburn, built to present my background across fraud operations, responsible gambling, customer support, technical support, and operational problem-solving.

**Live site:** [https://burnaron.com](https://burnaron.com)

## Overview

This website is designed as a professional, recruiter-friendly, and team-focused portfolio. It presents my experience in regulated operations, customer-facing support, fraud and risk review, responsible gambling, and practical technical learning.

The goal is to make my background easy to scan, easy to verify, and clearer than a traditional CV alone.

## Focus Areas

- Fraud operations and account review
- Responsible gambling and customer protection
- Customer support in regulated environments
- AML-aware support and escalation judgement
- Technical support mindset
- Documentation, troubleshooting, and operational clarity
- Practical self-hosting and systems curiosity

## Features

### Portfolio Experience

- Responsive static portfolio built with HTML, CSS, and JavaScript
- Cyber/HUD-inspired visual interface with layered grid, glow, scanline, and console styling
- Short logo preloader with a subtle kinetic grid that runs only on first entry during a browser-tab visit
- Light-mode aware intro skip button with readable contrast and clear hover/focus states
- Section-reveal moments that keep animations smooth without blocking normal browsing for long
- Progressive section reveals triggered by wheel, touch, keyboard, or progress-rail interaction
- Fast slide-up section transitions with smooth first-view card animations
- Right-edge scroll/reveal progress rail with animated dots and downward chevrons
- Progress rail support across desktop, tablet, mobile, and short landscape layouts
- Cross-page light/dark theme toggle with saved visitor preference
- First-visit theme-toggle hint with a subtle diagonal light/dark split and gentle button pulse
- Reduced-motion aware theme hint behaviour
- Homepage section hamburger navigation with outside-click and Escape-key closing
- Secondary mobile page-navigation menu labelled `Pages`
- Mobile page navigation for Home, Projects, Fraud/AML Case, and RG Case
- Desktop page navigation that stays inline on wider layouts
- Menu state handling with `aria-expanded`, `aria-controls`, outside-click closing, Escape-key closing, and overlap prevention between menus
- Current-page navigation state that is greyed out, non-clickable, and marked with `aria-current`
- Reduced-motion support for visitors who prefer less animation
- Skip links and keyboard-friendly modal/navigation behaviour

### Homepage Content

- Hero/profile positioning
- About section
- Relevant experience summary
- Core strengths
- Practical project preview cards
- Development direction section
- Personal edge section
- Contact and CV access
- Recruiter-friendly structure designed to be easier to scan than a traditional CV alone

### Contact And CV

- Contact composer modal with name, email, subject, and message fields
- Native email-client handoff using a generated `mailto:` draft
- Return confirmation after email handoff
- Missing-field validation with warning sound
- Direct copy-email buttons
- Clipboard-aware copy logic that checks the current clipboard value before writing
- Bottom-screen toast confirmation for copied email
- Already-copied toast state when the email is already the latest clipboard text
- CV viewer modal with image/document support
- Open-in-new-tab fallback for the CV
- Focus trapping, focus return, backdrop close, close button, and Escape-key close for modal dialogs

### Audio And Interaction Cues

- Background audio toggle
- Remembered mute preference
- Interface click sounds for primary interactions, project links, project detail controls, and navigation-style controls
- Dedicated close sound for modal dismissal
- Dedicated validation warning sound for missing email fields
- Audio handling designed to degrade gracefully when autoplay or browser policy blocks playback

### Projects Page

- Dedicated Projects page for practical tools and technical experiments
- Project carousel for `burnaron.com`, Wolt Discount Finder, SearXNG Local Search, and DeepSeek Local AI Model
- One selected project shown at a time with adjacent preview cards, carousel dots, Previous/Next controls, and keyboard navigation
- Operational context panels explaining the purpose, thinking, and practical value of each project
- Animated burnaron.com card showing page scrolling and restart behaviour
- Wolt Discount Finder preview using a local Wolt-style Malta background template and extension screenshot
- Wolt-only external project action linking to the Wolt Discount Finder Firefox Add-on
- SearXNG Local Search preview using a local screenshot
- DeepSeek Local AI Model preview using a local screenshot
- Expandable project detail modal with title, screenshot, description, focus chips, operational note, and optional external action
- Project detail modals without dead-end buttons for projects that do not have a live destination
- Top-right close button, backdrop close, Escape close, focus trap, focus return, and scroll lock for the project detail modal
- Lazy-loaded project preview images

### Fraud/AML Case Page

- Dedicated fictional Fraud/AML case walkthrough
- Six-step alert-to-action flow with clickable timeline steps and keyboard-friendly controls
- Active step panel showing signal, checks, reasoning, authority, and output
- Animated representative investigation workstation
- Queue, account, device/network/link, query, payment, notes, and outcome panels
- Previous, Next, and Replay Flow controls
- Evidence-based outcome cards covering release, verification, restriction, closure, and AML/Compliance escalation
- Summary section explaining the operational judgement demonstrated by the case

### Responsible Gambling Case Page

- Dedicated fictional Responsible Gambling case walkthrough
- Six-step customer-protection flow covering deposit escalation, restriction, contact, conversation, concern identification, and protective action
- Active step panel showing signal, checks, reasoning, authority, and output
- Animated customer interaction workspace
- Customer profile, email, chat, phone, concern-indicator, case-note, support-note, and account-action panels
- Previous, Next, and Replay Flow controls
- Outcome cards covering no concern identified, soft intervention, limit applied, timeout/exclusion, and escalation
- Summary section explaining the customer-protection judgement demonstrated by the case

### Technical And Deployment

- No build system or framework required
- Split CSS architecture for base layout, theme, modals, boot animation, reduced motion, performance, dividers, and case pages
- Static GitHub Pages deployment
- Custom domain through `CNAME`
- Custom favicon set, Apple touch icon, Android icons, Open Graph image, web manifest, robots file, and sitemap
- Custom local image and audio assets
- Static company logos and brand/tool icons
- Privacy-focused, cookie-free Cloudflare Web Analytics beacon for aggregate traffic understanding
- Custom 404 page
- Email handoff return page

## Project Sections

The site includes:

- Hero and profile positioning
- About
- Relevant experience
- Core strengths
- Homepage project preview
- Dedicated projects, tools, and technical experiments
- Development direction
- Personal edge
- Contact
- CV viewer
- Fraud/AML case walkthrough
- Fictional investigation workstation and decision outcomes
- Responsible Gambling case walkthrough
- Fictional customer interaction workspace and protective-action outcomes

## Tech Stack

- HTML
- CSS
- JavaScript
- GitHub Pages
- Custom image and audio assets

No build system or framework is required. The site is intentionally static, lightweight, and easy to deploy.

## File Structure

```text
.
|-- assets/
|   |-- audio/
|   |   |-- beep_warning.mp3
|   |   |-- clean-hud-idle.wav
|   |   |-- click.mp3
|   |   `-- click-close.mp3
|   |-- brand-icons/
|   |   |-- atlassian-original.png
|   |   |-- cpp.svg
|   |   |-- deepseek-original.png
|   |   |-- excel-original.png
|   |   |-- html.svg
|   |   |-- hyperv-original.png
|   |   |-- java.svg
|   |   |-- python.svg
|   |   |-- slack-original.png
|   |   `-- tools-stack-supplied.png
|   |-- company-logos/
|   |   |-- abtran.png
|   |   |-- bet365.svg
|   |   |-- flutter-entertainment.svg
|   |   `-- hse.png
|   |-- project-previews/
|   |   |-- deepseek-local-ai-preview.jpg
|   |   |-- searxng-preview.jpg
|   |   |-- wolt-discount-finder-preview.png
|   |   `-- wolt-malta-template.png
|   |-- android-chrome-192x192.png
|   |-- android-chrome-512x512.png
|   |-- apple-touch-icon.png
|   |-- aron-blackburn-cv.png
|   |-- brand-monogram-source.png
|   |-- favicon-16x16.png
|   |-- favicon-32x32.png
|   |-- favicon-48x48.png
|   |-- og-image.png
|   `-- og-image-source.png
|-- css/
|   |-- base.css
|   |-- boot.css
|   |-- case-pages.css
|   |-- modals.css
|   |-- performance.css
|   |-- reduced-motion.css
|   |-- rg-case.css
|   |-- section-dividers.css
|   |-- theme-light.css
|   `-- theme-cyber-risk-console.css
|-- 404.html
|-- CNAME
|-- email-handoff.html
|-- favicon.ico
|-- fraud-case.html
|-- index.html
|-- projects.html
|-- README.md
|-- rg-case.html
|-- robots.txt
|-- script.js
|-- sitemap.xml
|-- site.webmanifest
`-- styles.css
```

## Deployment

The site is deployed through GitHub Pages and connected to the custom domain:

[burnaron.com](https://burnaron.com)

## Purpose

This portfolio is not only a visual CV. It is also a practical example of how I approach information structure, user flow, documentation, troubleshooting, and operational communication.

The same principles used throughout this site - clarity, context, reduced friction, and structured presentation - are the principles I aim to bring into support, risk, fraud, responsible gambling, and operations teams.
