# Bobby - Deployment Guide

## Pre-Deployment Checklist

### Environment & Credentials
- [ ] API key and Agent ID are set in production environment variables
- [ ] API key is never committed to version control
- [ ] Use environment-specific configs for different deployment stages

### Testing
- [ ] All manual tests from TESTING.md have passed
- [ ] No console errors or warnings in production build
- [ ] Accessibility tests pass (keyboard, screen readers, contrast)
- [ ] Mobile and desktop testing complete
- [ ] Cross-browser testing complete

### Build & Performance
- [ ] Production build succeeds: `npm run build`
- [ ] Build size is acceptable
- [ ] No unoptimized images or assets
- [ ] CSS is user-provided and optimized

### Security
- [ ] API key is not exposed in client-side code (only via NEXT_PUBLIC_)
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive information
- [ ] HTTPS is enabled in production

### Accessibility
- [ ] WCAG 2.1 AA compliance verified
- [ ] Screen reader testing complete
- [ ] Keyboard navigation works throughout
- [ ] Color contrast meets standards

## Deployment Options

### Vercel (Recommended for Next.js)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Select the `bobby` project

3. **Configure Environment Variables**
   - Add `NEXT_PUBLIC_ELEVENLABS_API_KEY`
   - Add `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`

4. **Deploy**
   - Vercel automatically deploys on push to main

### Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build Docker Image**
   ```bash
   docker build -t bobby:latest .
   ```

3. **Run Container**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key \
     -e NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id \
     bobby:latest
   ```

### Traditional VPS/Server

1. **Install Node.js 18+**
   ```bash
   curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone Repository**
   ```bash
   git clone <repository-url> /var/www/bobby
   cd /var/www/bobby
   ```

3. **Install Dependencies & Build**
   ```bash
   npm install
   npm run build
   ```

4. **Set Environment Variables**
   ```bash
   cat > .env.local << EOF
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id
   EOF
   ```

5. **Run with Process Manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start npm --name bobby -- start
   pm2 save
   ```

6. **Configure Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Set Up HTTPS (Let's Encrypt)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Post-Deployment

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor API usage and costs
- [ ] Set up performance monitoring
- [ ] Monitor server resources

### Maintenance
- [ ] Keep dependencies updated
- [ ] Monitor security vulnerabilities
- [ ] Regular backups of user data
- [ ] Update content as needed

### Analytics (Optional)
- [ ] Set up usage analytics
- [ ] Track user engagement
- [ ] Monitor feature usage
- [ ] Gather user feedback

## Performance Optimization

### Asset Optimization
- [ ] Minify and compress CSS (user will add)
- [ ] Optimize images with proper formats
- [ ] Use lazy loading where appropriate
- [ ] Enable gzip compression

### Caching Strategy
- [ ] Set appropriate cache headers
- [ ] Use browser caching for static assets
- [ ] Consider service workers for offline support

### Database & Storage
- [ ] Monitor localStorage limits
- [ ] Plan for data backup
- [ ] Consider cloud backup solutions

## Troubleshooting

### Common Issues

**Microphone not working**
- Ensure HTTPS is enabled in production
- Check browser permissions
- Test with different browsers

**ElevenLabs API errors**
- Verify API key is correct
- Check Agent ID is correct
- Monitor API rate limits
- Check ElevenLabs account status

**Build failures**
- Check Node.js version (18+)
- Verify all dependencies installed
- Check environment variables are set

**Performance issues**
- Check network requests in DevTools
- Monitor bundle size
- Check for memory leaks
- Monitor CPU usage

## Rollback Plan

1. **Quick Rollback**
   ```bash
   git revert <commit-hash>
   git push origin main
   # Platform will auto-redeploy
   ```

2. **Keep Previous Versions**
   - Tag releases: `git tag v1.0.0`
   - Maintain release branches
   - Document breaking changes

## Support & Documentation

- Keep documentation updated
- Document any custom modifications
- Maintain changelog
- Create user guides if needed

## Security Reminders

- Never commit API keys or secrets
- Use environment variables for all secrets
- Rotate API keys periodically
- Monitor API usage for abuse
- Keep dependencies up to date
- Monitor security advisories

