import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { resolveUniversity, getDomainFromEmail } from '@/lib/universities'

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

// One-time backfill so legacy users/flares work with the new
// university-domain filtering. Runs idempotently on the first request
// after each server start.
let migrated = false
async function ensureMigrated(db) {
  if (migrated) return
  try {
    // Backfill emailDomain on users
    const legacyUsers = await db.collection('users')
      .find({ emailDomain: { $exists: false } })
      .project({ id: 1, email: 1 })
      .toArray()
    for (const u of legacyUsers) {
      const domain = getDomainFromEmail(u.email)
      if (domain) {
        await db.collection('users').updateOne(
          { id: u.id },
          { $set: { emailDomain: domain } }
        )
      }
    }

    // Backfill hostEmailDomain on flares by looking up the host user
    const legacyFlares = await db.collection('flares')
      .find({ hostEmailDomain: { $exists: false } })
      .toArray()
    for (const flare of legacyFlares) {
      const hostId = flare?.host?.id
      if (!hostId) continue
      const host = await db.collection('users').findOne(
        { id: hostId },
        { projection: { email: 1, emailDomain: 1 } }
      )
      const domain = host?.emailDomain || getDomainFromEmail(host?.email)
      if (domain) {
        await db.collection('flares').updateOne(
          { id: flare.id },
          { $set: { hostEmailDomain: domain } }
        )
      }
    }

    // Ensure indexes for chat (idempotent — createIndex is a no-op if exists)
    await db.collection('messages').createIndex({ flareId: 1, createdAt: 1 })
    await db.collection('messages').createIndex({ id: 1 }, { unique: true })

    // Ensure indexes for signup OTPs.
    // TTL auto-cleans expired pending signups; unique keeps one active per email.
    await db.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    await db.collection('otps').createIndex({ email: 1 }, { unique: true })
  } catch (e) {
    console.error('Migration warning (non-fatal):', e)
  } finally {
    migrated = true
  }
}

// Helper: verify that `userId` can access `flareId`'s chat.
// Rule (per product spec): only the host or an attendee of the flare may
// read/write the chat. University scoping is already enforced by the
// feed endpoint (`GET /flares`), so no additional domain check is done
// here — that was causing false 403s for legacy flares that lack a
// stamped hostEmailDomain.
async function assertFlareChatAccess(db, flareId, userId) {
  if (!userId) return { ok: false, status: 401, error: 'userId is required' }
  const flare = await db.collection('flares').findOne({ id: flareId })
  if (!flare) return { ok: false, status: 404, error: 'Flare not found' }

  const user = await db.collection('users').findOne(
    { id: userId },
    { projection: { id: 1, name: 1, email: 1, emailDomain: 1 } }
  )
  if (!user) return { ok: false, status: 401, error: 'User not found' }

  const isHost = flare?.host?.id === userId
  const isAttendee = Array.isArray(flare.attendees) && flare.attendees.some(a => a.id === userId)
  if (!isHost && !isAttendee) {
    return { ok: false, status: 403, error: 'Join this iFlare to see its chat' }
  }
  return { ok: true, flare, user }
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
      from: 'iFLARE <noreply@iflare.fun>',
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

// ---------- Signup OTP helpers ----------

// 6-digit numeric OTP.
function generateOtp() {
  // 100000..999999 inclusive
  const n = 100000 + crypto.randomInt(0, 900000)
  return String(n)
}

// SHA-256 hash of OTP (kept out of DB in plaintext).
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex')
}

// Send the OTP email via Resend. Returns { success, error }.
async function sendOtpEmail(email, name, otp) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'iFLARE <noreply@iflare.fun>',
      to: [email],
      subject: `${otp} is your iFLARE verification code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#f97316;font-size:28px;margin:0;">iFLARE</h1>
              <p style="color:#94a3b8;font-size:13px;margin-top:6px;">Real connections. Right now.</p>
            </div>
            <div style="background:#0b1220;border:1px solid #1f2937;border-radius:14px;padding:28px;">
              <h2 style="color:#fff;font-size:20px;margin:0 0 12px 0;">Hi ${name || 'there'},</h2>
              <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 20px 0;">
                Use the following one-time code to verify your email and finish creating your iFLARE account.
              </p>
              <div style="text-align:center;padding:20px;background:#111827;border:1px solid #1f2937;border-radius:12px;margin:0 0 20px 0;">
                <div style="color:#f97316;font-size:34px;font-weight:700;letter-spacing:10px;">${otp}</div>
              </div>
              <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
                This code expires in <strong style="color:#94a3b8;">10 minutes</strong> and can be used only once.
                If you did not request this, you can safely ignore this email.
              </p>
            </div>
            <p style="color:#475569;font-size:11px;text-align:center;margin-top:24px;">
              Sent by iFLARE — please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `
    })
    if (error) {
      console.error('OTP Resend error:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error('OTP send error:', error)
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
    await ensureMigrated(db)

    // Root endpoint
    if ((route === '/root' || route === '/') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "iFLARE API" }))
    }

    // ==================== AUTH ROUTES ====================

    // Register new user
    // ---- Deprecated: /auth/register now requires OTP verification ----
    // Old direct-signup endpoint is closed to prevent domain-only fabrication.
    if (route === '/auth/register' && method === 'POST') {
      return handleCORS(NextResponse.json(
        { error: 'This endpoint is no longer used. Please use /auth/signup/start and /auth/signup/verify.' },
        { status: 410 }
      ))
    }

    // ============ SIGNUP OTP FLOW ============
    // Step 1: /auth/signup/start
    //   Validates all inputs (domain, password, interests, email uniqueness),
    //   stores a pending-signup keyed by email, and emails a 6-digit OTP.
    // Step 2: /auth/signup/verify
    //   Compares OTP; on success creates the user with isVerified=true and
    //   returns the same { user, token } shape login uses. Old /auth/login
    //   flow is untouched.
    // Step 3: /auth/signup/resend
    //   Rate-limited resend of the OTP for an existing pending signup.

    if (route === '/auth/signup/start' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const { name, email, password, interests } = body

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

      // Same institutional-domain gate as before.
      const uni = resolveUniversity(email)
      if (!uni.valid) {
        return handleCORS(NextResponse.json(
          { error: uni.reason || 'Please register with a valid Indian university email address.' },
          { status: 400 }
        ))
      }

      const normalizedEmail = email.toLowerCase().trim()

      // Uniqueness check against verified accounts.
      const existing = await db.collection('users').findOne({ email: normalizedEmail })
      if (existing) {
        return handleCORS(NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        ))
      }

      // Rate-limit: no more than one OTP per 30s for this email.
      const existingOtp = await db.collection('otps').findOne({ email: normalizedEmail })
      if (existingOtp && existingOtp.lastSentAt) {
        const elapsed = Date.now() - new Date(existingOtp.lastSentAt).getTime()
        if (elapsed < 30 * 1000) {
          const waitS = Math.ceil((30 * 1000 - elapsed) / 1000)
          return handleCORS(NextResponse.json(
            { error: `Please wait ${waitS}s before requesting another code.` },
            { status: 429 }
          ))
        }
      }

      const otp = generateOtp()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000) // 10 min

      const pendingSignup = {
        name: name.trim(),
        passwordHash: hashPassword(password),
        interests,
        emailDomain: uni.domain,
        university: uni.name,
      }

      await db.collection('otps').updateOne(
        { email: normalizedEmail },
        {
          $set: {
            email: normalizedEmail,
            otpHash: hashOtp(otp),
            expiresAt,
            attempts: 0,
            lastSentAt: now,
            pendingSignup,
            updatedAt: now,
          },
          $setOnInsert: {
            id: uuidv4(),
            createdAt: now,
            resends: 0,
            resendWindowStart: now,
          },
        },
        { upsert: true }
      )

      const mailResult = await sendOtpEmail(normalizedEmail, pendingSignup.name, otp)
      if (!mailResult.success) {
        // Roll back so the user isn't stuck with a fake pending state.
        await db.collection('otps').deleteOne({ email: normalizedEmail })
        return handleCORS(NextResponse.json(
          { error: 'Could not send verification email. Please try again.' },
          { status: 502 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: 'OTP sent',
        email: normalizedEmail,
        expiresInSec: 600,
      }))
    }

    if (route === '/auth/signup/verify' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const { email, otp } = body

      if (!email || !otp) {
        return handleCORS(NextResponse.json(
          { error: 'Email and OTP are required' },
          { status: 400 }
        ))
      }

      const normalizedEmail = String(email).toLowerCase().trim()
      const otpStr = String(otp).trim()

      const record = await db.collection('otps').findOne({ email: normalizedEmail })
      if (!record) {
        return handleCORS(NextResponse.json(
          { error: 'No pending signup for this email. Please start again.' },
          { status: 404 }
        ))
      }

      if (new Date(record.expiresAt).getTime() < Date.now()) {
        await db.collection('otps').deleteOne({ email: normalizedEmail })
        return handleCORS(NextResponse.json(
          { error: 'This code has expired. Please request a new one.' },
          { status: 410 }
        ))
      }

      if ((record.attempts || 0) >= 5) {
        await db.collection('otps').deleteOne({ email: normalizedEmail })
        return handleCORS(NextResponse.json(
          { error: 'Too many incorrect attempts. Please start signup again.' },
          { status: 429 }
        ))
      }

      if (hashOtp(otpStr) !== record.otpHash) {
        await db.collection('otps').updateOne(
          { email: normalizedEmail },
          { $inc: { attempts: 1 } }
        )
        const left = 5 - ((record.attempts || 0) + 1)
        return handleCORS(NextResponse.json(
          { error: `Incorrect code. ${left > 0 ? `${left} attempt${left === 1 ? '' : 's'} left.` : ''}`.trim() },
          { status: 400 }
        ))
      }

      // Re-check uniqueness at the last moment (race safety).
      const dup = await db.collection('users').findOne({ email: normalizedEmail })
      if (dup) {
        await db.collection('otps').deleteOne({ email: normalizedEmail })
        return handleCORS(NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        ))
      }

      const ps = record.pendingSignup || {}
      const nowD = new Date()
      const user = {
        id: uuidv4(),
        name: ps.name,
        email: normalizedEmail,
        password: ps.passwordHash,
        interests: ps.interests || [],
        emailDomain: ps.emailDomain,
        university: ps.university,
        isVerified: true,
        verifiedAt: nowD,
        createdAt: nowD,
        updatedAt: nowD,
      }
      await db.collection('users').insertOne(user)
      await db.collection('otps').deleteOne({ email: normalizedEmail })

      const sessionToken = generateSessionToken(user.id)
      return handleCORS(NextResponse.json({
        message: 'Verification successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          interests: user.interests,
          university: user.university,
          emailDomain: user.emailDomain,
        },
        token: sessionToken,
      }))
    }

    if (route === '/auth/signup/resend' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const { email } = body
      if (!email) {
        return handleCORS(NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        ))
      }
      const normalizedEmail = String(email).toLowerCase().trim()
      const record = await db.collection('otps').findOne({ email: normalizedEmail })
      if (!record) {
        return handleCORS(NextResponse.json(
          { error: 'No pending signup for this email. Please start again.' },
          { status: 404 }
        ))
      }

      const nowMs = Date.now()

      // 60-second cooldown between sends.
      if (record.lastSentAt) {
        const elapsed = nowMs - new Date(record.lastSentAt).getTime()
        if (elapsed < 60 * 1000) {
          const waitS = Math.ceil((60 * 1000 - elapsed) / 1000)
          return handleCORS(NextResponse.json(
            { error: `Please wait ${waitS}s before requesting another code.` },
            { status: 429 }
          ))
        }
      }

      // Max 5 resends per rolling hour.
      const windowStart = record.resendWindowStart ? new Date(record.resendWindowStart).getTime() : 0
      const hourAgo = nowMs - 60 * 60 * 1000
      const withinWindow = windowStart > hourAgo
      const nextCount = withinWindow ? (record.resends || 0) + 1 : 1
      if (withinWindow && (record.resends || 0) >= 5) {
        return handleCORS(NextResponse.json(
          { error: 'Too many resend attempts. Please try again later.' },
          { status: 429 }
        ))
      }

      const otp = generateOtp()
      const nowD = new Date()
      const expiresAt = new Date(nowMs + 10 * 60 * 1000)

      await db.collection('otps').updateOne(
        { email: normalizedEmail },
        {
          $set: {
            otpHash: hashOtp(otp),
            expiresAt,
            attempts: 0,
            lastSentAt: nowD,
            resends: nextCount,
            resendWindowStart: withinWindow ? record.resendWindowStart : nowD,
            updatedAt: nowD,
          },
        }
      )

      const mailResult = await sendOtpEmail(normalizedEmail, record?.pendingSignup?.name || '', otp)
      if (!mailResult.success) {
        return handleCORS(NextResponse.json(
          { error: 'Could not send verification email. Please try again.' },
          { status: 502 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: 'OTP resent',
        email: normalizedEmail,
        expiresInSec: 600,
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

      // Reject blocked personal-email domains (gmail, yahoo, outlook etc.)
      // even at login-time, in case any legacy accounts slip through.
      const uni = resolveUniversity(email)
      if (!uni.valid) {
        return handleCORS(NextResponse.json(
          { error: uni.reason || 'This email domain is not allowed on iFLARE.' },
          { status: 403 }
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
          interests: user.interests,
          university: user.university || null,
          emailDomain: user.emailDomain || getDomainFromEmail(user.email)
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
            interests: user.interests,
            university: user.university || null,
            emailDomain: user.emailDomain || getDomainFromEmail(user.email)
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

    // Get user's activity (created and joined flares)
    if (route.match(/^\/user\/[^/]+\/activity$/) && method === 'GET') {
      const userId = path[1]

      // Find flares created by user
      const createdFlares = await db.collection('flares')
        .find({ 'host.id': userId })
        .sort({ startTime: -1 })
        .limit(50)
        .toArray()

      // Find flares joined by user (where user is in attendees, not host)
      const joinedFlares = await db.collection('flares')
        .find({ 
          'attendees.id': userId,
          'host.id': { $ne: userId }
        })
        .sort({ startTime: -1 })
        .limit(50)
        .toArray()

      const cleanCreated = createdFlares.map(({ _id, ...rest }) => rest)
      const cleanJoined = joinedFlares.map(({ _id, ...rest }) => rest)

      return handleCORS(NextResponse.json({
        created: cleanCreated,
        joined: cleanJoined
      }))
    }

    // Update user settings (interests + visibility)
    if (route === '/user/settings' && method === 'PUT') {
      const body = await request.json()
      const { userId, interests, visibilityMode } = body

      if (!userId) {
        return handleCORS(NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        ))
      }

      if (interests && (!Array.isArray(interests) || interests.length < 3)) {
        return handleCORS(NextResponse.json(
          { error: 'Please select at least 3 interests' },
          { status: 400 }
        ))
      }

      const updateFields = { updatedAt: new Date() }
      if (interests) updateFields.interests = interests
      if (visibilityMode) updateFields.visibilityMode = visibilityMode

      const result = await db.collection('users').updateOne(
        { id: userId },
        { $set: updateFields }
      )

      if (result.matchedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: 'Settings updated successfully',
        interests,
        visibilityMode
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

      // Look up host to determine their university (email) domain so the
      // flare stays scoped to their campus community.
      let hostEmailDomain = null
      let hostUniversity = null
      if (hostId) {
        const hostUser = await db.collection('users').findOne(
          { id: hostId },
          { projection: { email: 1, emailDomain: 1, university: 1 } }
        )
        hostEmailDomain = hostUser?.emailDomain || getDomainFromEmail(hostUser?.email) || null
        hostUniversity = hostUser?.university || null
      }

      const flare = {
        id: uuidv4(),
        title,
        description,
        interests,
        location,
        startTime: new Date(startTime),
        host: { id: hostId, name: hostName },
        hostEmailDomain,
        hostUniversity,
        attendees: [],
        maxAttendees,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('flares').insertOne(flare)

      const { _id, ...cleaned } = flare
      return handleCORS(NextResponse.json(cleaned))
    }

    // Get flares - scoped to the requesting user's university (email domain)
    if (route === '/flares' && method === 'GET') {
      const url = new URL(request.url)
      const interests = url.searchParams.get('interests')?.split(',') || []
      const userId = url.searchParams.get('userId')

      // Resolve the requester's email domain so we can restrict visibility
      let userDomain = null
      if (userId) {
        const requester = await db.collection('users').findOne(
          { id: userId },
          { projection: { email: 1, emailDomain: 1 } }
        )
        userDomain = requester?.emailDomain || getDomainFromEmail(requester?.email) || null
      }

      // Build query - get all flares (frontend will filter by time)
      const query = {}

      if (interests.length > 0 && interests[0] !== '') {
        query.interests = { $in: interests }
      }

      // Scope by university (email domain) when we know it
      if (userDomain) {
        query.hostEmailDomain = userDomain
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
      const { userId, userName, flareData } = body

      // Check if flare exists in database
      let flare = await db.collection('flares').findOne({ id: flareId })

      // If flare doesn't exist but we have flare data (from sample data), create it
      if (!flare && flareData) {
        flare = {
          id: flareId,
          title: flareData.title,
          description: flareData.description,
          interests: flareData.interests,
          location: flareData.location,
          startTime: new Date(flareData.startTime),
          host: flareData.host,
          attendees: flareData.attendees || [],
          maxAttendees: flareData.maxAttendees,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        await db.collection('flares').insertOne(flare)
      }

      if (!flare) {
        return handleCORS(NextResponse.json(
          { error: 'Flare not found' },
          { status: 404 }
        ))
      }

      // Check if user already joined
      const alreadyJoined = flare.attendees?.some(a => a.id === userId)
      if (alreadyJoined) {
        return handleCORS(NextResponse.json({ message: 'Already joined' }))
      }

      if (flare.attendees && flare.attendees.length >= flare.maxAttendees - 1) {
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

    // ==================== FLARE CHAT ROUTES ====================

    // GET messages for a flare (host + attendees only, same email domain).
    // Optional ?since=<ISO> returns only newer messages for polling.
    // Otherwise returns the latest 100.
    if (route.match(/^\/flares\/[^/]+\/messages$/) && method === 'GET') {
      const flareId = path[1]
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      const sinceRaw = url.searchParams.get('since')

      const access = await assertFlareChatAccess(db, flareId, userId)
      if (!access.ok) {
        return handleCORS(NextResponse.json(
          { error: access.error },
          { status: access.status }
        ))
      }

      const query = { flareId }
      if (sinceRaw) {
        const since = new Date(sinceRaw)
        if (!isNaN(since.getTime())) {
          query.createdAt = { $gt: since }
        }
      }

      // Newest 100 messages when no cursor; ascending on wire so client
      // renders bottom-up naturally.
      const messages = await db.collection('messages')
        .find(query)
        .sort({ createdAt: sinceRaw ? 1 : -1 })
        .limit(100)
        .toArray()

      const ordered = sinceRaw ? messages : messages.reverse()
      const cleaned = ordered.map(({ _id, ...rest }) => rest)

      return handleCORS(NextResponse.json({ messages: cleaned }))
    }

    // POST a new message to a flare (host + attendees only, same domain).
    if (route.match(/^\/flares\/[^/]+\/messages$/) && method === 'POST') {
      const flareId = path[1]
      const body = await request.json().catch(() => ({}))
      const { userId, text } = body

      const access = await assertFlareChatAccess(db, flareId, userId)
      if (!access.ok) {
        return handleCORS(NextResponse.json(
          { error: access.error },
          { status: access.status }
        ))
      }

      const trimmed = typeof text === 'string' ? text.trim() : ''
      if (!trimmed) {
        return handleCORS(NextResponse.json(
          { error: 'Message text is required' },
          { status: 400 }
        ))
      }
      if (trimmed.length > 1000) {
        return handleCORS(NextResponse.json(
          { error: 'Message is too long (max 1000 characters)' },
          { status: 400 }
        ))
      }

      const now = new Date()
      const message = {
        id: uuidv4(),
        flareId,
        senderId: access.user.id,
        senderName: access.user.name,
        text: trimmed,
        createdAt: now,
      }

      await db.collection('messages').insertOne(message)

      const { _id, ...cleaned } = message
      return handleCORS(NextResponse.json({ message: cleaned }))
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
