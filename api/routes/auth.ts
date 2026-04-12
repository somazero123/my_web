/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

const router = Router()

function normalizeUsername(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.length > 128) return null
  return trimmed
}

function usernameKeyOf(username: string): string {
  return username.trim().toLowerCase()
}

function usernameKeyToEmail(usernameKey: string): string {
  const hash = crypto.createHash('sha256').update(usernameKey, 'utf8').digest('base64')
  const b64url = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  return `u_${b64url}@accounts.local`
}

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    res.status(500).json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' })
    return
  }

  const username = normalizeUsername(req.body?.username)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!username) {
    res.status(400).json({ success: false, error: '用户名不能为空（最多 128 字）' })
    return
  }
  if (!password || password.length < 6) {
    res.status(400).json({ success: false, error: '密码至少 6 位' })
    return
  }

  const usernameKey = usernameKeyOf(username)

  const existsRes = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username_key', usernameKey)
    .limit(1)
  if (existsRes.data && existsRes.data.length > 0) {
    res.status(409).json({ success: false, error: '用户名已存在' })
    return
  }

  const email = usernameKeyToEmail(usernameKey)

  const createRes = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, username_key: usernameKey, display_name: '' },
  })
  if (createRes.error || !createRes.data.user) {
    res.status(400).json({ success: false, error: createRes.error?.message || '注册失败' })
    return
  }

  res.status(200).json({
    success: true,
    userId: createRes.data.user.id,
    username,
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const body = req.body
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    received: body ?? null,
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const body = req.body
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    received: body ?? null,
  })
})

export default router
