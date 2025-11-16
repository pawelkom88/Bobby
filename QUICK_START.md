# Bobby - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
# Copy example file
cp .env.example .env.local

# Add your ElevenLabs credentials
# Edit .env.local and add:
# NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key_here
# NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test the App
- Go to home page
- Click "Get Started"
- Select age tier
- Choose situation
- Dial 999
- Start voice conversation

## 📁 Key Files to Know

| File | Purpose |
|------|---------|
| `app/app/page.tsx` | Main training flow |
| `components/` | React components |
| `lib/storage.ts` | Data persistence |
| `lib/gamification.ts` | Level & XP system |
| `types/index.ts` | TypeScript types |
| `app/globals.css` | Global styles (add your CSS here) |

## 🎨 What to Customize

1. **Styling** - Edit `app/globals.css` and component files
2. **Icons** - Replace placeholders in components
3. **Colors** - Add your brand colors to CSS
4. **Content** - Update text in pages and components
5. **ElevenLabs** - Implement actual SDK calls in `lib/elevenlabs.ts`

## 🧪 Testing

Run the testing checklist in `TESTING.md`:
```bash
npm run build  # Check for errors
# Manual testing steps in TESTING.md
```

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🌍 Deploy

See `DEPLOYMENT.md` for:
- Vercel (recommended)
- Docker
- Traditional VPS

## 📚 Documentation

- **README.md** - Full overview
- **SETUP.md** - Detailed setup
- **TESTING.md** - Testing guide
- **DEPLOYMENT.md** - Deployment guide
- **PROJECT_SUMMARY.md** - Complete summary

## ❓ Common Questions

**Q: How do I add custom styling?**
A: Edit `app/globals.css` or add component-specific styles.

**Q: How do I replace placeholder icons?**
A: Search for "placeholder" in components and replace with your icon components.

**Q: How does the ElevenLabs integration work?**
A: Check `lib/elevenlabs.ts` - it's a placeholder waiting for actual SDK implementation.

**Q: How is user data saved?**
A: All data is saved to browser localStorage in `lib/storage.ts`.

**Q: Can I add more age tiers or situations?**
A: Yes! Edit the constants in `lib/ageTiers.ts` and components.

## 🔧 Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Run production server
npm run lint     # Run linter
```

## 🆘 Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

**ElevenLabs not working?**
- Check API key is in `.env.local`
- Check Agent ID is correct
- Try with valid API key first

**Build fails?**
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## 📞 Support

- Check SETUP.md for setup issues
- Check TESTING.md for testing issues
- Check DEPLOYMENT.md for deployment issues

## ✅ You're Ready!

The app is ready for:
1. ✅ Styling and design
2. ✅ Icon customization
3. ✅ ElevenLabs integration
4. ✅ Testing and refinement
5. ✅ Deployment

Start by running `npm run dev` and explore the app!

