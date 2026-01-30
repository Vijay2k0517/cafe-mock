# Isai - The Art Café Website

A sophisticated, highly animated static Next.js website for Isai classical art-café. Built with Next.js 14, TailwindCSS, and featuring scroll-triggered animations, parallax effects, and responsive design.

## ✨ Features

### Core Pages
- **Home**: Hero section, About snippet, Opening Hours Bento Grid, Menu Ticker
- **About**: Split text reveal animations, story sections with scroll effects
- **Menu**: Three categorized sections (Breakfast, Beverages, Munches) with modal details
- **Events**: WhatsApp-integrated booking form with file upload
- **Blog**: Instagram feed integration, blog posts with social sharing
- **Contact**: Interactive contact form, map integration, social links

### Key Highlights
- 🎨 **Sophisticated Animations**: Intersection Observer scroll triggers, parallax backgrounds
- 📱 **Fully Responsive**: Mobile-first design with Tailwind CSS
- 🎵 **Classical Theme**: Playfair Display font, #EFC1A9 color palette, music-inspired design
- 🍽️ **Interactive Menu**: Clickable items with detailed modals, categorized display
- 📞 **WhatsApp Integration**: Direct booking and contact functionality
- 🌟 **Opening Hours Bento Grid**: Complex asymmetric layout with staggered animations
- 📧 **Contact Forms**: Email integration and WhatsApp contact options
- 📱 **Social Integration**: Instagram feed, YouTube embeds, social sharing

## 🚀 Quick Start

### Development
```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Open http://localhost:3000
```

### Production Build
```bash
# Build for production
yarn build

# The static files will be in the 'out' directory
```

### Static Export
This site is configured for static export. After building:
```bash
# The 'out' directory contains the complete static site
# Deploy the 'out' folder to any static hosting service
```

## 📁 Project Structure

```
isai-cafe/
├── app/
│   ├── page.js           # Home page
│   ├── about/page.js     # About page
│   ├── menu/page.js      # Menu page
│   ├── events/page.js    # Events & booking page
│   ├── blog/page.js      # Blog & Instagram feed
│   ├── contact/page.js   # Contact page
│   ├── layout.js         # Root layout
│   └── globals.css       # Global styles
├── components/ui/        # Shadcn components
├── lib/                  # Utilities
├── public/              # Static assets
└── out/                 # Built static site (after build)
```

## 🎨 Design System

### Colors
- **Primary**: #EFC1A9 (Isai brand color)
- **Cream**: #F5F5DC (Complementary warm tone)
- **Warm**: #E8DCC6 (Secondary warm tone)

### Typography
- **Headings**: Playfair Display (Google Fonts)
- **Body**: Inter (Google Fonts)

### Animations
- **Entrance animations**: Intersection Observer triggered
- **Parallax backgrounds**: Scroll-based transform
- **Bento Grid**: Staggered card animations with bounce easing
- **Menu Ticker**: CSS animations with hover pause

## 🔧 Configuration

### Environment Variables
No environment variables required for basic functionality. The site works completely static.

### WhatsApp Integration
Update phone numbers in the following files:
- `/app/app/events/page.js` - Event booking WhatsApp number
- `/app/app/contact/page.js` - Contact WhatsApp number

Current placeholder: `919876543210`

### Instagram Integration
Currently shows mock Instagram feed. To integrate real Instagram:
1. Set up Instagram Basic Display API
2. Replace mock data in `/app/app/blog/page.js`
3. Add Instagram API credentials

### YouTube Integration
Currently shows placeholder YouTube embeds. Update embed URLs in footer and social sections.

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Responsive Features
- Adaptive navigation
- Flexible bento grid layout
- Responsive typography
- Touch-friendly interactions

## ⚡ Performance Features

- **Static Export**: No server required, deploy anywhere
- **Image Optimization**: Next.js Image component with optimization
- **Code Splitting**: Automatic by Next.js
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Intersection Observer**: Efficient scroll animations
- **Lazy Loading**: Images and components load on demand

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
# Push to GitHub and connect to Vercel
# Vercel will automatically detect Next.js and deploy
```

### Netlify
```bash
# Build command: yarn build
# Publish directory: out
```

### Traditional Web Hosting
```bash
# Upload the 'out' directory to your web server
# Works with any static hosting service
```

### GitHub Pages
```bash
# Deploy the 'out' directory to gh-pages branch
```

## 🎯 Browser Support

- **Modern browsers**: Full support (Chrome 88+, Firefox 85+, Safari 14+)
- **Older browsers**: Graceful degradation
- **Mobile browsers**: Full responsive support

## 🔧 Customization

### Colors
Update colors in `tailwind.config.js`:
```js
colors: {
  'isai-primary': '#EFC1A9',  // Your brand color
  'isai-cream': '#F5F5DC',    // Complementary color
}
```

### Fonts
Update fonts in `app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap');
```

### Content
- Update menu items in `/app/app/menu/page.js`
- Update blog posts in `/app/app/blog/page.js`
- Update opening hours in `/app/app/page.js`
- Update contact information across all pages

## 📞 Contact Information Setup

Current placeholder information used throughout:
- **Phone**: +91 98765 43210
- **Email**: hello@isai.cafe
- **Address**: 123 Art Street, Music District, Chennai
- **Social**: @isai.cafe (Instagram)

Update these in all component files to match your actual details.

## 🎵 Classical Music Integration

The site is designed around classical music themes:
- Playfair Display font for elegant typography
- Warm color palette inspired by classical venues
- Music-themed iconography and content
- Classical instrument imagery
- Harmonious layout proportions

## 📄 License

This project is created for Isai Art Café. All rights reserved.

## 🤝 Support

For technical support or customizations, please contact the development team.

---

Built with ❤️ for Isai - Where music and home blend into one.