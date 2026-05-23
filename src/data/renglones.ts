// Catálogo de renglones por tipología para Guatemala
// Precios en Quetzales (Q) - referencia 2025

export interface Renglon {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  rendimiento: number; // unidades/día por cuadrilla
  costoMaterial: number;
  costoManoObra: number;
  costoHerramienta: number;
}

export type Tipologia = 'general' | 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica';

const baseRenglones = (prefix: string): Renglon[] => [
  { id: `${prefix}-01`, codigo: '01.01', descripcion: 'Trazo y nivelación del terreno', unidad: 'm²', rendimiento: 80, costoMaterial: 8, costoManoObra: 12, costoHerramienta: 2 },
  { id: `${prefix}-02`, codigo: '01.02', descripcion: 'Limpieza y chapeo de terreno', unidad: 'm²', rendimiento: 100, costoMaterial: 5, costoManoObra: 10, costoHerramienta: 2 },
  { id: `${prefix}-03`, codigo: '02.01', descripcion: 'Excavación estructural', unidad: 'm³', rendimiento: 4, costoMaterial: 0, costoManoObra: 95, costoHerramienta: 8 },
  { id: `${prefix}-04`, codigo: '02.02', descripcion: 'Relleno y compactación', unidad: 'm³', rendimiento: 6, costoMaterial: 45, costoManoObra: 65, costoHerramienta: 10 },
  { id: `${prefix}-05`, codigo: '03.01', descripcion: 'Cimiento corrido de concreto ciclópeo', unidad: 'm³', rendimiento: 2.5, costoMaterial: 850, costoManoObra: 280, costoHerramienta: 20 },
  { id: `${prefix}-06`, codigo: '03.02', descripcion: 'Zapata aislada de concreto reforzado', unidad: 'm³', rendimiento: 1.5, costoMaterial: 1450, costoManoObra: 420, costoHerramienta: 35 },
  { id: `${prefix}-07`, codigo: '03.03', descripcion: 'Solera de humedad 0.15x0.20m', unidad: 'ml', rendimiento: 18, costoMaterial: 65, costoManoObra: 38, costoHerramienta: 5 },
  { id: `${prefix}-08`, codigo: '04.01', descripcion: 'Columna estructural 0.25x0.25m', unidad: 'ml', rendimiento: 8, costoMaterial: 195, costoManoObra: 85, costoHerramienta: 10 },
  { id: `${prefix}-09`, codigo: '04.02', descripcion: 'Solera intermedia 0.15x0.20m', unidad: 'ml', rendimiento: 16, costoMaterial: 72, costoManoObra: 42, costoHerramienta: 5 },
  { id: `${prefix}-10`, codigo: '04.03', descripcion: 'Solera de corona 0.15x0.20m', unidad: 'ml', rendimiento: 16, costoMaterial: 75, costoManoObra: 45, costoHerramienta: 5 },
  { id: `${prefix}-11`, codigo: '05.01', descripcion: 'Levantado de muro block 0.14m', unidad: 'm²', rendimiento: 12, costoMaterial: 95, costoManoObra: 55, costoHerramienta: 6 },
  { id: `${prefix}-12`, codigo: '05.02', descripcion: 'Levantado de muro block 0.19m', unidad: 'm²', rendimiento: 10, costoMaterial: 125, costoManoObra: 62, costoHerramienta: 7 },
  { id: `${prefix}-13`, codigo: '06.01', descripcion: 'Losa tradicional t=0.10m', unidad: 'm²', rendimiento: 15, costoMaterial: 285, costoManoObra: 95, costoHerramienta: 12 },
  { id: `${prefix}-14`, codigo: '06.02', descripcion: 'Losa prefabricada vigueta y bovedilla', unidad: 'm²', rendimiento: 25, costoMaterial: 235, costoManoObra: 65, costoHerramienta: 8 },
  { id: `${prefix}-15`, codigo: '07.01', descripcion: 'Repello vertical', unidad: 'm²', rendimiento: 18, costoMaterial: 28, costoManoObra: 35, costoHerramienta: 4 },
  { id: `${prefix}-16`, codigo: '07.02', descripcion: 'Cernido vertical', unidad: 'm²', rendimiento: 20, costoMaterial: 22, costoManoObra: 32, costoHerramienta: 4 },
  { id: `${prefix}-17`, codigo: '07.03', descripcion: 'Repello + cernido en cielo', unidad: 'm²', rendimiento: 12, costoMaterial: 48, costoManoObra: 62, costoHerramienta: 6 },
  { id: `${prefix}-18`, codigo: '08.01', descripcion: 'Piso cerámico 0.45x0.45m', unidad: 'm²', rendimiento: 15, costoMaterial: 145, costoManoObra: 55, costoHerramienta: 6 },
  { id: `${prefix}-19`, codigo: '08.02', descripcion: 'Piso porcelanato 0.60x0.60m', unidad: 'm²', rendimiento: 12, costoMaterial: 245, costoManoObra: 75, costoHerramienta: 8 },
  { id: `${prefix}-20`, codigo: '08.03', descripcion: 'Azulejo en pared baño', unidad: 'm²', rendimiento: 10, costoMaterial: 165, costoManoObra: 85, costoHerramienta: 7 },
  { id: `${prefix}-21`, codigo: '09.01', descripcion: 'Instalación hidráulica PVC 1/2"', unidad: 'pto', rendimiento: 4, costoMaterial: 185, costoManoObra: 145, costoHerramienta: 15 },
  { id: `${prefix}-22`, codigo: '09.02', descripcion: 'Drenaje sanitario PVC 4"', unidad: 'pto', rendimiento: 3, costoMaterial: 285, costoManoObra: 195, costoHerramienta: 20 },
  { id: `${prefix}-23`, codigo: '09.03', descripcion: 'Inodoro tipo tanque bajo', unidad: 'u', rendimiento: 3, costoMaterial: 850, costoManoObra: 195, costoHerramienta: 15 },
  { id: `${prefix}-24`, codigo: '09.04', descripcion: 'Lavamanos con pedestal', unidad: 'u', rendimiento: 3, costoMaterial: 685, costoManoObra: 175, costoHerramienta: 12 },
  { id: `${prefix}-25`, codigo: '10.01', descripcion: 'Instalación eléctrica fuerza 110V', unidad: 'pto', rendimiento: 6, costoMaterial: 95, costoManoObra: 85, costoHerramienta: 8 },
  { id: `${prefix}-26`, codigo: '10.02', descripcion: 'Instalación eléctrica iluminación', unidad: 'pto', rendimiento: 7, costoMaterial: 85, costoManoObra: 75, costoHerramienta: 7 },
  { id: `${prefix}-27`, codigo: '10.03', descripcion: 'Tablero de distribución 12 circuitos', unidad: 'u', rendimiento: 1, costoMaterial: 1850, costoManoObra: 450, costoHerramienta: 35 },
  { id: `${prefix}-28`, codigo: '11.01', descripcion: 'Puerta de madera con marco', unidad: 'u', rendimiento: 2, costoMaterial: 1450, costoManoObra: 285, costoHerramienta: 20 },
  { id: `${prefix}-29`, codigo: '11.02', descripcion: 'Ventana de aluminio con vidrio claro', unidad: 'm²', rendimiento: 6, costoMaterial: 485, costoManoObra: 125, costoHerramienta: 10 },
  { id: `${prefix}-30`, codigo: '11.03', descripcion: 'Puerta metálica de seguridad', unidad: 'u', rendimiento: 2, costoMaterial: 2850, costoManoObra: 385, costoHerramienta: 25 },
  { id: `${prefix}-31`, codigo: '12.01', descripcion: 'Pintura látex 2 manos interior', unidad: 'm²', rendimiento: 25, costoMaterial: 18, costoManoObra: 22, costoHerramienta: 3 },
  { id: `${prefix}-32`, codigo: '12.02', descripcion: 'Pintura látex 2 manos exterior', unidad: 'm²', rendimiento: 22, costoMaterial: 25, costoManoObra: 28, costoHerramienta: 4 },
  { id: `${prefix}-33`, codigo: '12.03', descripcion: 'Pintura epóxica para piso', unidad: 'm²', rendimiento: 18, costoMaterial: 95, costoManoObra: 45, costoHerramienta: 6 },
  { id: `${prefix}-34`, codigo: '13.01', descripcion: 'Cubierta lámina galvanizada cal.26', unidad: 'm²', rendimiento: 18, costoMaterial: 145, costoManoObra: 55, costoHerramienta: 7 },
  { id: `${prefix}-35`, codigo: '13.02', descripcion: 'Estructura metálica para cubierta', unidad: 'm²', rendimiento: 8, costoMaterial: 285, costoManoObra: 125, costoHerramienta: 18 },
  { id: `${prefix}-36`, codigo: '14.01', descripcion: 'Acera de concreto t=0.08m', unidad: 'm²', rendimiento: 15, costoMaterial: 95, costoManoObra: 55, costoHerramienta: 6 },
  { id: `${prefix}-37`, codigo: '14.02', descripcion: 'Bordillo de concreto', unidad: 'ml', rendimiento: 12, costoMaterial: 65, costoManoObra: 45, costoHerramienta: 5 },
  { id: `${prefix}-38`, codigo: '15.01', descripcion: 'Jardinización y grama', unidad: 'm²', rendimiento: 20, costoMaterial: 55, costoManoObra: 35, costoHerramienta: 4 },
  { id: `${prefix}-39`, codigo: '16.01', descripcion: 'Limpieza final de obra', unidad: 'm²', rendimiento: 50, costoMaterial: 8, costoManoObra: 15, costoHerramienta: 2 },
  { id: `${prefix}-40`, codigo: '16.02', descripcion: 'Entrega y recepción de obra', unidad: 'global', rendimiento: 1, costoMaterial: 850, costoManoObra: 1250, costoHerramienta: 95 },
];

// Variaciones por tipología (precios ajustados)
const adjustForTypology = (base: Renglon[], factor: number, prefix: string): Renglon[] =>
  base.map((r, i) => ({
    ...r,
    id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
    costoMaterial: Math.round(r.costoMaterial * factor),
    costoManoObra: Math.round(r.costoManoObra * factor),
    costoHerramienta: Math.round(r.costoHerramienta * factor),
  }));

export const renglonesPorTipologia: Record<Tipologia, Renglon[]> = {
  general: baseRenglones('gen'),
  residencial: adjustForTypology(baseRenglones('res'), 1.0, 'res'),
  comercial: adjustForTypology(baseRenglones('com'), 1.15, 'com'),
  industrial: adjustForTypology(baseRenglones('ind'), 1.25, 'ind'),
  civil: adjustForTypology(baseRenglones('civ'), 1.10, 'civ'),
  publica: adjustForTypology(baseRenglones('pub'), 1.20, 'pub'),
};

export const tipologiaLabels: Record<Tipologia, string> = {
  general: 'General',
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial',
  civil: 'Civil',
  publica: 'Pública',
};
