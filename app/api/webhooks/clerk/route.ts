import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
}

interface ClerkUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email_addresses: Array<{
    email_address: string;
    verification?: {
      status: string;
    };
  }>;
  image_url: string;
  created_at: number;
  updated_at: number;
}

interface WebhookEvent {
  type: string;
  data: ClerkUser;
}

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret as string);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  const { type, data } = evt;
  console.log(`Webhook received: ${type}`);

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}

async function handleUserCreated(user: ClerkUser) {
  console.log('Creating user in Firebase:', user.id);
  
  const userDoc = {
    clerkId: user.id,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    username: user.username || '',
    email: user.email_addresses[0]?.email_address || '',
    emailVerified: user.email_addresses[0]?.verification?.status === 'verified',
    imageUrl: user.image_url || '',
    createdAt: Timestamp.fromMillis(user.created_at),
    updatedAt: Timestamp.fromMillis(user.updated_at),
    lastLoginAt: Timestamp.now(),
    // Additional fields for our app
    totalDataItems: 0,
    totalFilesUploaded: 0,
    storageUsed: 0,
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en',
    },
  };

  await setDoc(doc(db, 'users', user.id), userDoc);
  console.log('User created in Firebase successfully');
}

async function handleUserUpdated(user: ClerkUser) {
  console.log('Updating user in Firebase:', user.id);
  
  const userDoc = {
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    username: user.username || '',
    email: user.email_addresses[0]?.email_address || '',
    emailVerified: user.email_addresses[0]?.verification?.status === 'verified',
    imageUrl: user.image_url || '',
    updatedAt: Timestamp.fromMillis(user.updated_at),
  };

  await updateDoc(doc(db, 'users', user.id), userDoc);
  console.log('User updated in Firebase successfully');
}

async function handleUserDeleted(user: ClerkUser) {
  console.log('Deleting user from Firebase:', user.id);
  
  // Delete user document
  await deleteDoc(doc(db, 'users', user.id));
  
  // Note: In a production app, you might want to:
  // 1. Delete all user's data
  // 2. Delete all user's files from storage
  // 3. Log the deletion for compliance purposes
  
  console.log('User deleted from Firebase successfully');
}

