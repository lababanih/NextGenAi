export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  
  // HARDCODED - langsung cek
  if (email === 'gutamaofficial3028@gmail.com' && password === 'Gutama@3028') {
    return res.json({ 
      success: true, 
      token: 'dummy-token-' + Date.now(),
      email, 
      name: 'Admin' 
    });
  }
  
  if (email !== 'gutamaofficial3028@gmail.com') {
    return res.status(403).json({ success: false, error: 'Access denied. Your email is not in admin whitelist.' });
  }
  
  return res.status(401).json({ success: false, error: 'Invalid password' });
}
