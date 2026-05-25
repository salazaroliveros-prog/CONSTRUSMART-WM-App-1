import { EquipoSchema } from '@/lib/schemas';
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/shared/Header';
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
  const { session } = useAppContext();
  const [equipos, setEquipos] = useState<(Equipo & { miembros: (EquipoMiembro & { email?: string })[] })[]>([]);
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [creando, setCreando] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);

  const loadEquipos = useCallback(async () => {
    if (!session) return;
    const { data: equiposData } = await supabase.from('equipos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (!equiposData) return;

    const enriched = await Promise.all(equiposData.map(async (e: Equipo) => {
      const { data: miembros } = await supabase.from('equipo_miembros').select('*').eq('equipo_id', e.id);
      return { ...e, miembros: miembros || [] };
    }));
    setEquipos(enriched);
  }, [session]);

  useEffect(() => { if (session) loadEquipos(); }, [session, loadEquipos]);

  const handleCrear = async () => {
    if (!session) return;
    
    // Validación con Zod
    const result = EquipoSchema.safeParse({ nombre: nuevoEquipo.trim() });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!confirm(`¿Estás seguro de crear el equipo "${result.data.nombre}"?`)) return;

    setCreando(true);
    try {
      const { error } = await supabase.from('equipos').insert({
        nombre: result.data.nombre,
        user_id: session.user.id,
        creador_id: session.user.id,
      });
      if (error) throw error;
      toast.success(`Equipo "${result.data.nombre}" creado`);
      setNuevoEquipo('');
      await loadEquipos();
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
      const { error } = await supabase.from('equipo_miembros').insert({
        equipo_id: equipoId,
        user_id: inviteEmail.trim(),
        rol: 'miembro',
      });
      if (error) throw error;
      toast.success('Miembro agregado');
      setInviteEmail('');
      setInviteTeamId(null);
      await loadEquipos();
    } catch (err) {
      toast.error('Error al invitar. Verifica el ID del usuario.');
      console.error(err);
    }
  };

  const handleRemoveMember = async (miembroId: string) => {
    if (!confirm('¿Estás seguro de eliminar a este miembro del equipo? Esta acción no se puede deshacer.')) return;
    try {
      await supabase.from('equipo_miembros').delete().eq('id', miembroId);
      toast.success('Miembro removido');
      await loadEquipos();
    } catch (err) {
      toast.error('Error al remover miembro');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fadeIn">
      <Header title="Gestión de Equipos" />

      <div className="p-3 sm:p-5 max-w-[1200px] mx-auto space-y-4">
        {/* Crear equipo */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-700" /> Crear Nuevo Equipo
          </h3>
          <div className="flex gap-2">
            <input
              value={nuevoEquipo}
              onChange={e => setNuevoEquipo(e.target.value)}
              placeholder="Nombre del equipo"
              className="flex-1 px-3 py-2 text-sm border rounded-lg"
              onKeyDown={e => e.key === 'Enter' && handleCrear()}
            />
            <button
              onClick={handleCrear}
              disabled={creando || !nuevoEquipo.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition"
            >
              <Plus className="w-4 h-4" /> {creando ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>

        {/* Lista de equipos */}
        {equipos.map(eq => (
          <div key={eq.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white p-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> {eq.nombre}
              </h3>
              {eq.creador_id === session?.user?.id && (
                <span className="text-[10px] bg-emerald-500 px-2 py-0.5 rounded-full">Propietario</span>
              )}
            </div>

            <div className="p-3">
              {/* Invitar */}
              {eq.creador_id === session?.user?.id && (
                <div className="mb-3">
                  {inviteTeamId === eq.id ? (
                    <div className="flex gap-2">
                      <input
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="ID del usuario"
                        className="flex-1 px-3 py-1.5 text-xs border rounded"
                        onKeyDown={e => e.key === 'Enter' && handleInvite(eq.id)}
                      />
                      <button onClick={() => handleInvite(eq.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-semibold">
                        Agregar
                      </button>
                      <button onClick={() => { setInviteTeamId(null); setInviteEmail(''); }} className="text-slate-500 px-2 py-1.5 text-xs">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInviteTeamId(eq.id)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Invitar miembro
                    </button>
                  )}
                </div>
              )}

              {/* Miembros */}
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Miembros ({eq.miembros.length + 1})
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-slate-50">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium flex-1">Tú (propietario)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Admin</span>
                </div>
                {eq.miembros.map(m => {
                  const Icon = rolIcon[m.rol] || User;
                  return (
                    <div key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm flex-1">{m.user_id.slice(0, 8)}...</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{rolLabels[m.rol]}</span>
                      {eq.creador_id === session?.user?.id && (
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

        {equipos.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay equipos. Crea uno para empezar a colaborar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsScreen;
