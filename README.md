# 🛠️ NetForge

A lightning-fast network reconnaissance toolkit built with modern TypeScript. NetForge specializes in advanced subdomain enumeration with real-time verification and beautiful CLI output.

## ✨ Features

- **Advanced Subdomain Discovery**
  - Certificate Transparency logs (crt.sh)
  - Rapid7's Project Sonar dataset
  - Real-time DNS resolution & HTTP(S) verification
  - Concurrent operations with configurable threads
  - Beautiful progress indicators & live updates

- **Modern Architecture**
  - Built with TypeScript and modern ESM
  - Robust error handling with neverthrow
  - Modular design with dependency injection
  - Comprehensive test coverage with Vitest
  - Type-safe configuration with Zod

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/danielgwilson/netforge.git
cd netforge

# Install dependencies
npm install

# Build the project
npm run build

# Link for development
npm link
```

## 🚀 Usage

### Subdomain Enumeration

```bash
# Basic enumeration
netforge enumerate -d example.com

# Customize thread count
netforge enumerate -d example.com -t 20

# Save results to file
netforge enumerate -d example.com -o results.txt

# Output as JSON
netforge enumerate -d example.com --json
```

### Command Options

```
Options:
  -d, --domain <domain>    Target domain to enumerate
  -t, --threads <number>   Number of concurrent threads (default: 10)
  -r, --retries <number>   Number of retries for failed requests (default: 3)
  -o, --output <file>      Output file for results
  --json                   Output results as JSON
  -h, --help              Display help
```

## ⚙️ Development

### Project Structure

```
src/
├── commands/           # CLI command implementations
│   └── enumerate.ts   # Subdomain enumeration command
├── scanners/          # Core scanning logic
│   ├── subdomain-scanner.ts
│   └── network-tester.ts
├── utils/             # Shared utilities
│   ├── logger.ts      # Logging utilities
│   ├── http-client.ts # HTTP client wrapper
│   └── dns-resolver.ts # DNS resolution utilities
└── types/             # TypeScript type definitions
```

### Available Scripts

- `npm run build` - Build with esbuild
- `npm run dev` - Development mode with watch
- `npm run lint` - Lint with Biome
- `npm run format` - Format with Biome
- `npm test` - Run tests with Vitest
- `npm run typecheck` - Type check without emitting

### Requirements

- Node.js >= 20.0.0
- npm >= 10.0.0

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
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [crt.sh](https://crt.sh/) - Certificate Transparency logs
- [Rapid7](https://www.rapid7.com/) - Project Sonar data
- [ora](https://github.com/sindresorhus/ora) - Elegant terminal spinners
- [chalk](https://github.com/chalk/chalk) - Terminal string styling
- [commander](https://github.com/tj/commander.js) - CLI framework

---

<div align="center">
  <sub>Built with ❤️ using TypeScript and modern JavaScript tools.</sub>
</div>
