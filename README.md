# 🎨 Raincrest Art - AI Photo Booth

AI-powered photo booth web application that transforms your photos into stunning artistic masterpieces.

## 🚀 Quick Start

### Prerequisites
- **Netlify Account** (for hosting and serverless functions)
- **Bunny.net Account** (for CDN and image storage)
- **Replicate API Token** (for AI image generation)

### Local Development

```bash
# Install dependencies
npm install

# Start local server
# Option 1: PowerShell
.\start-server.ps1

# Option 2: Python
python -m http.server 8000

# Open browser
http://localhost:8000
```

### Environment Variables

Set these in **Netlify Dashboard** → Site Settings → Environment Variables:

```env
REPLICATE_API_TOKEN=your_replicate_token
BUNNY_API_KEY=your_bunny_api_key
BUNNY_STORAGE_ZONE=raincrest-art
BUNNY_CDN_DOMAIN=raincrest-cdn.b-cdn.net
REPLICATE_MODEL=google/nano-banana
TOKEN_SECRET=optional_custom_secret
```

## 📁 Project Structure

```
raincrest.art/
├── index.html                   # Landing page
├── order.html                   # Main photo booth interface
├── netlify/
│   └── functions/
│       ├── create-upload-token.js    # Secure upload token generation
│       ├── generate-image.js         # AI image generation
│       └── upload-user-image.js      # Fallback image upload
├── netlify.toml                 # Netlify configuration
├── package.json                 # Node.js dependencies
└── README.md                    # This file
```

## 🔧 Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Netlify Functions (Node.js serverless)
- **AI:** Replicate API (Google Nano Banana model)
- **Storage:** Bunny.net CDN
- **Hosting:** Netlify

## 🎯 Key Features

### 1. **Secure Direct Upload**
- Signed token system keeps API keys server-side
- Direct browser-to-CDN upload (no large payloads through Netlify)
- Automatic fallback for CORS issues

### 2. **Canvas-Based Image Processing**
- Converts File objects to Blob via Canvas
- Solves "consumed" File object issues on Android
- Enables reliable preview and upload

### 3. **Fast AI Generation**
- Google Nano Banana model for cost-effective generation
- Optimized parameters for best quality/speed ratio
- Automatic CDN propagation handling

### 4. **Mobile-First Design**
- Touch-optimized UI (44x44px minimum touch targets)
- Works on Android gallery and camera uploads
- Progressive error handling with user-friendly messages

## 🚀 Deployment

### Option 1: Automatic (Git Push)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Netlify will auto-deploy on every push to `main`.

### Option 2: Manual Deploy
1. Drag & drop project folder to Netlify Dashboard
2. Set environment variables
3. Deploy

## 🔐 Bunny.net Setup

### 1. Create Storage Zone
- Name: `raincrest-art`
- Region: Choose closest to your users
- Enable CORS for your domain

### 2. Create Pull Zone (CDN)
- Origin: Link to `raincrest-art` storage zone
- Hostname: `raincrest-cdn.b-cdn.net`
- Enable CORS for `*.netlify.app` and your custom domain

### 3. Upload Logo
- Upload `logo.jpg` to root of storage zone
- Access at: `https://raincrest-cdn.b-cdn.net/logo.jpg`

## 📊 Workflow

1. **User selects/captures image** → Canvas converts to Blob
2. **Preview displayed** → `URL.createObjectURL()` on Blob
3. **Upload initiated** → Request signed token from Netlify
4. **Direct upload** → Browser sends Blob directly to Bunny.net
5. **AI generation** → Netlify function calls Replicate API
6. **Result delivered** → Generated image served from CDN

## 🐛 Troubleshooting

### Image Upload Fails
- Check `BUNNY_API_KEY` is set correctly
- Verify CORS settings in Bunny.net dashboard
- Check browser console for detailed error logs

### AI Generation Errors (E006)
- Verify `REPLICATE_MODEL` is `google/nano-banana`
- Check image URL is accessible from external networks
- Ensure CDN has propagated (2-second delay built-in)

### Netlify Function Timeout
- Functions have 30-second timeout (configured in `netlify.toml`)
- Check function logs in Netlify Dashboard
- Verify image size is reasonable (< 10MB)

## 📝 Notes

- **Security:** All API keys stored server-side, never exposed to frontend
- **Performance:** Direct CDN upload reduces payload by 99.997%
- **Reliability:** Canvas-based processing solves Android File object issues
- **Cost:** Optimized for minimal API usage and bandwidth

## 🔗 Related Projects

- **Love Stories Dubrovnik** - Original museum kiosk implementation
- Based on proven architecture and battle-tested fixes

## 📞 Support

For issues or questions:
1. Check `netlify/functions/` logs in Netlify Dashboard
2. Review browser console for frontend errors
3. Verify environment variables are set correctly

---

**Built with ❤️ using battle-tested architecture from Love Stories Museum**

