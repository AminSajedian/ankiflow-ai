# AnkiFlow AI 🧠

# Overview

AnkiFlow AI is a modern flashcard learning app built with React Native and Expo. It enhances traditional spaced repetition learning with AI-powered features, such as AI-generated explanations, topic suggestions, and adaptive difficulty. The app supports deck management, web content integration, and progress tracking, all within a mobile-friendly interface. It leverages Google's Generative AI and integrates with Anki/AnkiDroid for seamless flashcard management and study synchronization.

## Key Features

### Flashcard Deck Management
- Create, organize, and manage your study materials in customizable decks
- Sort and filter decks based on study progress, categories, or importance
- Import and export functionality for sharing decks with others

### AI-Powered Learning Assistance
- Leverage Google's Generative AI to enhance your flashcards
- Get AI-generated explanations for difficult concepts
- Receive suggestions for related topics to explore
- Automatic difficulty adjustment based on your performance

### Modern Mobile Interface
- Intuitive bottom sheet design for smooth interaction
- Gesture-based navigation for quick review of flashcards
- Responsive UI that adapts to different screen sizes and orientations
- Dark mode support for comfortable studying in any lighting condition

### Web Content Integration
- Seamlessly incorporate web resources into your study materials
- Preview web content directly within the app
- Extract key information from websites to create new flashcards

### Study Progress Tracking
- Visual analytics to track your learning progress
- Spaced repetition algorithm optimized by AI for better retention
- Performance metrics to identify areas needing more focus

## Technology Stack

- **Framework**: React Native with Expo (v53.0.9)
- **Navigation**: Expo Router with file-based routing
- **UI Components**:
   - Various Expo components (blur, vector icons)
   - Bottom sheet for interactive elements (@gorhom/bottom-sheet)
   - Gesture handling (react-native-gesture-handler)
- **AI Integration**: Google's Generative AI (@google/genai)
- **State Management**: React context via providers
- **Web Integration**: WebView (react-native-webview)

## App Structure

AnkiFlow AI follows a modular architecture with these key areas:

- **Main Dashboard**: Entry point displaying your learning progress and deck overview
- **Deck Management**: Browse, create, and organize your flashcard collections
- **Study Mode**: Interactive learning environment with AI assistance
- **Settings**: Customize your learning experience and AI preferences

## Prerequisites

Before using AnkiFlow AI, make sure the following apps are installed and running on your Android device:

1. **[AnkiDroid](https://play.google.com/store/apps/details?id=com.ichi2.anki)** — the Android Anki client that stores your decks and cards.
2. **[AnkiConnect Android](https://github.com/KamWithK/AnkiconnectAndroid/releases/latest)** — exposes the AnkiConnect API on Android so AnkiFlow AI can communicate with AnkiDroid.
   - Download the latest `.apk` from the [Releases page](https://github.com/KamWithK/AnkiconnectAndroid/releases/latest) or install via the [IzzyOnDroid F-Droid repo](https://apt.izzysoft.de/fdroid/index/apk/com.kamwithk.ankiconnectandroid).
   - Open AnkiConnect Android, accept the permissions, and tap **Start Service** before launching AnkiFlow AI.
3. A **Google Gemini API key** — get one for free at [aistudio.google.com](https://aistudio.google.com).

## Getting Started

1. Install AnkiDroid and AnkiConnect Android (see Prerequisites above)
2. Install AnkiFlow AI from the app store or build from source
3. Open AnkiFlow AI → **Settings** → enter your Gemini API key
4. Browse your AnkiDroid decks and use AI to enhance your flashcards
5. Track your progress and adjust study settings as needed

## For Developers

If you're interested in contributing to AnkiFlow AI:

1. The project uses standard React Native and Expo development practices
2. Explore the modular structure in the app directory
3. Follow the contribution guidelines in our repository

## Learn More

- [Spaced Repetition Learning](https://ncase.me/remember/): Understand the science behind effective flashcard learning
- [Google GenerativeAI](https://ai.google.dev/): Explore the AI capabilities used in AnkiFlow
- [React Native](https://reactnative.dev/): Learn about the underlying framework

## Join the AnkiFlow Community

We're building the future of AI-enhanced learning:

- **GitHub**: Star and follow our repository for updates
- **Issues**: Report bugs or request features through GitHub issues
- **Contributions**: Pull requests are welcome!
- **Discord**: Join our community of learners and developers
