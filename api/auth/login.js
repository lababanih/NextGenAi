// api/auth/login.js
// Admin Authentication System with JWT

import jwt from 'jsonwebtoken';

// WHITELIST ADMIN EMAILS - Edit this!
const ADMIN_WHITELIST = (process.env.ADMIN_EMAILS || 'admin@nextgenai.com').split(',').map(e => e.trim());
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NextGenAI2024!'; // Change this!

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, action } = req.body;

    // VERIFY ACTION
    if (action === 'verify') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          valid: false, 
          error: 'No token provided' 
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if still in whitelist
        if (!ADMIN_WHITELIST.includes(decoded.email)) {
          return res.status(401).json({ 
            valid: false, 
            error: 'Access revoked' 
          });
        }

        return res.json({ 
          valid: true, 
          email: decoded.email,
          name: decoded.name 
        });
      } catch (error) {
        return res.status(401).json({ 
          valid: false, 
          error: 'Invalid or expired token' 
        });
      }
    }

    // LOGIN ACTION
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password required' 
      });
    }

    // Check whitelist
    if (!ADMIN_WHITELIST.includes(email)) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Your email is not in admin whitelist.' 
      });
    }

    // Verify password
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid password' 
      });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      { 
        email, 
        name: email.split('@')[0],
        role: 'admin' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      email,
      name: email.split('@')[0],
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Login failed',
      message: error.message 
    });
  }
}

// Package.json dependencies needed:
// npm install jsonwebtoken
// or add to package.json:
// "dependencies": {
//   "jsonwebtoken": "^9.0.2"
// }
