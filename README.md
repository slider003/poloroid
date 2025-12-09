<div align="center">

# 📸 Digital Polaroid

*Capture the nostalgia of instant photography, reimagined for the web*

[![Deploy Status](https://github.com/slider003/poloroid/actions/workflows/deploy.yml/badge.svg)](https://github.com/slider003/poloroid/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff.svg?logo=vite)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-enabled-5A0FC8.svg)](https://web.dev/progressive-web-apps/)

[Live Demo](https://slider003.github.io/poloroid/) · [Report Bug](https://github.com/slider003/poloroid/issues) · [Request Feature](https://github.com/slider003/poloroid/issues)

</div>

---

## ✨ What is Digital Polaroid?

Transform your everyday moments into vintage memories with **Digital Polaroid** - a Progressive Web App that brings the magic of instant photography to your browser. Watch your photos develop in real-time, add handwritten captions, and share authentic Polaroid-style memories with friends.

No downloads. No accounts. Just pure nostalgia.

## 🎯 Features

- **📷 Live Camera Preview** - See yourself through a vintage lens with real-time filter preview
- **⏱️ Authentic Development Animation** - Experience the iconic 10-second photo development process
- **🎨 Polaroid Filter** - Automatic sepia, contrast, and saturation adjustments for that classic look
- **✍️ Custom Captions** - Add personalized text with retro typewriter, handwritten, or clean fonts
- **🔄 Camera Switching** - Toggle between front and back cameras on mobile devices
- **💾 Auto-Save & Gallery** - Smart auto-saving ensures you never lose a memory, stored safely on your device
- **🔐 Privacy First** - Remembers your camera access preference for seamless use
- **📤 Easy Sharing** - Native share integration on mobile, download fallback on desktop
- **📱 Progressive Web App** - Install to home screen and use offline
- **⚡ Flash Mode** - Toggle flash for better lighting (supported devices only)

## 🚀 Quick Start
### Try It Now
Visit **[slider003.github.io/poloroid](https://slider003.github.io/poloroid/)** and click "Allow" when prompted for camera access.

### Run Locally

```bash
# Clone the repository
git clone https://github.com/slider003/poloroid.git
cd poloroid

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:5173`

## 🎨 How It Works

1. **📸 Snap** - Point your camera and click the shutter button
2. **⏳ Develop** - Watch your photo emerge over 10 seconds, just like the real thing
3. **✏️ Caption** - Add a personal message with your choice of retro fonts
4. **💾 Auto-Save** - Your photos are automatically saved to your local gallery
5. **📤 Share** - Download or share your Polaroid masterpiece

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| ⚛️ **React 19** | UI framework with modern hooks |
| ⚡ **Vite 7** | Lightning-fast build tool and dev server |
| 🗄️ **IndexedDB** | Robust local storage for high-quality images |
| 🎨 **html2canvas** | High-quality image export with filters |
| 📱 **vite-plugin-pwa** | Progressive Web App capabilities |
| 🎥 **MediaDevices API** | Native camera access and switching |
| 🔒 **Permissions API** | Smart permission state management |

## 📦 Project Structure

```
poloroid/
├── src/
│   ├── components/
│   │   ├── Camera.jsx          # Camera UI and controls
│   │   ├── PolaroidFrame.jsx   # Polaroid frame wrapper
│   │   └── RecentGallery.jsx   # Gallery for saved photos
│   ├── hooks/
│   │   ├── useCamera.js        # Camera logic & permission handling
│   │   └── useRecentPhotos.js  # IndexedDB storage management
│   ├── utils/
│   │   └── filters.js          # Pixel-level Polaroid filter
│   ├── App.jsx                 # Main app orchestration
│   └── main.jsx                # React entry point
├── .github/workflows/
│   └── deploy.yml              # Automated GitHub Pages deployment
└── vite.config.js              # Build configuration
```

## 🎭 Filter Technology

Our Polaroid filter uses **pixel-level manipulation** for authentic results:

```javascript
// Real-time processing of every pixel
- Sepia tone (40%) for warmth
- Contrast boost (1.2x) for depth
- Brightness lift (1.1x) for that faded look
- Reduced saturation (0.8x) for vintage vibes
```

Unlike CSS filters, our approach ensures consistent output across all devices and export formats.

## 🔐 Privacy First

- **Zero data collection** - No analytics, no tracking, no servers
- **Local-only processing** - Photos never leave your device
- **Permission transparency** - Clear camera access prompts
- **User control** - Easy permission revocation through browser settings

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14.1+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Mobile Safari | iOS 14.5+ | ✅ Full support |
| Chrome Mobile | Android 90+ | ✅ Full support |

**Requires:** Camera access, IndexedDB, ES6+ support

## 📝 Roadmap

- [x] Photo gallery with persistence
- [x] Auto-save functionality
- [ ] Custom filter intensity controls
- [ ] Additional retro frame styles
- [ ] AI-powered caption suggestions
- [ ] Batch photo processing
- [ ] Social media preset exports

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💬 Contact

Project Link: [https://github.com/slider003/poloroid](https://github.com/slider003/poloroid)

---

<div align="center">

**Made with ❤️ for instant photography enthusiasts**

*Remember: the best photos are the ones you actually take*

</div>
