# ElevenLabs Agent Security Guide

This document covers security best practices for deploying Bobby with ElevenLabs agents.

**→ For detailed Signed URL setup, see [SIGNED_URL_SETUP.md](./SIGNED_URL_SETUP.md)**

## Authentication Methods

### 1. Allowlist Approach (Web Apps)

**When to use**: For web applications deployed on specific production domains.

**How it works**:
- Agent only accepts connections from whitelisted domains
- Set up in ElevenLabs Dashboard → Agents → Agent Settings
- Add production domain(s) to allowlist

**Setup**:
1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/dashboard)
2. Select your agent
3. Go to Settings → Allowlist
4. Add your production domain (e.g., `app.example.com`)
5. Save changes

**Example**:
```
Allowed Domains:
- app.example.com
- *.example.com (wildcard)
```

**Benefits**:
- ✅ Simple to set up
- ✅ No backend required
- ✅ Quick integration

**Limitations**:
- ❌ Can't be used for mobile apps without domain
- ❌ Less flexible for multiple environments

### 2. Signed URL Approach (Recommended for Production)

**When to use**: For production deployments, mobile apps, or multi-environment setups.

**How it works**:
- Backend generates short-lived signed URLs
- API key kept secure on server-side
- Client-side uses URL to initiate connection
- URLs expire after 1 hour

**Setup**:

#### 1. Set Environment Variables

```env
# Server-side (SECRET - never expose to client)
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here

# Client-side
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here

# Optional: Restrict origins
ALLOWED_ORIGINS=https://app.example.com,https://www.example.com
```

#### 2. Backend API Route

The route `/api/get-signed-url` handles:
- ✅ API key management (server-side only)
- ✅ Signed URL generation
- ✅ Origin validation
- ✅ Expiration management

#### 3. Enable Server-Side Authentication

In [ElevenLabs Dashboard](https://elevenlabs.io/dashboard):
1. Select your agent
2. Settings → Security → Enable Authentication
3. Choose "Signed URL" method

#### 4. Create API Key

1. Go to Developer section → API Keys
2. Click "Create API Key"
3. Set permissions:
   - ✅ Conversational AI
   - ✅ Read agents
4. Optional: Set credit limits
5. Copy the API key

#### 5. Update `.env.local`

```env
# Add to .env.local
ELEVENLABS_API_KEY=sk_xxxxx
ELEVENLABS_AGENT_ID=agent_xxxxx
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

**Benefits**:
- ✅ Most secure approach
- ✅ Works for mobile and web
- ✅ Short-lived tokens
- ✅ API key never exposed to client
- ✅ Full audit trail

**Limitations**:
- ❌ Requires backend server
- ❌ Slightly more complex setup

## Security Best Practices

### Client-Side Security

✅ **DO**:
- Use environment variables for agent ID only
- Validate user permissions on backend
- Implement rate limiting on API routes
- Use HTTPS in production
- Validate signed URLs on backend
- Log authentication attempts

❌ **DON'T**:
- Expose API keys to client-side
- Use `NEXT_PUBLIC_` for API keys
- Store secrets in code/git
- Trust client-side authentication alone

### Backend Security

✅ **DO**:
- Store API keys in environment variables
- Use secure authentication methods
- Implement origin validation
- Set appropriate token expiration
- Monitor API usage
- Log all signed URL requests

❌ **DON'T**:
- Hardcode API keys
- Expose API keys in logs
- Allow unlimited signed URL generation
- Skip origin validation

### Rate Limiting

Implement rate limiting on `/api/get-signed-url`:

```typescript
// Example: Max 10 signed URLs per minute per IP
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
});

app.post('/api/get-signed-url', limiter, handler);
```

### API Key Rotation

- 🔄 Rotate API keys quarterly
- 🔄 Use separate keys per environment
- 🔄 Set credit limits per key
- 🔄 Monitor key usage

## Production Deployment

### Pre-Deployment Checklist

- [ ] Enable authentication in ElevenLabs Dashboard
- [ ] Set environment variables on hosting platform
- [ ] Configure allowed origins
- [ ] Set up API key rotation policy
- [ ] Enable HTTPS
- [ ] Set up monitoring and alerts
- [ ] Test signed URL generation
- [ ] Verify origin validation works
- [ ] Set up audit logging
- [ ] Configure rate limiting

### Environment Configuration

**Development**:
```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=dev_agent_id
# Direct connection (no authentication required)
```

**Production**:
```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=prod_agent_id
ELEVENLABS_API_KEY=sk_xxxxx (SECURE)
ELEVENLABS_AGENT_ID=prod_agent_id
ALLOWED_ORIGINS=https://app.example.com
NODE_ENV=production
```

### Hosting Platform Setup

**Vercel**:
1. Go to Project Settings → Environment Variables
2. Add environment variables
3. Set to "Production" environment

**AWS Lambda/App Runner**:
1. Set via deployment config
2. Use AWS Secrets Manager for API keys
3. Reference in environment

**Docker**:
```dockerfile
ENV ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
ENV ELEVENLABS_AGENT_ID=${ELEVENLABS_AGENT_ID}
```

## Monitoring & Logging

### Important Metrics to Track

- ✅ Signed URL generation requests
- ✅ Authentication failures
- ✅ Origin validation rejections
- ✅ API key usage and limits
- ✅ Conversation initiation success rate

### Sample Logging

```typescript
logger.info('Signed URL requested', { 
  origin,
  timestamp,
  agentId
});

logger.warn('Origin validation failed', { 
  origin,
  allowedOrigins 
});

logger.error('API key invalid', { 
  timestamp 
});
```

## Troubleshooting

### "Origin not allowed"
- Check allowed domains in ElevenLabs Dashboard
- Verify domain matches exactly (case-sensitive)
- Clear browser cache
- Check subdomain setup

### "Authentication failed"
- Verify API key is valid and not expired
- Check API key has correct permissions
- Confirm ELEVENLABS_API_KEY is set on server
- Verify agent ID matches

### "Signed URL expired"
- Default expiration is 1 hour
- Generate new signed URL when needed
- Check server clock synchronization
- Increase `expiresIn` if needed

## References

- [ElevenLabs Security Documentation](https://elevenlabs.io/docs/agents-platform/security)
- [ElevenLabs API Keys](https://elevenlabs.io/docs/api-reference/authentication)
- [ElevenLabs Dashboard](https://elevenlabs.io/dashboard)
- [Next.js API Routes Security](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## Support

For issues:
1. Check ElevenLabs status page
2. Verify environment variables
3. Review logs and monitoring
4. Contact ElevenLabs support

---

**Last Updated**: November 2024
**Status**: Production Ready

