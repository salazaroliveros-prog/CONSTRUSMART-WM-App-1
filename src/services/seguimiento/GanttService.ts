import { calcularAPU, type Renglon } from '@/data/renglones';

export interface RenglonCPM {
  id: string;
  codigo: string;
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
  id: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
}

export interface Dependencia {
  predecesor: string;
  sucesor: string;
}

function buildNodos(renglones: RenglonConLinea[], dependencias: Dependencia[]): RenglonCPM[] {
  const nodos: RenglonCPM[] = renglones.map((r) => {
    const apu = calcularAPU(r);
    const duracion = Math.max(1, Math.ceil(apu.dias || apu.totalPersonasDia || 1));
    return {
      id: r.id || r.codigo,
      codigo: r.codigo,
      descripcion: r.descripcion || r.codigo,
      duracionDias: duracion,
      predecesores: [] as string[],
      sucesores: [] as string[],
      ES: 0, EF: 0, LS: 0, LF: 0,
      holgura: 0, esRutaCritica: false,
    };
  });

  const idx = new Map(nodos.map(n => [n.id, n]));

  for (const dep of dependencias) {
    const pred = idx.get(dep.predecesor);
    const suc = idx.get(dep.sucesor);
    if (pred && suc) {
      suc.predecesores.push(pred.id);
      pred.sucesores.push(suc.id);
    }
  }

  return nodos;
}

function ordenarTopologico(nodos: RenglonCPM[]): RenglonCPM[] {
  const nodosMap = new Map(nodos.map((n) => [n.id, n]));
  const gradosEntrada = new Map(nodos.map((n) => [n.id, n.predecesores.length]));
  const cola: RenglonCPM[] = [...nodos.filter((n) => n.predecesores.length === 0)];
  const resultado: RenglonCPM[] = [];

  while (cola.length > 0) {
    const actual = cola.shift()!;
    resultado.push(actual);

    for (const sucesorId of actual.sucesores) {
      const grado = (gradosEntrada.get(sucesorId) ?? 0) - 1;
      gradosEntrada.set(sucesorId, grado);
      if (grado === 0) {
        const nodo = nodosMap.get(sucesorId);
        if (nodo) cola.push(nodo);
      }
    }
  }

  return resultado.length === nodos.length ? resultado : [...nodos];
}

export const GanttService = {
  calcularRutaCritica(
    renglones: RenglonConLinea[],
    dependencias?: Dependencia[]
  ): RenglonCPM[] {
    if (renglones.length === 0) return [];

    const deps = dependencias ?? renglones.slice(1).map((r, i) => ({
      predecesor: renglones[i].id || renglones[i].codigo,
      sucesor: r.id || r.codigo,
    }));

    const nodos = buildNodos(renglones, deps);
    const nodosOrdenados = ordenarTopologico(nodos);

    for (const n of nodosOrdenados) {
      n.ES = n.predecesores.length === 0
        ? 0
        : Math.max(...n.predecesores.map(pId => {
            const pred = nodos.find(x => x.id === pId);
            return pred ? pred.EF : 0;
          }));
      n.EF = n.ES + n.duracionDias;
    }

    const proyectoFin = Math.max(...nodos.map(n => n.EF));

    for (let i = nodosOrdenados.length - 1; i >= 0; i--) {
      const n = nodosOrdenados[i];
      n.LF = n.sucesores.length === 0
        ? proyectoFin
        : Math.min(...n.sucesores.map(sId => {
            const suc = nodos.find(x => x.id === sId);
            return suc ? suc.LS : proyectoFin;
          }));
      n.LS = n.LF - n.duracionDias;
      n.holgura = Math.max(0, n.LS - n.ES);
      n.esRutaCritica = n.holgura === 0;
    }

    return nodos;
  },

  diasASemanas(dias: number): number {
    return Math.max(0.5, Math.ceil(dias / 5));
  },

  generarDependenciasSecuenciales(renglones: RenglonConLinea[]): Dependencia[] {
    return renglones.slice(1).map((r, i) => ({
      predecesor: renglones[i].id || renglones[i].codigo,
      sucesor: r.id || r.codigo,
    }));
  },
};

