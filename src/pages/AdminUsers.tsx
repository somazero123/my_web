import { useEffect, useState } from "react";
import { Users, Pencil, RefreshCw } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import NoticeModal from "@/components/common/NoticeModal";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";

type Profile = {
  id: string;
  username?: string;
  email?: string;
  display_name: string;
  points_balance: number;
  created_at: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const [editUser, setEditUser] = useState<Profile | undefined>(undefined);
  const [targetPoints, setTargetPoints] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | undefined>(undefined);

  const { impersonatedUserId, setImpersonatedUserId } = useAuthStore();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("superadmin_get_users");
    if (error) {
      setError(error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditPoints = async () => {
    if (!editUser) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("superadmin_set_points", {
      p_user_id: editUser.id,
      p_target: targetPoints,
      p_reason: "超级管理员直接修改",
    });
    setSubmitting(false);

    if (error) {
      setNotice({ kind: "error", text: "修改失败: " + error.message });
      return;
    }

    setNotice({ kind: "success", text: "修改成功" });
    setEditUser(undefined);
    fetchUsers(); // Refresh list
  };

  return (
    <PageShell>
      <div className="grid gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-zinc-900">超级管理后台</div>
            <div className="mt-1 text-sm text-zinc-600">管理所有用户账号、积分及切换视角。</div>
          </div>
          {impersonatedUserId && (
            <Button
              variant="secondary"
              onClick={() => setImpersonatedUserId(undefined)}
            >
              退出切换状态
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[color:var(--z-accent)]" />
              账号列表
            </CardTitle>
            <CardDescription>展示所有已注册账号及当前积分。</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-sm text-zinc-500">加载中...</div>
            ) : error ? (
              <div className="py-10 text-center text-sm text-red-500">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="px-3 py-3 font-semibold text-zinc-900">账号</th>
                      <th className="px-3 py-3 font-semibold text-zinc-900">昵称</th>
                      <th className="px-3 py-3 font-semibold text-zinc-900">积分</th>
                      <th className="px-3 py-3 font-semibold text-zinc-900 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-zinc-100 last:border-0">
                        <td className="px-3 py-3 text-zinc-700">{u.username || u.email || "-"}</td>
                        <td className="px-3 py-3 text-zinc-700">{u.display_name || "-"}</td>
                        <td className="px-3 py-3 font-medium text-[color:var(--z-accent)]">{u.points_balance}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                setEditUser(u);
                                setTargetPoints(u.points_balance);
                              }}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              改积分
                            </Button>
                            <Button
                              variant="secondary"
                              className="h-8 px-2 text-xs"
                              disabled={impersonatedUserId === u.id}
                              onClick={() => {
                                setImpersonatedUserId(u.id);
                              }}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              {impersonatedUserId === u.id ? "当前视角" : "切换视角"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={!!editUser}
        title="修改积分"
        description={`修改账号：${editUser?.username || editUser?.email || ""}`}
        onClose={() => !submitting && setEditUser(undefined)}
      >
        <div className="grid gap-3">
          <div>
            <div className="mb-1 text-xs font-medium text-zinc-700">当前积分：{editUser?.points_balance}</div>
            <div className="mb-1 mt-3 text-xs font-medium text-zinc-700">修改为</div>
            <Input
              type="number"
              min={0}
              step={1}
              value={targetPoints}
              onChange={(e) => setTargetPoints(Number(e.target.value || 0))}
              disabled={submitting}
            />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditUser(undefined)} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleEditPoints} disabled={submitting}>
              {submitting ? "请稍后..." : "确认修改"}
            </Button>
          </div>
        </div>
      </Modal>

      <NoticeModal
        open={!!notice}
        title={notice?.kind === "success" ? "成功" : "错误"}
        description={notice?.text ?? ""}
        onClose={() => setNotice(undefined)}
      />
    </PageShell>
  );
}
