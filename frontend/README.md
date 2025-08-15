# React + Tailwind CSS Project

A modern React application built with TypeScript and Tailwind CSS for beautiful, responsive designs.

## Features

- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for utility-first styling
- 📱 Responsive design
- 🚀 Modern development setup
- 🔧 PostCSS and Autoprefixer

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm start
```

The app will open in your browser at [http://localhost:3000](http://localhost:3000).

### Building for Production

Create a production build:
```bash
npm run build
```

### Testing

Run the test suite:
```bash
npm test
```

## Project Structure

```
src/
├── App.tsx          # Main application component
├── App.css          # App-specific styles (minimal)
├── index.tsx        # Application entry point
├── index.css        # Global styles with Tailwind directives
└── ...
```

## Tailwind CSS

This project uses Tailwind CSS for styling. The configuration is in `tailwind.config.js` and includes:

- Content paths for React components
- PostCSS configuration
- Autoprefixer for cross-browser compatibility

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

## Learn More

- [React Documentation](https://reactjs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## License

This project is open source and available under the [MIT License](LICENSE).
