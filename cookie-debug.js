// Copy and paste this into your browser console to debug cookies
console.log('=== Cookie Debug ===');
console.log('All cookies:', document.cookie);

const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [name, value] = cookie.trim().split('=');
  if (name && value) acc[name] = decodeURIComponent(value);
  return acc;
}, {});

console.log('Parsed cookies:', cookies);

const authCookies = ['accessToken', 'access_token', 'authToken', 'auth_token', 'token'];
const foundAuthCookies = authCookies.filter(name => cookies[name]);
console.log('Auth cookies found:', foundAuthCookies);

foundAuthCookies.forEach(name => {
  const token = cookies[name];
  console.log(`Cookie ${name}:`, {
    length: token.length,
    prefix: token.substring(0, 20) + '...',
    isJWT: token.split('.').length === 3
  });
});

// Also check if cookies are httpOnly (won't be accessible via JS)
if (foundAuthCookies.length === 0) {
  console.log('No auth cookies found in JavaScript. They might be httpOnly cookies.');
  console.log('Check Network tab in DevTools to see if cookies are being sent in requests.');
}