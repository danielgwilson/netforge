# NetForge: Advanced Network Reconnaissance & Troubleshooting Toolkit

NetForge is a modern, TypeScript-based CLI tool for network reconnaissance and troubleshooting. Built with scalability and extensibility in mind, it provides robust subdomain enumeration and network path analysis capabilities.

## 🚀 Features

- **Multi-source Subdomain Discovery**
  - Certificate Transparency logs (crt.sh)
  - Rapid7's Project Sonar
  - Configurable concurrent operations
  - Automatic DNS resolution and verification

- **Network Analysis**
  - Path tracing with MTR-style output
  - Concurrent host verification
  - Detailed network metrics

- **Modern Architecture**
  - Full TypeScript support
  - Modular design
  - Comprehensive error handling
  - Extensive test coverage
  - Configuration management
  - Dependency injection for testing

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/netforge.git
cd netforge

# Install dependencies
npm install

# Build the project
npm run build

# Optional: Install globally
npm install -g .
```

## 🛠️ Usage

### Subdomain Enumeration

```bash
# Basic enumeration
netforge enumerate --domain example.com

# With custom threads
netforge enumerate --domain example.com --threads 20

# Output as JSON
netforge enumerate --domain example.com --json
```

### Network Path Analysis

```bash
# Trace route to host
netforge trace --target google.com

# Custom packet count
netforge trace --target google.com --count 100
```

## ⚙️ Configuration

NetForge can be configured via environment variables or a `.env` file:

```env
# Network settings
DEFAULT_TIMEOUT=5000
DEFAULT_RETRIES=3
DEFAULT_THREADS=10

# DNS settings
DNS_SERVERS=8.8.8.8,8.8.4.4

# Feature flags
ENABLE_BRUTE_FORCE=false

# Logging
LOG_LEVEL=info
```

## 🧪 Development

### Project Structure

```
src/
├── commands/      # CLI command implementations
├── scanners/      # Core scanning implementations
├── services/      # Business logic services
├── utils/         # Shared utilities
└── types/         # TypeScript type definitions
```

### Available Scripts

- `npm run build` - Build the project
- `npm run dev` - Run in development mode with watch
- `npm run lint` - Lint the codebase
- `npm run format` - Format the codebase
- `npm test` - Run tests
- `npm run typecheck` - Type check without emitting files

### Adding New Features

1. Create a new command in `src/commands/`
2. Implement core logic in `src/scanners/` or `src/services/`
3. Add tests in `__tests__` directories
4. Update documentation

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/scanners/__tests__/subdomain-scanner.test.ts
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [crt.sh](https://crt.sh/) for Certificate Transparency data
- [Rapid7](https://www.rapid7.com/) for Project Sonar data
- The open source community for amazing tools and libraries

---

Built with ❤️ using TypeScript and modern JavaScript tools.
