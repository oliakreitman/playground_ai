# 🔗 Clerk Webhook Setup Guide

This guide will help you set up Clerk webhooks to automatically sync user data to Firebase when users sign up, update their profile, or delete their account.

## 📋 Prerequisites

- Clerk account with a configured application
- Personal Playground app running locally or deployed
- Access to your Clerk Dashboard

## 🛠️ Setup Steps

### 1. Create a Webhook Endpoint in Clerk Dashboard

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**

### 2. Configure the Webhook

**Endpoint URL:**
- **Local Development**: `http://localhost:3001/api/webhooks/clerk`
- **Production**: `https://yourdomain.com/api/webhooks/clerk`

**Events to Subscribe:**
- ✅ `user.created` - When a new user signs up
- ✅ `user.updated` - When user updates their profile
- ✅ `user.deleted` - When user deletes their account

### 3. Get Your Webhook Secret

1. After creating the webhook, you'll see a **Signing Secret**
2. Copy this secret (it starts with `whsec_`)
3. Update your `.env.local` file:

```bash
# Replace 'whsec_your_webhook_secret_here' with your actual secret
CLERK_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

### 4. Test the Webhook

1. Restart your development server: `npm run dev`
2. Create a new user account through your app
3. Check your browser console and server logs for webhook events
4. Verify the user appears in your Firebase Firestore database

## 🔍 Troubleshooting

### Common Issues:

1. **Webhook not triggering:**
   - Ensure your app is accessible (use ngrok for local development)
   - Check that events are properly selected in Clerk Dashboard

2. **Authentication errors:**
   - Verify your webhook secret is correct
   - Ensure the secret is properly set in environment variables

3. **Firebase errors:**
   - Check your Firebase configuration
   - Verify Firestore rules allow write access

### Debug Steps:

1. Check server logs for webhook reception
2. Verify Firebase connection
3. Test with a simple user creation flow

## 📊 What Gets Stored

When a user is created, the following data is stored in Firebase:

```javascript
{
  clerkId: "user_xxx",
  firstName: "John",
  lastName: "Doe", 
  username: "johndoe",
  email: "john@example.com",
  emailVerified: true,
  imageUrl: "https://...",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
  totalDataItems: 0,
  totalFilesUploaded: 0,
  storageUsed: 0,
  preferences: {
    theme: "light",
    notifications: true,
    language: "en"
  }
}
```

## 🚀 Production Deployment

For production deployment:

1. Deploy your app to your hosting platform
2. Update the webhook URL in Clerk Dashboard to your production domain
3. Ensure environment variables are set in your production environment
4. Test the webhook with a real user signup

## 🔐 Security Notes

- Webhook secrets should never be committed to version control
- Always verify webhook signatures (handled automatically by svix)
- Consider implementing rate limiting for webhook endpoints
- Monitor webhook delivery failures in Clerk Dashboard

---

✅ **Success!** Your users will now be automatically synchronized to Firebase when they interact with your authentication system.

