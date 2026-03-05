# 🧠 OpenGradient Knowledge Quiz

An interactive quiz app to test your knowledge of the OpenGradient decentralized AI platform.

![OpenGradient Quiz](https://img.shields.io/badge/OpenGradient-Quiz-6366f1?style=for-the-badge)

## 🎮 Features

- **15 questions** covering OpenGradient fundamentals
- **30-second timer** per question
- **Instant feedback** with explanations
- **Score tracking** with local leaderboard
- **Rank badges**: Master, Expert, Intermediate, Beginner
- **Share results** on Twitter
- **No signup required** - works instantly in browser

## 🚀 Quick Start

### Option 1: Open directly
Just open `index.html` in your browser!

### Option 2: Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Push this folder to the repo
3. Go to Settings → Pages → Source: Deploy from branch (main)
4. Your quiz will be live at `https://yourusername.github.io/repo-name`

### Option 3: Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push to GitHub
2. Connect to Vercel
3. Deploy!

## 📚 Question Categories

- **Basics** - What is OpenGradient?
- **Architecture** - TEE, HACA infrastructure
- **Model Hub** - ONNX format, CIDs
- **SDK** - Python SDK, CLI commands
- **Tokens** - $OPG, faucet
- **Security** - Private keys, verification
- **Use Cases** - Verifiable AI, agents

## 🛠️ Customization

Edit the `questions` array in `index.html` to:
- Add new questions
- Modify existing questions
- Change categories

```javascript
{
    category: "Your Category",
    question: "Your question?",
    options: [
        "Option A",
        "Option B", 
        "Option C",
        "Option D"
    ],
    correct: 0, // Index of correct answer (0-3)
    explanation: "Why this answer is correct..."
}
```

## 📱 Responsive Design

Works on:
- Desktop
- Tablet
- Mobile

## 🔗 Links

- [OpenGradient Docs](https://docs.opengradient.ai)
- [OpenGradient Hub](https://hub.opengradient.ai)
- [OpenGradient Faucet](https://faucet.opengradient.ai)

## 📄 License

MIT - Feel free to fork and modify!

---

Built with ❤️ for the OpenGradient community
