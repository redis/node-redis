import express, { Request, Response } from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import { DEFAULT_TOKEN_MANAGER_CONFIG, EntraIdCredentialsProviderFactory } from '../../lib/entra-id-credentials-provider-factory';
import { InteractiveBrowserCredential } from '@azure/identity';

dotenv.config();

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set');
}

const app = express();

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only use secure in production
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 3600000 // 1 hour
  }
} as const;

app.use(session(sessionConfig));

if (!process.env.MSAL_CLIENT_ID || !process.env.MSAL_TENANT_ID) {
  throw new Error('MSAL_CLIENT_ID and MSAL_TENANT_ID environment variables must be set');
}


app.get('/login', async (req: Request, res: Response) => {
  try {
    // Create an instance of InteractiveBrowserCredential
    const credential = new InteractiveBrowserCredential({
      clientId: process.env.MSAL_CLIENT_ID!,
      tenantId: process.env.MSAL_TENANT_ID!,
      loginStyle: 'popup',
      redirectUri: 'http://localhost:3000/redirect'
    });

    // Create Redis client using the EntraID credentials provider
    const entraidCredentialsProvider = EntraIdCredentialsProviderFactory.createForDefaultAzureCredential({
      credential,
      scopes: ['user.read'],
      tokenManagerConfig: DEFAULT_TOKEN_MANAGER_CONFIG
    });

    // Subscribe to credentials updates
    const initialCredentials = entraidCredentialsProvider.subscribe({
      onNext: (token) => {
        // Never log the full token in production
        console.log('Token acquired successfully');
        console.log('Username:', token.username);
 
      },
      onError: (error) => {
        console.error('Token acquisition failed:', error);
      }
    });

    // Wait for the initial credentials
    const [credentials] = await initialCredentials;

    // Return success response
    res.json({
      status: 'success',
      message: 'Authentication successful',
      credentials: {
        username: credentials.username,
        password: credentials.password
      }
    });
  } catch (error) {
    console.error('Authentication failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Create a simple status page
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <title>Interactive Browser Credential Demo</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .button { display: inline-block; padding: 10px 20px; background: #0078d4; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Interactive Browser Credential Demo</h1>
        <p>This example demonstrates using the InteractiveBrowserCredential from @azure/identity to authenticate with Microsoft Entra ID.</p>
        <p>When you click the button below, you'll be redirected to the Microsoft login page.</p>
        <a href="/login" class="button">Login with Microsoft</a>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to start`);
});
