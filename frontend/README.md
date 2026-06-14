# Meroos Educational Platform - Frontend

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB.svg?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF.svg?logo=vite" />
  <img src="https://img.shields.io/badge/React_Router-7.13-CA4245.svg?logo=reactrouter" />
</p>

A modern, responsive educational platform frontend built with React 19, TypeScript, and Vite. Features real-time quizzes, resource management, analytics dashboards, and role-based interfaces for students and teachers.

---

## ✨ Features

### 🎓 **Student Features**
- Interactive quiz taking with multiple question types
- Real-time Kahoot-style multiplayer quizzes
- Personal dashboard with statistics and progress tracking
- Resource library with videos, PDFs, and documents
- News and announcements feed
- Leaderboards and rankings
- Profile management with avatar support

### 👩‍🏫 **Teacher Features**
- Quiz creation and management
- Host live Kahoot-style quiz sessions
- Class statistics and student performance analytics
- Student management and progress tracking
- Resource uploading and organization
- News post creation and management

### 🎮 **Real-time Features**
- Live Kahoot-style multiplayer quizzes
- WebSocket-based real-time communication
- Live leaderboards during games
- Dynamic participant management

### 🎨 **UI/UX**
- Modern, responsive design
- Dark mode support
- Glassmorphism and smooth animations
- Mobile-friendly interface

---

## 🏗️ Project Structure

```
meroos-frontend/
├── src/
│   ├── assets/           # Static assets (images, icons)
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React context providers (Auth, Theme)
│   ├── pages/            # Page components
│   │   ├── auth/         # Login, Register pages
│   │   ├── dashboard/    # Student & Admin dashboards
│   │   ├── kahoot/       # Kahoot game pages
│   │   ├── leaderboard/  # Leaderboard pages
│   │   ├── news/         # News list, detail, form pages
│   │   ├── profile/      # User profile pages
│   │   ├── quizzes/      # Quiz list, detail, take pages
│   │   ├── resources/    # Resource library pages
│   │   └── teacher/      # Teacher-specific pages
│   ├── services/         # API service modules
│   │   ├── api.ts        # Axios configuration
│   │   ├── authService.ts
│   │   ├── quizService.ts
│   │   ├── resourceService.ts
│   │   ├── newsService.ts
│   │   ├── analyticsService.ts
│   │   └── ...
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main app with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Public static files
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn**
- Backend server running (see [meroos-backend](https://github.com/OrifjonKenjayev/meroos-backend))

### Installation

```bash
# Navigate to frontend directory
cd meroos-frontend

# Install dependencies
npm install

# Create environment file (optional)
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality checks |

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19.2 |
| **Language** | TypeScript 5.9 |
| **Build Tool** | Vite 7.2 |
| **Routing** | React Router 7.13 |
| **HTTP Client** | Axios 1.13 |
| **Styling** | CSS with custom properties |
| **Linting** | ESLint 9 |

---

## 🔌 API Integration

The frontend communicates with the backend through RESTful APIs and WebSockets:

### REST APIs
- **Authentication**: Login, register, token refresh
- **Quizzes**: CRUD operations, attempt management
- **Resources**: Upload, list, categorize
- **News**: Posts, comments, categories
- **Analytics**: Statistics, leaderboards

### WebSocket
- **Kahoot Games**: Real-time quiz sessions at `/ws/kahoot/{room_code}/`

---

## 🔐 Authentication

The app uses JWT (JSON Web Token) authentication:
- Access tokens stored in localStorage
- Automatic token refresh on expiration
- Protected routes with role-based access
- Auth context for global state management

### User Roles
- **Student**: Access to quizzes, resources, personal stats
- **Teacher**: Additional access to create content, view class stats
- **Admin**: Full platform access

---

## 📱 Responsive Design

The application is fully responsive and optimized for:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1440px+)

---

## 🧪 Development

### Code Style
- ESLint with React and TypeScript rules
- React Hooks best practices
- Component-based architecture

### File Naming Conventions
- Components: `PascalCase.tsx`
- Services: `camelCase.ts`
- Types: `camelCase.ts`
- Styles: `PascalCase.css` or `index.css`

---

## 🚢 Production Build

```bash
# Create optimized production build
npm run build

# Preview the production build
npm run preview
```

The build output will be in the `dist/` directory, ready for deployment.

### Deployment Options
- **Static Hosting**: Vercel, Netlify, GitHub Pages
- **Cloud**: AWS S3 + CloudFront, Google Cloud Storage
- **Traditional**: Nginx, Apache

---

## 🔗 Related

- [Backend Repository](https://github.com/OrifjonKenjayev/meroos-backend/blob/main/README.md) - Django REST API 
https://github.com/OrifjonKenjayev/meroos-backend
- [API Documentation](https://github.com/OrifjonKenjayev/meroos-backend/blob/main/API_DOCUMENTATION.md) - Complete API reference


---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">Made with ❤️ for Education</p>
