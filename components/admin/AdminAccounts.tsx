"use client";
import { useEffect, useState } from "react";
import { Card, Btn, Input } from "@/components/ui/atoms";
import { rpc } from "@/lib/helpers";
import { ShieldCheck, Crown } from "lucide-react";

type Acc = { id: string; email: string; name: string; role: string };

export default function AdminAccounts() {
  const [isSuper, setSuper] = useState(false);
  const [accs, setAccs] = useState<Acc[]>([]);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("");
  const load = async () => { const { data } = await rpc("list_accounts", {}); setAccs((data as Acc[]) || []); };
  useEffect(() => { rpc("is_superadmin", {}).then(({ data }) => { if (data) { setSuper(true); load(); } }); }, []);
  if (!isSuper) return null;
  const setRole = async (email: string, role: string) => {
    const { error } = await rpc("set_account_role", { p_email: email, p_role: role });
    setMsg(error ? error.message : `${email} → ${role === "admin" ? "administrador" : "miembro"}`); load();
  };
  const shown = accs.filter((a) => a.email.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1"><Crown size={16} className="text-amber-500" /><h3 className="font-bold text-navy tracking-tight">Administradores</h3></div>
      <p className="text-sm text-slate-400 font-medium mb-3">Como superadmin, decides quién tiene acceso al panel de padres.</p>
      <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar por email…" className="mb-3" />
      <div className="space-y-2">
        {shown.map((a) => (
          <div key={a.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-navy text-sm truncate">{a.email}</div>
              <div className="text-xs text-slate-400">{a.role === "superadmin" ? "Superadmin" : a.role === "admin" ? "Administrador" : "Miembro"}</div>
            </div>
            {a.role === "superadmin" ? (
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1"><Crown size={14} /> Tú</span>
            ) : a.role === "admin" ? (
              <Btn variant="ghost" className="text-sm py-1.5 px-3" onClick={() => setRole(a.email, "member")}>Quitar admin</Btn>
            ) : (
              <Btn variant="dark" className="text-sm py-1.5 px-3 flex items-center gap-1.5" onClick={() => setRole(a.email, "admin")}><ShieldCheck size={14} /> Hacer admin</Btn>
            )}
          </div>
        ))}
        {shown.length === 0 && <p className="text-slate-400 text-sm font-medium text-center py-3">Sin cuentas que mostrar.</p>}
      </div>
      {msg && <p className="text-sm font-semibold text-teal mt-3">{msg}</p>}
    </Card>
  );
}
