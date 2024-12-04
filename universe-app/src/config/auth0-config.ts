export const auth0Config = {
  domain: 'dev-universe.us.auth0.com',
  clientId: 'YOUR_CLIENT_ID', // Replace with your Auth0 client ID
  audience: 'https://api.universe-app.com',
  scope: 'openid profile email',
  redirectUri: window.location.origin,
  socialProviders: ['google', 'github'],
  roles: {
    admin: 'admin',
    user: 'user',
    editor: 'editor'
  }
};
