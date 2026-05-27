import { calcularAPU, type Renglon } from '@/data/renglones';

interface RenglonCPM {
  id: string;
  descripcion: string;
  duracionDias: number;
  predecesores: string[];
  sucesores: string[];
  ES: number;
  EF: number;
  LS: number;
  LF: number;
  holgura: number;
  esRutaCritica: boolean;
}

interface RenglonConLinea extends Renglon {
  id?: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
}

export const GanttService = {
  calcularRutaCritica(renglones: RenglonConLinea[], duracionTotalDias: number): RenglonCPM[] {
    if (renglones.length === 0) return [];

    const nodos: RenglonCPM[] = renglones.map((r, i) => {
      const apu = calcularAPU(r);
      const duracion = Math.max(1, Math.round(apu.dias || apu.totalPersonasDia || 1));
      const predecesores: string[] = [];
      if (i > 0) predecesores.push(renglones[i - 1].codigo);
      return {
        id: r.id || r.codigo || String(i),
        descripcion: r.descripcion || r.codigo,
        duracionDias: duracion,
        predecesores,
        sucesores: [],
        ES: 0, EF: 0,
        LS: 0, LF: 0,
        holgura: 0,
        esRutaCritica: false,
      };
    });

    for (const n of nodos) {
      for (const pred of n.predecesores) {
        const p = nodos.find(x => x.id === pred);
        if (p) p.sucesores.push(n.id);
      }
    }

    for (const n of nodos) {
      if (n.predecesores.length === 0) {
        n.ES = 0;
      } else {
        n.ES = Math.max(...n.predecesores.map(p => {
          const pred = nodos.find(x => x.id === p);
          return pred ? pred.EF : 0;
        }));
      }
      n.EF = n.ES + n.duracionDias;
    }

    const proyectoFin = Math.max(...nodos.map(n => n.EF), duracionTotalDias);

    for (let i = nodos.length - 1; i >= 0; i--) {
      const n = nodos[i];
      if (n.sucesores.length === 0) {
        n.LF = proyectoFin;
      } else {
        n.LF = Math.min(...n.sucesores.map(s => {
          const suc = nodos.find(x => x.id === s);
          return suc ? suc.LS : proyectoFin;
        }));
      }
      n.LS = n.LF - n.duracionDias;
      n.holgura = n.LS - n.ES;
      n.esRutaCritica = Math.abs(n.holgura) < 0.5;
    }

    return nodos;
  },
};

export type { RenglonCPM };
