# 🚀 AI Code Review Assistant - Frontend

A modern React frontend application for an AI-powered code review platform. This is the user interface component that provides a clean, intuitive experience for developers to manage their code analysis workflows.

## ✨ Features

- 🎨 **Modern UI/UX** - Clean, responsive design built with Tailwind CSS
- 🔐 **Authentication System** - Demo login/signup with local storage
- 📊 **Dashboard** - User-friendly analytics and repository management interface
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Fast Development** - Built with Vite for lightning-fast hot reload
- 🎯 **Component-Based** - Modular React components for easy maintenance

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client (ready for API integration)
- **Firebase** - Authentication and backend services (ready for integration)

### Development Tools
- **ESLint** - Code linting and quality checks
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd OperationCodeRabbit
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.jsx    # Main dashboard with analytics
│   ├── HomePage.jsx     # Landing page
│   ├── LoginPage.jsx    # Authentication page
│   ├── Navbar.jsx       # Navigation component
│   └── SignupPage.jsx   # User registration
├── contexts/            # React contexts
│   └── AuthContext.jsx  # Authentication state management
├── App.jsx              # Main application component
├── main.jsx             # Application entry point
└── index.css            # Global styles
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔐 Demo Authentication

The application includes a demo authentication system with the following test accounts:

| Email | Password | Name |
|-------|----------|------|
| demo@example.com | demo123 | Demo User |
| neha@example.com | neha123 | Neha Chaudhari |
| kedhar@example.com | kedhar123 | Kedhar Phanindra |

## 🎨 UI Components

### Homepage
- Hero section with feature highlights
- Call-to-action buttons
- Feature showcase cards
- Modern gradient design

### Authentication
- Clean login/signup forms
- Form validation
- Error handling
- Responsive design

### Dashboard
- User welcome section
- Analytics cards (Connected Repos, Analyses, Issues, Quality Score)
- Repository management interface
- Recent analyses section
- Demo mode notice

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS with a custom configuration. Key features:
- Custom color palette
- Responsive breakpoints
- Component utilities
- Dark mode ready

### Vite Configuration
- React plugin enabled
- Hot module replacement
- Optimized builds
- Development server with fast refresh

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🔮 Future Enhancements

This frontend is designed to integrate with backend services for:
- Real GitHub repository connections
- Live code analysis results
- User authentication with OAuth
- Real-time notifications
- Advanced analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Neha Chaudhari** - Backend Developer & Technical Lead
- **Kedhar Phanindra Sai Gurram** - Frontend Developer & UX Lead

---

**Built with ❤️ using React, Vite, and Tailwind CSS**