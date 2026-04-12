import { Router, type Request, type Response } from 'express'
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js'

const router = Router()

router.post('/delete-user', async (req: Request, res: Response): Promise<void> => {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    res.status(500).json({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' })
    return
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }

  const me = await supabaseAdmin.auth.getUser(token)
  const meId = me.data.user?.id
  if (me.error || !meId) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }

  const roleRes = await supabaseAdmin.from('profiles').select('role').eq('id', meId).single()
  if (roleRes.error || roleRes.data?.role !== 'superadmin') {
    res.status(403).json({ success: false, error: 'Forbidden' })
    return
  }

  const userId = typeof req.body?.userId === 'string' ? req.body.userId : ''
  if (!userId) {
    res.status(400).json({ success: false, error: 'Missing userId' })
    return
  }
  if (userId === meId) {
    res.status(400).json({ success: false, error: '不能删除当前登录账号' })
    return
  }

  const targetRoleRes = await supabaseAdmin.from('profiles').select('role').eq('id', userId).single()
  if (targetRoleRes.data?.role === 'superadmin') {
    res.status(400).json({ success: false, error: '不能删除超级管理员账号' })
    return
  }

  await supabaseAdmin.from('tasks').delete().eq('user_id', userId)
  await supabaseAdmin.from('points_ledger').delete().eq('user_id', userId)
  await supabaseAdmin.from('redemptions').delete().eq('user_id', userId)
  await supabaseAdmin.from('app_settings').delete().eq('user_id', userId)
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  const delRes = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (delRes.error) {
    res.status(400).json({ success: false, error: delRes.error.message })
    return
  }

  res.status(200).json({ success: true })
})

export default router

