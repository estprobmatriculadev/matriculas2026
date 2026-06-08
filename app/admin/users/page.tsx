"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp, 
  writeBatch 
} from "firebase/firestore";
import AppLayout from "@/components/AppLayout";
import { syncUserSession } from "@/services/userService";
import { normalizarString } from "@/services/userService";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import { 
  Loader2, 
  UserPlus, 
  Users, 
  Trash, 
  Edit3, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  FileSpreadsheet, 
  Info,
  ShieldCheck
} from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("ADMIN");
  const [loading, setLoading] = useState(true);

  // Users List State
  const [users, setUsers] = useState<any[]>([]);

  // Form State
  const [manualUser, setManualUser] = useState({ email: "", role: "TUTOR" });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState("TUTOR");

  // CSV State
  const [csvType, setCsvType] = useState<"users" | "cursistas">("users");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [defaultRole, setDefaultRole] = useState<string>("TUTOR");
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const { role } = await syncUserSession(user);
        if (role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }
        setUserRole(role);
      } catch (err) {
        console.error(err);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Listen to users collection
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const downloadCSVTemplate = (t: "users" | "cursistas") => {
    let headers = "";
    let filename = "";
    if (t === "users") {
      headers = "user;nome;cpf;rg;email;telefone\n";
      filename = "modelo_users.csv";
    } else {
      headers = "user;nome;cpf;rg;cgm;email;modalidade;componente;periodo_ini;turno_suprimento;telefone\n";
      filename = "modelo_cursistas.csv";
    }
    const blob = new Blob([headers], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handlers
  const handleCreateUserManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUser.email) return;

    setErrorMsg("");
    setSuccessMsg("");
    const targetEmail = manualUser.email.trim().toLowerCase();

    try {
      await setDoc(doc(db, "users", targetEmail), {
        email: targetEmail,
        role: manualUser.role,
        createdAt: serverTimestamp()
      }, { merge: true });

      setSuccessMsg(`Usuário ${targetEmail} adicionado com a função ${manualUser.role}.`);
      setManualUser({ email: "", role: "TUTOR" });
    } catch (err: any) {
      setErrorMsg("Erro ao cadastrar usuário: " + err.message);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    try {
      await setDoc(doc(db, "users", userId), {
        role: editingRole,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setEditingUserId(null);
      setSuccessMsg("Função de usuário atualizada com sucesso.");
    } catch (err: any) {
      setErrorMsg("Erro ao atualizar função: " + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(`Deseja realmente remover o acesso de ${userId}?`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setSuccessMsg("Usuário removido com sucesso.");
    } catch (err: any) {
      setErrorMsg("Erro ao remover usuário: " + err.message);
    }
  };

  // CSV Parsing
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const rawRows = results.data;
        const mapped = rawRows.map((row: any) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key];
          });
          return normalizedRow;
        }).filter((row: any) => row.email && String(row.email).trim() !== "");

        setCsvData(mapped);
      },
      error: (err) => {
        setErrorMsg("Erro ao analisar arquivo CSV: " + err.message);
      }
    });
  };

  const handleProcessCSV = async () => {
    if (csvData.length === 0) return;
    setImporting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const batch = writeBatch(db);

    try {
      if (csvType === "users") {
        // Import users to the 'users' collection
        csvData.forEach((item) => {
          const email = String(item.email).trim().toLowerCase();
          const ref = doc(db, "users", email);
          batch.set(ref, {
            email: email,
            role: defaultRole,
            displayName: item.nome ? normalizarString(String(item.nome)) : "",
            cpf: item.cpf ? String(item.cpf).replace(/\D/g, "") : "",
            rg: item.rg ? String(item.rg) : "",
            telefone: item.telefone ? String(item.telefone) : "",
            updatedAt: serverTimestamp()
          }, { merge: true });
        });
      } else {
        // Import cursistas to the 'cursistas' collection mapping legacy fields
        csvData.forEach((item) => {
          const email = String(item.email).trim().toLowerCase();
          const ref = doc(db, "cursistas", email);
          const nomeNorm = item.nome ? normalizarString(String(item.nome)) : "";
          
          batch.set(ref, {
            email: email,
            EmailGoogleEducation: email,
            user: item.user ? String(item.user).trim() : email.split("@")[0],
            nome: nomeNorm,
            DiscFuncExeNome: nomeNorm,
            cpf: item.cpf ? String(item.cpf).replace(/\D/g, "") : "",
            Cpf: item.cpf ? String(item.cpf).replace(/\D/g, "") : "",
            CPF: item.cpf ? String(item.cpf).replace(/\D/g, "") : "",
            rg: item.rg ? String(item.rg) : "",
            Rg: item.rg ? String(item.rg) : "",
            RG: item.rg ? String(item.rg) : "",
            cgm: item.cgm ? String(item.cgm) : "",
            modalidade: item.modalidade ? normalizarString(String(item.modalidade)) : "",
            componente: item.componente ? normalizarString(String(item.componente)) : "",
            periodo_ini: item.periodo_ini ? String(item.periodo_ini) : "",
            turno_suprimento: item.turno_suprimento ? normalizarString(String(item.turno_suprimento)) : "",
            telefone: item.telefone ? String(item.telefone) : "",
            TelefoneCelular: item.telefone ? String(item.telefone) : "",
            updatedAt: serverTimestamp()
          }, { merge: true });
        });
      }

      await batch.commit();
      setSuccessMsg(`Importação concluída com sucesso! ${csvData.length} registros inseridos.`);
      setCsvData([]);
    } catch (err: any) {
      setErrorMsg("Erro ao processar importação no banco de dados: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  // Stats
  const statTotal = users.length;
  const statAdmins = users.filter(u => u.role === "ADMIN").length;
  const statTecnicos = users.filter(u => u.role === "TECNICO").length;
  const statTutores = users.filter(u => u.role === "TUTOR").length;

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <AppLayout userRole={userRole}>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        <header>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <ShieldCheck className="text-secondary" size={32} />
            Controle de Usuários e Acesso
          </h1>
          <p className="text-on-surface-variant">Gerencie papéis administrativos de acesso ao portal e importe a base de estudantes cursistas.</p>
        </header>

        {/* Feedback Cards */}
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircle2 size={18} />
            <span className="text-xs font-bold">{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="ml-auto text-xs underline">Fechar</button>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 text-red-700 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle size={18} />
            <span className="text-xs font-bold">{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="ml-auto text-xs underline">Fechar</button>
          </motion.div>
        )}

        {/* Access Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest border border-surface-border p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Total Cadastrados</p>
              <p className="text-2xl font-black text-primary">{statTotal}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-surface-border p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-red-500/5 rounded-2xl flex items-center justify-center text-red-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Administradores</p>
              <p className="text-2xl font-black text-primary">{statAdmins}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-surface-border p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-blue-500/5 rounded-2xl flex items-center justify-center text-blue-600">
              <UserPlus size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Técnicos</p>
              <p className="text-2xl font-black text-primary">{statTecnicos}</p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-surface-border p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-amber-500/5 rounded-2xl flex items-center justify-center text-amber-600">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Tutores</p>
              <p className="text-2xl font-black text-primary">{statTutores}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Users manually / Upload CSV */}
          <div className="lg:col-span-1 space-y-6">
            {/* Manual Insert Card */}
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-border shadow-sm">
              <h3 className="text-sm font-bold text-primary uppercase mb-6 flex items-center gap-2">
                <UserPlus size={16} /> Cadastrar Manualmente
              </h3>
              <form onSubmit={handleCreateUserManual} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase ml-1">E-mail Institucional</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="exemplo@escola.pr.gov.br"
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    value={manualUser.email}
                    onChange={e => setManualUser({...manualUser, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase ml-1">Função de Acesso</label>
                  <select 
                    className="w-full bg-surface-container-low border border-surface-border rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    value={manualUser.role}
                    onChange={e => setManualUser({...manualUser, role: e.target.value})}
                  >
                    <option value="CURSISTA">CURSISTA</option>
                    <option value="TUTOR">TUTOR</option>
                    <option value="TECNICO">TECNICO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 bg-primary text-on-primary text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md">
                  Incluir Usuário
                </button>
              </form>
            </div>

            {/* CSV Import Card */}
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] border border-surface-border shadow-sm">
              <div className="flex bg-surface-container p-1 rounded-xl border border-surface-border mb-6">
                <button 
                  onClick={() => { setCsvType("users"); setCsvData([]); }}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${csvType === "users" ? "bg-primary text-on-primary" : "text-primary hover:bg-primary/5"}`}
                >
                  Importar Usuários
                </button>
                <button 
                  onClick={() => { setCsvType("cursistas"); setCsvData([]); }}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${csvType === "cursistas" ? "bg-primary text-on-primary" : "text-primary hover:bg-primary/5"}`}
                >
                  Importar Cursistas
                </button>
              </div>

              <h3 className="text-sm font-bold text-primary uppercase mb-2 flex items-center gap-2">
                <Upload size={16} /> Upload de Arquivo CSV
              </h3>
              <p className="text-[10px] text-on-surface-variant mb-4 leading-relaxed">
                {csvType === "users" 
                  ? "Importe usuários no formato de modelo_users.csv (user;nome;cpf;rg;email;telefone)." 
                  : "Importe estudantes no formato de modelo_cursistas.csv (user;nome;cpf;rg;cgm;email;modalidade;componente;periodo_ini;turno_suprimento;telefone)."
                }
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <button 
                  type="button"
                  onClick={() => downloadCSVTemplate("users")}
                  className="px-4 py-2 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-full hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={12} /> Modelo CSV Usuários
                </button>
                <button 
                  type="button"
                  onClick={() => downloadCSVTemplate("cursistas")}
                  className="px-4 py-2 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-full hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={12} /> Modelo CSV Cursistas
                </button>
              </div>

              <label className="block mb-6 cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="block w-full text-xs text-on-surface-variant
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-[10px] file:font-bold
                    file:bg-secondary-container file:text-on-secondary-container
                    hover:file:opacity-90"
                />
              </label>

              {csvType === "users" && csvData.length > 0 && (
                <div className="space-y-4 mb-6 bg-surface-container-low p-4 rounded-xl">
                  <label className="text-[10px] font-bold text-primary uppercase">Função a atribuir a todos</label>
                  <select 
                    className="w-full bg-white border border-surface-border rounded-xl px-4 py-2 text-xs outline-none"
                    value={defaultRole}
                    onChange={e => setDefaultRole(e.target.value)}
                  >
                    <option value="TUTOR">TUTOR</option>
                    <option value="TECNICO">TECNICO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              )}

              {csvData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-medium">Registros Prontos:</span>
                    <span className="font-black text-primary">{csvData.length}</span>
                  </div>
                  <button 
                    onClick={handleProcessCSV}
                    disabled={importing}
                    className="w-full py-3 bg-secondary text-on-secondary text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-40"
                  >
                    {importing ? <Loader2 className="animate-spin" size={14} /> : <><FileSpreadsheet size={14} /> Importar Agora</>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Users List (Right) */}
          <div className="lg:col-span-2">
            <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-border shadow-sm overflow-hidden h-[600px] flex flex-col">
              <div className="px-8 py-5 border-b border-surface-border bg-surface-container-low flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> Lista de Perfis Administrativos
                </span>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-surface-container-low text-primary font-bold">
                      <th className="px-4 py-3 rounded-l-xl">E-mail</th>
                      <th className="px-4 py-3">Papel / Função</th>
                      <th className="px-4 py-3 rounded-r-xl text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3 font-semibold">{u.email}</td>
                        <td className="px-4 py-3">
                          {editingUserId === u.id ? (
                            <select 
                              className="bg-white border border-surface-border rounded-lg px-2 py-1 text-xs outline-none"
                              value={editingRole}
                              onChange={e => setEditingRole(e.target.value)}
                            >
                              <option value="CURSISTA">CURSISTA</option>
                              <option value="TUTOR">TUTOR</option>
                              <option value="TECNICO">TECNICO</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              u.role === "ADMIN" 
                                ? "bg-red-500/10 text-red-600" 
                                : u.role === "TECNICO"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : u.role === "TUTOR"
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-surface-container text-on-surface-variant"
                            }`}>
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {editingUserId === u.id ? (
                              <button 
                                onClick={() => handleUpdateRole(u.id)}
                                className="p-1.5 bg-emerald-500 text-white rounded-lg hover:scale-105 transition-transform"
                              >
                                <Check size={14} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => { setEditingUserId(u.id); setEditingRole(u.role); }}
                                className="p-1.5 bg-surface-container text-primary rounded-lg hover:scale-105 transition-transform"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={auth.currentUser?.email?.toLowerCase() === u.email.toLowerCase()}
                              className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
