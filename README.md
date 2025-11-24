<!-- <p align="center">
<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/public/logo192.png" width="128px" />
</p> -->

# 📝React.js Todo App

<p align="center"><i>A fast and modern Todo app built with React, featuring task sharing via link, P2P Task Sync with WebRTC, theme customization, offline usage as a PWA, and caching for smooth performance.</i></p>

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/baner.png" />

## [https://react-cool-todo-app.netlify.app/](https://react-cool-todo-app.netlify.app/)

[![Netlify Status](https://api.netlify.com/api/v1/badges/e3b07d34-f0da-4280-9076-fd40eea893c6/deploy-status)](https://app.netlify.com/sites/react-cool-todo-app/deploys)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/maciekt07/TodoApp?color=%23b624ff)
![GitHub created at ](https://img.shields.io/github/created-at/maciekt07/TodoApp?color=%23b624ff)
![GitHub last commit](https://img.shields.io/github/last-commit/maciekt07/TodoApp?color=%23b624ff)

<!-- <p align="center">
<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/iPhone%20Mockup%20black.png" width="400px" />
</p> -->

## 💻 Tech Stack

<ul style="display: flex; flex-direction: column; gap:10px;">
  <li style="vertical-align: middle;">
    <img src="https://go-skill-icons.vercel.app/api/icons?i=react" alt="react" width="24" style="vertical-align: middle; margin-right: 4px;" /> React
  </li>
    <li style="vertical-align: middle;">
    <img src="https://go-skill-icons.vercel.app/api/icons?i=typescript" alt="typescript" width="20" style="vertical-align: middle;margin-right: 4px;" /> Typescript
  </li>
    <li style="vertical-align: middle;">
    <img src="https://go-skill-icons.vercel.app/api/icons?i=vite" alt="vite" width="24" style="vertical-align: middle;margin-right: 4px;" /> Vite
  </li>
  <li style="vertical-align: middle;">
    <img src="https://go-skill-icons.vercel.app/api/icons?i=vitest" alt="vitest" width="24" style="vertical-align: middle;margin-right: 4px;" /> Vitest
  </li>
  <li style="vertical-align: middle;">
    <img src="https://go-skill-icons.vercel.app/api/icons?i=emotion" alt="emotion" width="24" style="vertical-align: middle;margin-right: 4px;" /> Emotion
  </li>
    <li style="vertical-align: middle;">
    <img src="https://go-skill-icons.vercel.app/api/icons?i=mui" alt="mui" width="24" style="vertical-align: middle;margin-right: 4px;" /> Material UI (MUI)
  </li>
</ul>

## ⚡ Features

### 🔗 Share Tasks by Link or QR Code

Easily share your tasks with others using a link or QR code.

**[Example Link](https://react-cool-todo-app.netlify.app/share?task=N4IgJg9gdgpiBcAzAhgGwM4wDQgA4EspYwEAXAJwFdsQpkBbOeEAdRgCN19SYACAERgA3GKgi5GUUiBxgY6AMbl8uUvmgIQAYXIxkPXsl6pkUMIQDmvXMgt8A7twAWvAEp6FpAHQArdL0QIcl4FVHwYKS9eJ1JSXHR4AHpE+1SvAE8ISlJKdhgvBQh6FP0FJwB+IQBedgBZAGsoRABpAA0ASQAxAEEADgAyUiqAJgBmdH7kdgB9MtNYVCrEXRgtCDktBlwvIIsZEBh6CB98TQBGRABOMDOAWgvRxAVb4YAGV7B7xAAWdnZ9wpiciaADE7AAbMNvohEPswPomCA3sMAKy3V7fF6vAAqrzO8DOl3gr3BXleAHZRgAtOF6MBhWCaZFojEvUa4-FnXrE15k940nAKBEWILpBAAbVA+BIzFew0uwwU7GQaMQ4Jgw1u3zOCkx7BRyHJtwUKMuyFeyGQMAUiBgo32dEYmhYQXq+0Ox1OzAeGoBECBoKhvRgMJAAF8sFKZWdwb1yWdUdryd9waMyaMcI7EWtzFA9jgPSdzogDaqYK9YYL-UFQeCbsNQ2GALo4EzoUgAZWQIiZcpZmLeHPgb3go15oxR1PDQA&userName=Maciej)**

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/ShareDialog.png" width="300px" alt="Shared Task" />

### 🤖 AI Emoji Suggestions

This feature uses Chrome’s experimental `window.LanguageModel` API powered by **Gemini Nano** — an on-device LLM.

⚠️ Requires **Chrome Canary 128+** with the **Gemini Nano model installed** - [Setup guide](https://docs.google.com/document/d/1VG8HIyz361zGduWgNG7R_R8Xkv0OOJ8b5C9QKeCjU0c/view?pli=1&tab=t.0#heading=h.witohboigk0o)

Code: [src/components/EmojiPicker.tsx](https://github.com/maciekt07/TodoApp/blob/main/src/components/EmojiPicker.tsx#L116)

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/emoji-ai.gif" alt="AI Emoji" width="360px" style="border-radius:12px" />

### 🔄 P2P Task Sync with WebRTC

Securely sync all the data between devices using peer-to-peer WebRTC connections. Devices pair via QR code, and your data is transferred directly between them — only minimal server involvement for connection setup, with no data stored or processed in the cloud.

- Tasks and categories are auto-merged based on recent edits or deletions
- For settings and other data, you choose which device to sync from

<video src="https://github-production-user-asset-6210df.s3.amazonaws.com/85953204/459582059-1f2fd620-a64e-42e2-be4f-f17e07fba9a2.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250626%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250626T185723Z&X-Amz-Expires=300&X-Amz-Signature=514e1513d883fab2b5b895d9075d0e0a522497e600e2577d1d11a341ab95aa6f&X-Amz-SignedHeaders=host" controls></video>

### 🎨 Color Themes & Dark Mode

Choose from various color themes and toggle between light and dark modes to suit your preferences.

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/settings.png" width="500px" />

### 🗣️ Task Reading Aloud

Option to have tasks read aloud using the native `SpeechSynthesis` API, with a selection of voices to choose from.

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/ReadAloud.png" width="260px" alt="Task Reading Aloud" />

### 📥 Import/Export Tasks

Users can import and export tasks to/from JSON files. This feature allows users to back up their tasks or transfer them to other devices easily. [Example Import File](https://github.com/maciekt07/TodoApp/blob/main/example-import.json)

### 📴 Progressive Web App (PWA)

This app is a Progressive Web App (PWA), which means it can be installed on your device, **used even when you're offline** and behave like a native app with shortcuts and app badges.

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/pwaTaskBar.png" alt="taskbar" width="260px" />

### 🔄 Update Prompt

The app features a custom update prompt that notifies users when a new version is available, allowing for easy refresh to access the latest improvements.

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/UpdatePrompt.png" alt="update prompt" width="260px" />

### 📱 Custom Splash Screens

The app automatically generates custom splash screens from a single HTML template for various iOS and iPadOS devices in both light and dark modes. These splash screens provide a smooth, native-like launch experience when the app is opened as a PWA.

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/SplashScreen.png" alt="Splash Screen Example" width="450px" />

To generate splash screens:

```bash
npm run generate-splash
```

Code: [scripts/splash-screens](https://github.com/maciekt07/TodoApp/blob/main/scripts/splash-screens)

## 👨‍💻 Installation

To install and run the project locally, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/maciekt07/TodoApp.git
```

2. Navigate to the project directory:

```bash
cd TodoApp
```

3. Install the dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

The app will now be running at [http://localhost:5173/](http://localhost:5173/).

> [!TIP]
> For mobile device testing, use `npm run dev:host` to preview the app on your local network with HTTPS (required for camera features) and a QR code in the terminal for quick access. To enable PWA features in development, see [vite.config.ts](vite.config.ts).

## 🏗️ Production Build

Build the app for production using the comprehensive build script powered by Bun.js:

```bash
# Standard production build with all checks
bun run build:prod

# Build with detailed bundle analysis
bun run build:prod:analyze

# Fast build (skip linting and type checking)
bun run build:prod:fast
```

The production build includes:

- TypeScript type checking
- ESLint validation
- Optimized Vite build with tree shaking and minification
- Chunk splitting for optimal loading
- PWA service worker generation
- Bundle size analysis and reporting

For detailed documentation, see [BUILD.md](BUILD.md).

### Manual Build Options

The build script supports various options:

```bash
./build-production.sh --help           # Show all options
./build-production.sh --verbose        # Detailed output
./build-production.sh --analyze        # Generate analysis report
./build-production.sh --clean-install  # Clean install before build
```

After building, preview the production build locally:

```bash
bun run preview
```

## 🌐 Deployment on Vercel

This app includes a backend API for secure task synchronization with zero-knowledge encryption. The backend is integrated as Vercel serverless functions, allowing for easy deployment under a single domain.

### Prerequisites

- A PostgreSQL database (e.g., from [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Supabase](https://supabase.com/), or [Neon](https://neon.tech/))
- A Vercel account

### Deployment Steps

1. **Fork or clone this repository**

2. **Import the project to Vercel:**

   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your repository

3. **Configure environment variables in Vercel:**

   - `DATABASE_URL`: Your PostgreSQL connection string with SSL
     ```
     postgresql://user:password@host:5432/database?sslmode=require
     ```
   - `NODE_ENV`: Set to `production`

4. **Deploy:**
   - Vercel will automatically build and deploy your app
   - The frontend will be served from the root domain
   - The API will be available at `/api/t/:uid`

### Features

- **Zero-Knowledge Encryption**: The server never has access to decrypted user data
- **Auto-Registration**: Users are automatically registered on first sync
- **Same-Origin API**: No CORS configuration needed
- **Serverless Architecture**: Automatically scales with usage
- **PostgreSQL Storage**: Reliable and scalable data persistence

### Local Development with Backend

To run the full stack locally:

1. Set up a PostgreSQL database locally or use a cloud provider

2. Create a `.env` file in the project root:

   ```env
   DATABASE_URL=postgresql://localhost:5432/todo_sync
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

The Vite dev server will proxy API requests to your backend.

## 📷 Screenshots

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/ss1.png" width="300px" />
<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/ss2.png" width="300px" />

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/ss3.png" width="300px" />

<!-- <img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/ss4.png" width="300px" />

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/ss5.png" width="300px" />

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/ss6.png" width="300px" /> -->

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/sspc1.png" width="650px" />

## 🚀 Performance

<img src="https://raw.githubusercontent.com/maciekt07/TodoApp/main/screenshots/performance.png" width="600px" />

## Credits

Made with ❤️ by [maciekt07](https://github.com/maciekt07), licensed under [MIT](https://github.com/maciekt07/TodoApp/blob/main/LICENSE).
