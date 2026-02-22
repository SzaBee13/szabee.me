# SzaBee.me - Personal Portfolio

A modern, responsive portfolio website built with React, TypeScript, and Vite. Features a clean design with light/dark theme support and real-time music integration via Last.fm.

## 🚀 Features

- **Responsive Design** - Fully optimized for mobile, tablet, and desktop
- **Theme Toggle** - Light/dark mode with localStorage persistence
- **Now Playing** - Real-time Last.fm integration showing currently playing music
- **Project Showcase** - Displays personal and class projects with links
- **Skills Section** - Visual representation of technical skills with SVG icons
- **Social Links** - Easy access to GitHub, YouTube, Twitch, Discord, Docker Hub, and email
- **Fast Performance** - Built with Vite for lightning-fast development and optimized builds

## 🛠️ Technologies

- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Last.fm API** - Music integration

## 📁 Project Structure

```bash
szabee.me/
├── public/
│   ├── icons/              # SVG icons for skills
│   ├── .well-known/        # Discord & security verification
│   ├── robots.txt
│   └── security-policy.html
├── src/
│   ├── components/
│   │   ├── About.tsx
│   │   ├── ClassProjects.tsx
│   │   ├── HeroSection.tsx
│   │   ├── Navbar.tsx
│   │   ├── NowPlaying.tsx
│   │   ├── Projects.tsx
│   │   ├── Skills.tsx
│   │   └── Socials.tsx
│   ├── hooks/
│   │   └── useTheme.ts     # Theme management hook
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🔧 Setup & Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/SzaBee13/szabee.me.git
   cd szabee.me
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open in browser**

   ```plaintext
   http://localhost:5173
   ```

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🌐 Deployment

The project can be deployed to various platforms:

- **Vercel** - `vercel deploy`
- **Netlify** - Drag & drop the `dist` folder
- **GitHub Pages** - Build and push `dist` to `gh-pages` branch

Build output is generated in the `dist/` directory.

## 🎨 Customization

### Theme Colors

Edit theme colors in component files or extend Tailwind configuration in `tailwind.config.js`.

### Last.fm Integration

The NowPlaying component fetches from Last.fm API. Update the username in `NowPlaying.tsx` to customize.

### Projects

Add or modify projects in `Projects.tsx` and `ClassProjects.tsx` by editing the project arrays.

## 📝 License

This project is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).

You are free to use, share, and adapt this work as long as you provide appropriate attribution.
