# BioWaste Backend

This is the backend service for the BioWaste application that handles document generation and preview functionality.

## Hosting on Render

### Prerequisites
1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

### Deployment Steps

1. Log in to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your repository
4. Configure your web service with the following settings:
   - Name: biowaste-backend (or your preferred name)
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free (or your preferred plan)

### Environment Variables
No environment variables are required for basic functionality.

### Important Notes
- The free tier of Render will spin down after 15 minutes of inactivity
- Your service will automatically restart if it crashes
- Render will automatically deploy new versions when you push to your repository

### File Storage
Note that Render's filesystem is ephemeral, which means:
- Any files written to the filesystem will be lost when the service restarts
- For production use, consider using a cloud storage service (like AWS S3) for storing generated documents

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will start on port 3000 by default. 