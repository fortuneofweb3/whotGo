# Contributing to Whot Go! 🃏

Thank you for your interest in contributing to Whot Go! We welcome contributions from the community and appreciate your help in making this project better.

## 🤝 How to Contribute

### Reporting Bugs
- Use the [GitHub Issues](https://github.com/fortuneofweb3/whotGo/issues) page
- Include a clear description of the bug
- Provide steps to reproduce the issue
- Include browser/device information if relevant

### Suggesting Features
- Use the [GitHub Issues](https://github.com/fortuneofweb3/whotGo/issues) page
- Clearly describe the feature you'd like to see
- Explain why this feature would be beneficial
- Consider implementation complexity

### Code Contributions
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test your changes**: Ensure everything works as expected
5. **Commit your changes**: Use clear, descriptive commit messages
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Create a Pull Request**: Provide a clear description of your changes

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Local Development
1. **Clone your fork**
   ```bash
   git clone https://github.com/fortuneofweb3/whotGo.git
   cd whotGo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with your Firebase configuration

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📝 Code Style Guidelines

### JavaScript/React
- Use functional components with hooks
- Follow React best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Use ES6+ features when appropriate

### CSS/Styling
- Use Tailwind CSS classes
- Follow the existing design patterns
- Ensure responsive design
- Maintain accessibility standards

### Git Commit Messages
- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, etc.)
- Keep the first line under 50 characters
- Add more details in the body if needed

Example:
```
Add multiplayer room creation functionality

- Implement room creation with Firebase
- Add real-time player joining
- Include room validation and error handling
```

## 🧪 Testing

### Manual Testing
- Test on different browsers (Chrome, Firefox, Safari, Edge)
- Test on mobile devices
- Test wallet connections
- Test game functionality thoroughly

### Automated Testing (Future)
- Unit tests for utility functions
- Component tests for React components
- Integration tests for game logic
- E2E tests for critical user flows

## 🔧 Project Structure

### Key Directories
- `src/components/`: React components
- `src/utils/`: Utility functions and helpers
- `src/firebase.js`: Firebase configuration
- `public/sounds/`: Audio files
- `public/animations/`: Lottie animations

### Important Files
- `src/App.jsx`: Main application component
- `src/components/Game.jsx`: Core game logic
- `src/utils/profile.js`: Honeycomb profile management
- `src/utils/soundEffects.js`: Audio system

## 🎮 Game-Specific Guidelines

### Game Logic
- Follow the official Whot card game rules
- Ensure fair gameplay mechanics
- Test edge cases thoroughly
- Maintain game state consistency

### Blockchain Integration
- Test with Solana testnet first
- Handle wallet connection errors gracefully
- Implement proper error handling for transactions
- Follow Honeycomb Protocol best practices

### Audio & Visual
- Ensure audio files are optimized
- Test sound effects across different devices
- Maintain consistent visual design
- Optimize animations for performance

## 🚀 Pull Request Process

1. **Ensure your code follows the style guidelines**
2. **Test your changes thoroughly**
3. **Update documentation if needed**
4. **Create a clear PR description**
5. **Link any related issues**
6. **Wait for review and address feedback**

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tested on desktop browsers
- [ ] Tested on mobile devices
- [ ] Tested wallet connections
- [ ] Tested game functionality

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Browser/device information**
5. **Console errors** (if any)
6. **Screenshots** (if applicable)

## 💡 Feature Requests

When suggesting features:

1. **Clear description** of the feature
2. **Use case** and benefits
3. **Implementation ideas** (if you have any)
4. **Priority level** (low, medium, high)

## 📞 Getting Help

- **Discord**: Join our [Discord Server](https://discord.gg/whotgo)
- **Issues**: Use [GitHub Issues](https://github.com/fortuneofweb3/whotGo/issues)
- **Email**: support@whotgo.com

## 🙏 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor hall of fame
- Special acknowledgments

---

**Thank you for contributing to Whot Go! 🎉**

*Together, we're building the future of blockchain gaming!*
