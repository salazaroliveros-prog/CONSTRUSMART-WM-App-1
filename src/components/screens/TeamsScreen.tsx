import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import { toast } from 'sonner';
import { Users, Plus, Trash2, UserPlus, Shield, User, Eye } from 'lucide-react';
import type { Equipo, EquipoMiembro } from '@/types/supabase';

const rolIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  miembro: User,
  visor: Eye,
};

const rolLabels: Record<string, string> = {
  admin: 'Admin',
  miembro: 'Miembro',
  visor: 'Visor',
};

const TeamsScreen: React.FC = () => {
  const { session, equipos, equipoMiembros, addEquipo, addEquipoMiembro, deleteEquipoMiembro } = useAppContext();
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [creando, setCreando] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);

  const equiposConMiembros = useMemo(() => {
    return equipos.map(e => ({
      ...e,
      miembros: equipoMiembros.filter(m => m.equipo_id === e.id)
    }));
  }, [equipos, equipoMiembros]);

  const handleCrear = async () => {
    if (!session) return;

    const nombre = nuevoEquipo.trim();
    if (!nombre || nombre.length < 1) {
      toast.error('El nombre del equipo es requerido');
      return;
    }

    if (!confirm(`¿Estás seguro de crear el equipo "${nombre}"?`)) return;

    setCreando(true);
    try {
      await addEquipo({ nombre, userId: session.user.id });
      toast.success(`Equipo "${nombre}" creado`);
      setNuevoEquipo('');
    } catch (err) {
      toast.error('Error al crear equipo');
      console.error(err);
    } finally {
      setCreando(false);
    }
  };

  const handleInvite = async (equipoId: string) => {
    if (!inviteEmail.trim()) return;
    if (!confirm('¿Confirmas que deseas agregar a este usuario al equipo?')) return;
    try {
      await addEquipoMiembro({
        equipoId,
        userId: inviteEmail.trim(),
        rol: 'miembro',
      });
      toast.success('Miembro agregado');
      setInviteEmail('');
      setInviteTeamId(null);
    } catch (err) {
      toast.error('Error al invitar. Verifica el ID del usuario.');
      console.error(err);
    }
  };

  const handleRemoveMember = async (miembroId: string) => {
    if (!confirm('¿Estás seguro de eliminar a este miembro del equipo? Esta acción no se puede deshacer.')) return;
    try {
      await deleteEquipoMiembro(miembroId);
      toast.success('Miembro removido');
    } catch (err) {
      toast.error('Error al remover miembro');
      console.error(err);
    }
  };

  return (
    <PageShell showHome={false} title="Gestión de Equipos">
      <div className="p-3 sm:p-5 max-w-[1200px] mx-auto space-y-4">
        {/* Crear equipo */}
        <div className="card-standard">
          <h3 className="font-bold text-sm text-card-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-700" /> Crear Nuevo Equipo
          </h3>
          <div className="flex gap-2">
            <input
              value={nuevoEquipo}
              onChange={e => setNuevoEquipo(e.target.value)}
              placeholder="Nombre del equipo"
              className="input-standard"
              onKeyDown={e => e.key === 'Enter' && handleCrear()}
            />
            <button
              onClick={handleCrear}
              disabled={creando || !nuevoEquipo.trim()}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> {creando ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>

        {/* Lista de equipos */}
        {equiposConMiembros.map(eq => (
          <div key={eq.id} className="bg-card dark:bg-card rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 dark:from-blue-900 dark:to-blue-800 text-white p-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> {eq.nombre}
              </h3>
              {eq.user_id === session?.user?.id && (
                <span className="text-[10px] bg-emerald-500 px-2 py-0.5 rounded-full">Propietario</span>
              )}
            </div>

            <div className="p-3">
              {/* Invitar */}
              {eq.user_id === session?.user?.id && (
                <div className="mb-3">
                  {inviteTeamId === eq.id ? (
                    <div className="flex gap-2">
                      <input
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="ID del usuario"
                        className="input-standard"
                        onKeyDown={e => e.key === 'Enter' && handleInvite(eq.id)}
                      />
                      <button onClick={() => handleInvite(eq.id)} className="btn-success">
                        Agregar
                      </button>
                      <button onClick={() => { setInviteTeamId(null); setInviteEmail(''); }} className="btn-ghost">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInviteTeamId(eq.id)}
                      className="btn-ghost text-xs text-blue-600 dark:text-blue-400 font-semibold"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invitar miembro
                    </button>
                  )}
                </div>
              )}

              {/* Miembros */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Miembros ({eq.miembros.length + 1})
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium flex-1 text-card-foreground">Tú (propietario)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold">Admin</span>
                </div>
                {eq.miembros.map(m => {
                  const Icon = rolIcon[m.rol] || User;
                  return (
                    <div key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 text-card-foreground">{m.user_id.slice(0, 8)}...</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">{rolLabels[m.rol]}</span>
                      {eq.user_id === session?.user?.id && (
                        <button onClick={() => handleRemoveMember(m.id)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {equiposConMiembros.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay equipos. Crea uno para empezar a colaborar.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default React.memo(TeamsScreen);
