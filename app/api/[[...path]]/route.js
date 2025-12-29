import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'iflare')
  }
  return db
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Generate verification token
function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Hash password (simple hash for demo - use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Generate session token
function generateSessionToken(userId) {
  const payload = { userId, timestamp: Date.now() }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

// Send verification email
async function sendVerificationEmail(email, name, token) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify?token=${token}`
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'iFLARE <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify your iFLARE account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #f97316; font-size: 32px; margin: 0;">🔥 iFLARE</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Real connections. Right now.</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155;">
              <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0;">Welcome, ${name}! 👋</h2>
              <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thanks for signing up for iFLARE! Click the button below to verify your email and start discovering amazing connections around you.
              </p>
              
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Verify My Email
              </a>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                Or copy and paste this link:<br>
                <a href="${verificationUrl}" style="color: #f97316; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
            
            <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 32px;">
              This link will expire in 24 hours.<br>
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `
    })
    
    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Root endpoint
    if ((route === '/root' || route === '/') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "iFLARE API" }))
    }

    // ==================== AUTH ROUTES ====================

    // Register new user
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const { name, email, password, interests } = body

      // Validation
      if (!name || !email || !password || !interests) {
        return handleCORS(NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        ))
      }

      if (password.length < 6) {
        return handleCORS(NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        ))
      }

      if (!Array.isArray(interests) || interests.length < 3) {
        return handleCORS(NextResponse.json(
          { error: 'Please select at least 3 interests' },
          { status: 400 }
        ))
      }

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return handleCORS(NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        ))
      }

      // Create user (directly verified - no email verification for now)
      const user = {
        id: uuidv4(),
        name,
        email: email.toLowerCase(),
        password: hashPassword(password),
        interests,
        isVerified: true, // Auto-verified for testing
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('users').insertOne(user)

      // Generate session token for auto-login
      const sessionToken = generateSessionToken(user.id)

      return handleCORS(NextResponse.json({
        message: 'Registration successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          interests: user.interests
        },
        token: sessionToken
      }))
    }

    // Verify email
    if (route === '/auth/verify' && method === 'POST') {
      const body = await request.json()
      const { token } = body

      if (!token) {
        return handleCORS(NextResponse.json(
          { error: 'Verification token is required' },
          { status: 400 }
        ))
      }

      // Find user with this token
      const user = await db.collection('users').findOne({ 
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }
      })

      if (!user) {
        return handleCORS(NextResponse.json(
          { error: 'Invalid or expired verification link' },
          { status: 400 }
        ))
      }

      // Update user as verified
      await db.collection('users').updateOne(
        { id: user.id },
        { 
          $set: { 
            isVerified: true,
            updatedAt: new Date()
          },
          $unset: { 
            verificationToken: '',
            verificationTokenExpiry: ''
          }
        }
      )

      // Generate session token for auto-login
      const sessionToken = generateSessionToken(user.id)

      return handleCORS(NextResponse.json({
        message: 'Email verified successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          interests: user.interests
        },
        token: sessionToken
      }))
    }

    // Login
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body

      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        ))
      }

      // Find user
      const user = await db.collection('users').findOne({ 
        email: email.toLowerCase() 
      })

      if (!user) {
        return handleCORS(NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        ))
      }

      // Check password
      if (user.password !== hashPassword(password)) {
        return handleCORS(NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        ))
      }

      // Generate session token
      const sessionToken = generateSessionToken(user.id)

      return handleCORS(NextResponse.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          interests: user.interests
        },
        token: sessionToken
      }))
    }

    // Resend verification email
    if (route === '/auth/resend-verification' && method === 'POST') {
      const body = await request.json()
      const { email } = body

      if (!email) {
        return handleCORS(NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        ))
      }

      // Find user
      const user = await db.collection('users').findOne({ 
        email: email.toLowerCase() 
      })

      if (!user) {
        // Don't reveal if user exists
        return handleCORS(NextResponse.json({
          message: 'If an account exists, a verification email has been sent.'
        }))
      }

      if (user.isVerified) {
        return handleCORS(NextResponse.json(
          { error: 'This email is already verified' },
          { status: 400 }
        ))
      }

      // Generate new verification token
      const verificationToken = generateToken()
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

      await db.collection('users').updateOne(
        { id: user.id },
        { 
          $set: { 
            verificationToken,
            verificationTokenExpiry: tokenExpiry,
            updatedAt: new Date()
          }
        }
      )

      // Send verification email
      await sendVerificationEmail(user.email, user.name, verificationToken)

      return handleCORS(NextResponse.json({
        message: 'Verification email sent'
      }))
    }

    // ==================== USER ROUTES ====================

    // Get current user
    if (route === '/user/me' && method === 'GET') {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return handleCORS(NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ))
      }

      const token = authHeader.split(' ')[1]
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
        const user = await db.collection('users').findOne({ id: decoded.userId })
        
        if (!user) {
          return handleCORS(NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          ))
        }

        return handleCORS(NextResponse.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            interests: user.interests
          }
        }))
      } catch (e) {
        return handleCORS(NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        ))
      }
    }

    // Update user interests
    if (route === '/user/interests' && method === 'PUT') {
      const body = await request.json()
      const { userId, interests } = body

      if (!userId || !interests) {
        return handleCORS(NextResponse.json(
          { error: 'User ID and interests are required' },
          { status: 400 }
        ))
      }

      if (!Array.isArray(interests) || interests.length < 3) {
        return handleCORS(NextResponse.json(
          { error: 'Please select at least 3 interests' },
          { status: 400 }
        ))
      }

      // Update user interests
      const result = await db.collection('users').updateOne(
        { id: userId },
        { 
          $set: { 
            interests,
            updatedAt: new Date()
          }
        }
      )

      if (result.matchedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: 'Interests updated successfully',
        interests
      }))
    }

    // Get user's joined flares
    if (route.match(/^\/user\/[^/]+\/flares$/) && method === 'GET') {
      const userId = path[1]

      // Find all flares where user is host or attendee
      const flares = await db.collection('flares')
        .find({
          $or: [
            { 'host.id': userId },
            { 'attendees.id': userId }
          ]
        })
        .sort({ startTime: -1 })
        .limit(50)
        .toArray()

      const cleanedFlares = flares.map(({ _id, ...rest }) => rest)

      return handleCORS(NextResponse.json({
        flares: cleanedFlares
      }))
    }

    // ==================== FLARE ROUTES ====================

    // Create flare
    if (route === '/flares' && method === 'POST') {
      const body = await request.json()
      const { title, description, interests, location, startTime, maxAttendees, hostId, hostName } = body

      if (!title || !description || !interests || !location || !startTime || !maxAttendees) {
        return handleCORS(NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        ))
      }

      const flare = {
        id: uuidv4(),
        title,
        description,
        interests,
        location,
        startTime: new Date(startTime),
        host: { id: hostId, name: hostName },
        attendees: [],
        maxAttendees,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('flares').insertOne(flare)

      return handleCORS(NextResponse.json(flare))
    }

    // Get flares
    if (route === '/flares' && method === 'GET') {
      const url = new URL(request.url)
      const interests = url.searchParams.get('interests')?.split(',') || []
      
      const now = new Date()
      const ninetyMinsFromNow = new Date(now.getTime() + 90 * 60 * 1000)

      const query = {
        startTime: { $gte: now, $lte: ninetyMinsFromNow }
      }

      if (interests.length > 0) {
        query.interests = { $in: interests }
      }

      const flares = await db.collection('flares')
        .find(query)
        .sort({ startTime: 1 })
        .limit(50)
        .toArray()

      const cleanedFlares = flares.map(({ _id, ...rest }) => rest)

      return handleCORS(NextResponse.json(cleanedFlares))
    }

    // Join flare
    if (route.startsWith('/flares/') && route.endsWith('/join') && method === 'POST') {
      const flareId = path[1]
      const body = await request.json()
      const { userId, userName } = body

      const flare = await db.collection('flares').findOne({ id: flareId })

      if (!flare) {
        return handleCORS(NextResponse.json(
          { error: 'Flare not found' },
          { status: 404 }
        ))
      }

      if (flare.attendees.length >= flare.maxAttendees - 1) {
        return handleCORS(NextResponse.json(
          { error: 'Flare is full' },
          { status: 400 }
        ))
      }

      await db.collection('flares').updateOne(
        { id: flareId },
        { 
          $push: { attendees: { id: userId, name: userName } },
          $set: { updatedAt: new Date() }
        }
      )

      return handleCORS(NextResponse.json({ message: 'Joined successfully' }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
