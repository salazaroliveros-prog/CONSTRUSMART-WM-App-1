export interface SubMaterial {
  nombre: string;
  unidad: string;
  cantidad: number;
  costoUnitario: number;
  desperdicio?: number;
}

export interface SubManoObra {
  descripcion: string;
  cantidadPersonas: number;
  jornal: number;
}

export interface SubEquipo {
  descripcion: string;
  cantidad: number;
  costoHora: number;
}

export interface Subrenglones {
  materiales: SubMaterial[];
  manoObra: SubManoObra[];
  equipos: SubEquipo[];
}

export interface Renglon {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  rendimiento: number;
  costoMaterial: number;
  costoManoObra: number;
  costoHerramienta: number;
  subrenglones: Subrenglones;
}

export type Tipologia = 'general' | 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica';

function mat(nombre: string, unidad: string, cantidad: number, costoUnitario: number, desperdicio?: number): SubMaterial {
  return { nombre, unidad, cantidad, costoUnitario, desperdicio };
}
function mo(descripcion: string, cantidadPersonas: number, jornal: number): SubManoObra {
  return { descripcion, cantidadPersonas, jornal };
}
function eq(descripcion: string, cantidad: number, costoHora: number): SubEquipo {
  return { descripcion, cantidad, costoHora };
}
function reng(
  id: string, codigo: string, descripcion: string, unidad: string, rendimiento: number,
  materiales: SubMaterial[], manoObra: SubManoObra[], equipos: SubEquipo[]
): Renglon {
  const costoMaterial = materiales.reduce((s, m) => s + m.cantidad * m.costoUnitario, 0);
  const costoManoObra = manoObra.reduce((s, m) => s + m.cantidadPersonas * m.jornal / rendimiento, 0);
  const costoHerramienta = equipos.reduce((s, e) => s + e.cantidad * e.costoHora, 0);
  return {
    id, codigo, descripcion, unidad, rendimiento,
    costoMaterial: Math.round(costoMaterial),
    costoManoObra: Math.round(costoManoObra),
    costoHerramienta: Math.round(costoHerramienta),
    subrenglones: { materiales, manoObra, equipos }
  };
}

const baseRenglones = (prefix: string): Renglon[] => [
  reng(`${prefix}-01`, '01.01', 'Trazo y nivelación del terreno', 'm²', 80,
    [mat('Estacas de madera', 'u', 0.05, 3), mat('Cal', 'bolsa', 0.02, 18), mat('Piola', 'm', 0.08, 0.75), mat('Pintura spray', 'u', 0.01, 25)],
    [mo('Topógrafo', 1, 350), mo('Ayudante', 2, 150)],
    [eq('Nivel automático', 0.1, 45), eq('Estación total', 0.02, 120)]
  ),
  reng(`${prefix}-02`, '01.02', 'Limpieza y chapeo de terreno', 'm²', 100,
    [mat('Machetes', 'u', 0.01, 35), mat('Bolsa para desechos', 'u', 0.5, 2)],
    [mo('Peón', 2, 150)],
    [eq('Carretilla', 0.08, 5), eq('Rastrillo', 0.08, 3)]
  ),
  reng(`${prefix}-03`, '02.01', 'Excavación estructural', 'm³', 4,
    [mat('Madera para entibación', 'm', 0.1, 35)],
    [mo('Peón', 3, 150)],
    [eq('Pico', 0.25, 3), eq('Pala', 0.25, 3), eq('Carretilla', 0.5, 5)]
  ),
  reng(`${prefix}-04`, '02.02', 'Relleno y compactación', 'm³', 6,
    [mat('Material de relleno selecto', 'm³', 1.1, 35), mat('Agua', 'L', 15, 0.008)],
    [mo('Peón', 2, 150)],
    [eq('Compactador vibratorio', 0.17, 45), eq('Carretilla', 0.17, 5)]
  ),
  reng(`${prefix}-05`, '03.01', 'Cimiento corrido de concreto ciclópeo', 'm³', 2.5,
    [mat('Cemento UGC', 'bolsa', 3.5, 85, 5), mat('Arena de río', 'm³', 0.4, 120, 5), mat('Piedra bola 6"', 'm³', 0.5, 150, 3), mat('Agua', 'L', 170, 0.008)],
    [mo('Albañil', 2, 250), mo('Ayudante', 3, 150)],
    [eq('Mezcladora de concreto 1 saco', 0.4, 55), eq('Carretilla', 0.4, 5), eq('Vibrador', 0.2, 35)]
  ),
  reng(`${prefix}-06`, '03.02', 'Zapata aislada de concreto reforzado', 'm³', 1.5,
    [mat('Cemento UGC', 'bolsa', 6, 85, 5), mat('Arena de río', 'm³', 0.5, 120, 5), mat('Grava 3/4"', 'm³', 0.8, 165, 5),
     mat('Acero refuerzo No.4', 'qq', 0.9, 420, 5), mat('Alambre de amarre', 'lb', 2, 8), mat('Madera para encofrado', 'pt', 8, 8, 10)],
    [mo('Albañil', 2, 250), mo('Ayudante', 3, 150), mo('Armador', 1, 280)],
    [eq('Mezcladora de concreto', 0.67, 55), eq('Vibrador', 0.33, 35), eq('Cizalla para acero', 0.1, 25)]
  ),
  reng(`${prefix}-07`, '03.03', 'Solera de humedad 0.15x0.20m', 'ml', 18,
    [mat('Cemento UGC', 'bolsa', 0.35, 85, 5), mat('Arena de río', 'm³', 0.03, 120, 5), mat('Grava 3/4"', 'm³', 0.04, 165, 5),
     mat('Acero No.3', 'qq', 0.08, 420, 5), mat('Madera encofrado', 'pt', 1, 8, 10)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.056, 55)]
  ),
  reng(`${prefix}-08`, '04.01', 'Columna estructural 0.25x0.25m', 'ml', 8,
    [mat('Cemento UGC', 'bolsa', 0.55, 85), mat('Arena de río', 'm³', 0.045, 120), mat('Grava 3/4"', 'm³', 0.07, 165),
     mat('Acero No.4', 'qq', 0.15, 420), mat('Alambre', 'lb', 0.35, 8), mat('Madera encofrado', 'pt', 4, 8), mat('Clavos', 'lb', 0.15, 6)],
    [mo('Albañil', 1, 250), mo('Ayudante', 2, 150), mo('Armador', 0.5, 280)],
    [eq('Mezcladora', 0.125, 55), eq('Vibrador', 0.125, 35)]
  ),
  reng(`${prefix}-09`, '04.02', 'Solera intermedia 0.15x0.20m', 'ml', 16,
    [mat('Cemento UGC', 'bolsa', 0.35, 85), mat('Arena de río', 'm³', 0.03, 120), mat('Grava 3/4"', 'm³', 0.04, 165),
     mat('Acero No.3', 'qq', 0.08, 420), mat('Madera encofrado', 'pt', 1.2, 8)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.063, 55)]
  ),
  reng(`${prefix}-10`, '04.03', 'Solera de corona 0.15x0.20m', 'ml', 16,
    [mat('Cemento UGC', 'bolsa', 0.4, 85), mat('Arena de río', 'm³', 0.035, 120), mat('Grava 3/4"', 'm³', 0.045, 165),
     mat('Acero No.3', 'qq', 0.1, 420), mat('Madera encofrado', 'pt', 1.5, 8)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.063, 55)]
  ),
  reng(`${prefix}-11`, '05.01', 'Levantado de muro block 0.14m', 'm²', 12,
    [mat('Block 0.14x0.19x0.39m', 'u', 13, 5.5, 5), mat('Cemento UGC', 'bolsa', 0.3, 85, 5), mat('Arena de río', 'm³', 0.025, 120, 5),
     mat('Agua', 'L', 15, 0.008), mat('Alambre', 'lb', 0.05, 8)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.083, 55), eq('Andamio', 0.083, 8)]
  ),
  reng(`${prefix}-12`, '05.02', 'Levantado de muro block 0.19m', 'm²', 10,
    [mat('Block 0.19x0.19x0.39m', 'u', 13, 7.5, 5), mat('Cemento UGC', 'bolsa', 0.35, 85, 5), mat('Arena de río', 'm³', 0.03, 120, 5),
     mat('Agua', 'L', 18, 0.008)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.1, 55), eq('Andamio', 0.1, 8)]
  ),
  reng(`${prefix}-13`, '06.01', 'Losa tradicional t=0.10m', 'm²', 15,
    [mat('Cemento UGC', 'bolsa', 0.65, 85, 5), mat('Arena de río', 'm³', 0.05, 120, 5), mat('Grava 3/4"', 'm³', 0.08, 165, 5),
     mat('Acero No.3', 'qq', 0.12, 420, 5), mat('Malla electro soldada', 'm²', 1, 32), mat('Madera para losa', 'pt', 3, 8, 10),
     mat('Clavos', 'lb', 0.2, 6), mat('Alambre', 'lb', 0.15, 8)],
    [mo('Albañil', 2, 250), mo('Ayudante', 2, 150), mo('Armador', 0.5, 280)],
    [eq('Mezcladora', 0.067, 55), eq('Vibrador', 0.067, 35), eq('Andamio', 0.067, 8)]
  ),
  reng(`${prefix}-14`, '06.02', 'Losa prefabricada vigueta y bovedilla', 'm²', 25,
    [mat('Vigueta pretensada', 'ml', 2.5, 28), mat('Bovedilla de concreto', 'u', 8, 9), mat('Cemento UGC', 'bolsa', 0.25, 85),
     mat('Arena de río', 'm³', 0.02, 120), mat('Malla electrosoldada', 'm²', 1, 32), mat('Concreto liviano', 'm³', 0.03, 850)],
    [mo('Albañil', 1, 250), mo('Ayudante', 2, 150)],
    [eq('Mezcladora', 0.04, 55), eq('Andamio', 0.04, 8)]
  ),
  reng(`${prefix}-15`, '07.01', 'Repello vertical', 'm²', 18,
    [mat('Cemento UGC', 'bolsa', 0.2, 85, 5), mat('Arena fina', 'm³', 0.015, 135, 8), mat('Agua', 'L', 8, 0.008)],
    [mo('Albañil', 1, 250), mo('Ayudante', 0.5, 150)],
    [eq('Andamio', 0.056, 8), eq('Mezcladora', 0.056, 55)]
  ),
  reng(`${prefix}-16`, '07.02', 'Cernido vertical', 'm²', 20,
    [mat('Cemento blanco', 'bolsa', 0.15, 95, 5), mat('Cal hidratada', 'bolsa', 0.05, 35), mat('Arena fina', 'm³', 0.012, 135, 8)],
    [mo('Albañil', 1, 250), mo('Ayudante', 0.5, 150)],
    [eq('Andamio', 0.05, 8)]
  ),
  reng(`${prefix}-17`, '07.03', 'Repello + cernido en cielo', 'm²', 12,
    [mat('Cemento UGC', 'bolsa', 0.25, 85, 5), mat('Cemento blanco', 'bolsa', 0.1, 95, 5), mat('Arena fina', 'm³', 0.02, 135, 8),
     mat('Agua', 'L', 10, 0.008)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Andamio', 0.083, 8), eq('Mezcladora', 0.083, 55)]
  ),
  reng(`${prefix}-18`, '08.01', 'Piso cerámico 0.45x0.45m', 'm²', 15,
    [mat('Cerámico 0.45x0.45m', 'm²', 1.05, 95, 8), mat('Pegamento para cerámico', 'bolsa', 0.35, 42, 5), mat('Boquilla cementicia', 'lb', 0.15, 8),
     mat('Cemento UGC', 'bolsa', 0.08, 85, 5), mat('Arena fina', 'm³', 0.008, 135, 5)],
    [mo('Pisero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortadora de cerámico', 0.067, 25), eq('Nivel', 0.067, 3)]
  ),
  reng(`${prefix}-19`, '08.02', 'Piso porcelanato 0.60x0.60m', 'm²', 12,
    [mat('Porcelanato 0.60x0.60m', 'm²', 1.05, 175, 8), mat('Pegamento porcelanato', 'bolsa', 0.4, 55, 5), mat('Boquilla epóxica', 'lb', 0.12, 18),
     mat('Cemento UGC', 'bolsa', 0.08, 85, 5), mat('Arena fina', 'm³', 0.008, 135, 5)],
    [mo('Pisero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortadora de cerámico', 0.083, 25), eq('Nivel', 0.083, 3)]
  ),
  reng(`${prefix}-20`, '08.03', 'Azulejo en pared baño', 'm²', 10,
    [mat('Azulejo 0.33x0.33m', 'm²', 1.05, 120, 8), mat('Pegamento', 'bolsa', 0.4, 42, 5), mat('Boquilla', 'lb', 0.18, 8),
     mat('Cruz para azulejo', 'u', 8, 0.1)],
    [mo('Pisero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortadora', 0.1, 25), eq('Nivel', 0.1, 3)]
  ),
  reng(`${prefix}-21`, '09.01', 'Instalación hidráulica PVC 1/2"', 'pto', 4,
    [mat('Tubo PVC 1/2"', 'm', 2.5, 12, 5), mat('Codo PVC 1/2"', 'u', 4, 3.5, 5), mat('Tee PVC 1/2"', 'u', 2, 4.5, 5),
     mat('Adaptador PVC', 'u', 2, 3, 5), mat('Pegamento PVC', 'Lata', 0.05, 45), mat('Cinta teflón', 'u', 0.3, 5)],
    [mo('Fontanero', 1, 300), mo('Ayudante', 0.5, 150)],
    [eq('Llave para PVC', 0.25, 5), eq('Cortatubo', 0.25, 8)]
  ),
  reng(`${prefix}-22`, '09.02', 'Drenaje sanitario PVC 4"', 'pto', 3,
    [mat('Tubo PVC 4"', 'm', 2, 55), mat('Codo PVC 4"', 'u', 2, 18), mat('Yee PVC 4"', 'u', 1, 25),
     mat('Adaptador PVC 4"', 'u', 1, 15), mat('Pegamento PVC', 'Lata', 0.06, 65)],
    [mo('Fontanero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortatubo', 0.333, 8)]
  ),
  reng(`${prefix}-23`, '09.03', 'Inodoro tipo tanque bajo', 'u', 3,
    [mat('Inodoro tanque bajo blanco', 'u', 1, 650), mat('Fluxómetro', 'u', 1, 185), mat('Codo PVC 4"', 'u', 1, 18),
     mat('Tubo PVC 1/2"', 'm', 1, 12), mat('Cinta teflón', 'u', 0.5, 5), mat('Sellador silicon', 'u', 0.2, 25)],
    [mo('Fontanero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Llave stilson', 0.333, 5)]
  ),
  reng(`${prefix}-24`, '09.04', 'Lavamanos con pedestal', 'u', 3,
    [mat('Lavamanos pedestal blanco', 'u', 1, 450), mat('Llave mezcladora', 'u', 1, 185), mat('Sifón', 'u', 1, 35),
     mat('Tubo PVC 1/2"', 'm', 1.5, 12), mat('Cinta teflón', 'u', 0.5, 5), mat('Sellador', 'u', 0.2, 25)],
    [mo('Fontanero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Llave stilson', 0.333, 5)]
  ),
  reng(`${prefix}-25`, '10.01', 'Instalación eléctrica fuerza 110V', 'pto', 6,
    [mat('Cable THW No.12', 'm', 6, 6.5), mat('Tubo conduit 1/2"', 'm', 3, 8), mat('Caja rectangular', 'u', 1, 12),
     mat('Tornillo', 'u', 4, 0.5), mat('Cinta aislante', 'u', 0.15, 8), mat('Conector conduit', 'u', 2, 3)],
    [mo('Electricista', 1, 350), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.167, 15), eq('Multímetro', 0.167, 5)]
  ),
  reng(`${prefix}-26`, '10.02', 'Instalación eléctrica iluminación', 'pto', 7,
    [mat('Cable THW No.14', 'm', 5, 4.5), mat('Tubo conduit 1/2"', 'm', 2.5, 8), mat('Caja octogonal', 'u', 1, 10),
     mat('Tornillo', 'u', 4, 0.5), mat('Cinta aislante', 'u', 0.15, 8), mat('Conector conduit', 'u', 2, 3)],
    [mo('Electricista', 1, 350), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.143, 15), eq('Multímetro', 0.143, 5)]
  ),
  reng(`${prefix}-27`, '10.03', 'Tablero de distribución 12 circuitos', 'u', 1,
    [mat('Tablero 12 circuitos', 'u', 1, 850), mat('Breaker principal 2x50A', 'u', 1, 185), mat('Breaker 1x15A', 'u', 6, 45),
     mat('Breaker 1x20A', 'u', 4, 45), mat('Cable THW No.6', 'm', 3, 18), mat('Cable THW No.12', 'm', 5, 6.5),
     mat('Tubo conduit 3/4"', 'm', 2, 12)],
    [mo('Electricista', 1, 350), mo('Ayudante', 1, 150)],
    [eq('Taladro', 1, 15), eq('Multímetro', 0.5, 5)]
  ),
  reng(`${prefix}-28`, '11.01', 'Puerta de madera con marco', 'u', 2,
    [mat('Puerta madera 0.80x2.00m', 'u', 1, 1200), mat('Cerrojo', 'u', 1, 85), mat('Bisagras', 'u', 3, 15),
     mat('Marco de madera', 'u', 1, 250), mat('Tornillos', 'u', 12, 0.75), mat('Laca barniz', 'Lata', 0.3, 45)],
    [mo('Carpintero', 1, 300), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.5, 15), eq('Sierra circular', 0.3, 25)]
  ),
  reng(`${prefix}-29`, '11.02', 'Ventana de aluminio con vidrio claro', 'm²', 6,
    [mat('Ventana aluminio corrediza', 'm²', 1, 420), mat('Vidrio claro 4mm', 'm²', 1, 125), mat('Sellador silicon', 'u', 0.3, 25),
     mat('Tornillos acero', 'u', 8, 0.5)],
    [mo('Carpintero metálico', 1, 350), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.167, 15), eq('Remachadora', 0.167, 5)]
  ),
  reng(`${prefix}-30`, '11.03', 'Puerta metálica de seguridad', 'u', 2,
    [mat('Puerta metálica 0.90x2.00m', 'u', 1, 2400), mat('Cerrojo seguridad', 'u', 1, 250), mat('Bisagras pesadas', 'u', 4, 25),
     mat('Marco metálico', 'u', 1, 450), mat('Taquetes expansivos', 'u', 8, 3.5), mat('Pintura anticorrosiva', 'Lata', 0.3, 55)],
    [mo('Cerrajero', 1, 350), mo('Ayudante', 1, 150)],
    [eq('Taladro percutor', 0.5, 18), eq('Soldadora', 0.5, 45)]
  ),
  reng(`${prefix}-31`, '12.01', 'Pintura látex 2 manos interior', 'm²', 25,
    [mat('Pintura látex interior', 'galón', 0.04, 145), mat('Sellador', 'galón', 0.02, 120), mat('Lija para pared', 'u', 0.1, 5),
     mat('Cinta masking', 'u', 0.05, 8), mat('Rodillo', 'u', 0.02, 25)],
    [mo('Pintor', 1, 250), mo('Ayudante', 0.5, 150)],
    [eq('Andamio', 0.04, 8)]
  ),
  reng(`${prefix}-32`, '12.02', 'Pintura látex 2 manos exterior', 'm²', 22,
    [mat('Pintura látex exterior', 'galón', 0.045, 165), mat('Sellador exterior', 'galón', 0.025, 135),
     mat('Lija', 'u', 0.12, 5), mat('Cinta masking', 'u', 0.05, 8), mat('Rodillo', 'u', 0.02, 25)],
    [mo('Pintor', 1, 250), mo('Ayudante', 0.5, 150)],
    [eq('Andamio', 0.045, 8)]
  ),
  reng(`${prefix}-33`, '12.03', 'Pintura epóxica para piso', 'm²', 18,
    [mat('Pintura epóxica 2 componentes', 'galón', 0.08, 285), mat('Endurecedor', 'u', 0.08, 95),
     mat('Lija', 'u', 0.15, 5), mat('Cinta masking', 'u', 0.1, 8), mat('Rodillo especial', 'u', 0.03, 35)],
    [mo('Pintor', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Pulidora', 0.056, 25)]
  ),
  reng(`${prefix}-34`, '13.01', 'Cubierta lámina galvanizada cal.26', 'm²', 18,
    [mat('Lámina galvanizada cal.26', 'm²', 1.1, 95), mat('Tornillo autotaladrante', 'u', 4, 1.5),
     mat('Cumbrera galvanizada', 'ml', 0.1, 45), mat('Sellador de silicon', 'u', 0.05, 25)],
    [mo('Techador', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Taladro', 0.056, 15), eq('Andamio', 0.056, 8)]
  ),
  reng(`${prefix}-35`, '13.02', 'Estructura metálica para cubierta', 'm²', 8,
    [mat('Perfil metálico C 4x2"', 'ml', 3.5, 45), mat('Perfil angular 1"', 'ml', 2, 18), mat('Soldadura 7018', 'lb', 0.35, 12),
     mat('Disco de corte', 'u', 0.05, 25), mat('Pintura anticorrosiva', 'Lata', 0.05, 55), mat('Perno estructural', 'u', 2, 5)],
    [mo('Soldador', 1, 350), mo('Ayudante', 2, 150)],
    [eq('Soldadora 220A', 0.125, 45), eq('Esmeril angular', 0.125, 18), eq('Andamio', 0.125, 8)]
  ),
  reng(`${prefix}-81`, '13.03', 'Pergola metálica', 'm²', 10,
    [mat('Perfil metálico estructural', 'ml', 2.8, 48), mat('Placa metálica de anclaje', 'u', 0.5, 125), mat('Tornillo autorroscante', 'u', 6, 1.8),
     mat('Pintura anticorrosiva', 'Lata', 0.08, 55), mat('Sellador de juntas', 'L', 0.03, 45)],
    [mo('Soldador', 1, 350), mo('Ayudante', 1, 150)],
    [eq('Soldadora 220A', 0.12, 45), eq('Nodo metálico', 0.1, 35), eq('Andamio', 0.1, 8)]
  ),
  reng(`${prefix}-82`, '13.04', 'Pergola de madera', 'm²', 12,
    [mat('Vigas de madera tratada', 'ml', 1.9, 35), mat('Listón de madera', 'ml', 0.8, 28), mat('Lámina de techo translúcida', 'm²', 0.6, 65),
     mat('Herrajes metálicos', 'u', 0.15, 80), mat('Barniz protector', 'L', 0.04, 65)],
    [mo('Carpintero', 1, 320), mo('Ayudante', 1, 150)],
    [eq('Sierra circular', 0.12, 25), eq('Taladro', 0.12, 15), eq('Elevador', 0.08, 120)]
  ),
  reng(`${prefix}-83`, '13.05', 'Tejado teja de barro', 'm²', 14,
    [mat('Teja de barro', 'u', 10.5, 6.5), mat('Fieltro asfáltico', 'm²', 1.05, 12), mat('Madera para cabios', 'ml', 1.2, 28),
     mat('Mortero de fijación', 'm³', 0.02, 850), mat('Clavos para teja', 'u', 12, 0.45)],
    [mo('Techador', 1, 320), mo('Ayudante', 1.5, 150)],
    [eq('Taladro', 0.1, 15), eq('Andamio', 0.1, 8), eq('Carretilla', 0.05, 5)]
  ),
  reng(`${prefix}-39`, '14.01', 'Acera de concreto t=0.08m', 'm²', 15,
    [mat('Cemento UGC', 'bolsa', 0.45, 85), mat('Arena de río', 'm³', 0.04, 120), mat('Grava 3/4"', 'm³', 0.06, 165),
     mat('Madera formaleta', 'pt', 0.5, 8), mat('Junta de dilatación', 'ml', 0.3, 5)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.067, 55), eq('Regla vibratoria', 0.067, 20)]
  ),
  reng(`${prefix}-37`, '14.02', 'Bordillo de concreto', 'ml', 12,
    [mat('Cemento UGC', 'bolsa', 0.3, 85), mat('Arena de río', 'm³', 0.025, 120), mat('Grava 3/4"', 'm³', 0.04, 165),
     mat('Madera formaleta', 'pt', 0.8, 8)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.083, 55)]
  ),
  reng(`${prefix}-38`, '15.01', 'Jardinización y grama', 'm²', 20,
    [mat('Grama en rollo', 'm²', 1.05, 25), mat('Tierra negra', 'm³', 0.02, 85), mat('Fertilizante', 'lb', 0.1, 18),
     mat('Agua', 'L', 10, 0.008)],
    [mo('Jardinero', 1, 250), mo('Peón', 1, 150)],
    [eq('Carretilla', 0.05, 5), eq('Azadón', 0.05, 3)]
  ),
  reng(`${prefix}-39`, '16.01', 'Limpieza final de obra', 'm²', 50,
    [mat('Bolsa desechos', 'u', 0.5, 2), mat('Escoba', 'u', 0.02, 15), mat('Trapeador', 'u', 0.02, 20),
     mat('Detergente', 'Lb', 0.02, 12)],
    [mo('Peón', 2, 150)],
    [eq('Carretilla', 0.02, 5)]
  ),
  reng(`${prefix}-40`, '16.02', 'Entrega y recepción de obra', 'global', 1,
    [mat('Reporte final impreso', 'u', 2, 85), mat('Planos as-built', 'u', 3, 150), mat('Manuales de uso', 'u', 2, 95)],
    [mo('Ingeniero residente', 1, 600), mo('Supervisor', 1, 400), mo('Dibujante', 0.5, 300)],
    [eq('Cámara fotográfica', 1, 15), eq('Impresora', 0.5, 8)]
  ),

  // ===== 17.xx ACERO DE REFUERZO ADICIONAL =====
  reng(`${prefix}-41`, '17.01', 'Acero de refuerzo No.3 (3/8")', 'qq', 4,
    [mat('Varilla corrugada No.3', 'qq', 1, 420), mat('Alambre de amarre', 'lb', 3, 8), mat('Ganchos', 'u', 2, 5)],
    [mo('Armador', 1, 280), mo('Ayudante', 2, 150)],
    [eq('Cizalla', 0.25, 25), eq('Dobladora', 0.25, 15)]
  ),
  reng(`${prefix}-42`, '17.02', 'Acero de refuerzo No.4 (1/2")', 'qq', 3,
    [mat('Varilla corrugada No.4', 'qq', 1, 420), mat('Alambre de amarre', 'lb', 2.5, 8), mat('Separadores', 'u', 8, 1.5)],
    [mo('Armador', 1, 280), mo('Ayudante', 2, 150)],
    [eq('Cizalla', 0.333, 25), eq('Dobladora', 0.333, 15)]
  ),
  reng(`${prefix}-43`, '17.03', 'Malla electro soldada 5mm', 'm²', 20,
    [mat('Malla electrosoldada 5mm', 'm²', 1.05, 35), mat('Alambre', 'lb', 0.1, 8)],
    [mo('Armador', 0.5, 280), mo('Ayudante', 1, 150)],
    [eq('Cizalla', 0.05, 25)]
  ),

  // ===== 18.xx FORMALETAS Y ENCOFRADOS =====
  reng(`${prefix}-44`, '18.01', 'Encofrado de madera para losa', 'm²', 12,
    [mat('Madera pino 1x8"', 'pt', 4, 8), mat('Triplay 1/2"', 'hoja', 0.25, 185), mat('Clavos 3"', 'lb', 0.35, 6),
     mat('Clavos 2"', 'lb', 0.2, 6), mat('Alambre', 'lb', 0.15, 8), mat('Desmoldante', 'L', 0.05, 35)],
    [mo('Carpintero', 1, 300), mo('Ayudante', 2, 150)],
    [eq('Sierra circular', 0.083, 25), eq('Andamio', 0.083, 8)]
  ),
  reng(`${prefix}-45`, '18.02', 'Encofrado metálico para columna', 'm²', 15,
    [mat('Panel metálico 2x2m', 'u', 0.2, 120), mat('Desmoldante', 'L', 0.08, 35), mat('Tornillos', 'u', 4, 0.75)],
    [mo('Carpintero metálico', 1, 350), mo('Ayudante', 1, 150)],
    [eq('Grúa torre', 0.067, 180)]
  ),

  // ===== 19.xx IMPERMEABILIZACIÓN =====
  reng(`${prefix}-46`, '19.01', 'Impermeabilización losa con membrana', 'm²', 30,
    [mat('Membrana asfáltica 3mm', 'm²', 1.1, 65), mat('Imprimante asfáltico', 'galón', 0.04, 95),
     mat('Sellador juntas', 'L', 0.02, 55), mat('Gas propano', 'lb', 0.15, 12)],
    [mo('Impermeabilizador', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Soplete', 0.033, 18), eq('Rodillo', 0.033, 5)]
  ),
  reng(`${prefix}-47`, '19.02', 'Impermeabilización acrílica', 'm²', 35,
    [mat('Pintura impermeabilizante acrílica', 'galón', 0.06, 185), mat('Malla de refuerzo', 'm²', 1, 12),
     mat('Sellador', 'galón', 0.03, 120)],
    [mo('Pintor', 0.5, 250), mo('Ayudante', 0.5, 150)],
    [eq('Rodillo', 0.029, 5)]
  ),

  // ===== 20.xx DRENAJES PLUVIALES =====
  reng(`${prefix}-48`, '20.01', 'Canaleta pluvial PVC 3"', 'ml', 15,
    [mat('Canaleta PVC 3"', 'ml', 1, 28), mat('Conector PVC', 'u', 0.5, 8), mat('Bajada PVC 3"', 'ml', 0.3, 22),
     mat('Pegamento PVC', 'Lata', 0.02, 45)],
    [mo('Fontanero', 0.5, 300), mo('Ayudante', 0.5, 150)],
    [eq('Andamio', 0.067, 8)]
  ),
  reng(`${prefix}-49`, '20.02', 'Tubería drenaje pluvial 6"', 'ml', 12,
    [mat('Tubo PVC 6"', 'ml', 1, 120), mat('Codo PVC 6"', 'u', 0.3, 35), mat('Pegamento PVC', 'Lata', 0.03, 65),
     mat('Arena', 'm³', 0.05, 120)],
    [mo('Fontanero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortatubo', 0.083, 8)]
  ),

  // ===== 21.xx CIELO FALSO =====
  reng(`${prefix}-50`, '21.01', 'Cielo faso registrable PVC', 'm²', 20,
    [mat('Panel PVC 0.60x0.60', 'm²', 1.05, 85), mat('Perfil angular', 'ml', 3.5, 8), mat('Perfil T', 'ml', 2, 12),
     mat('Alambre galvanizado', 'm', 1.5, 2), mat('Taquete', 'u', 3, 1)],
    [mo('Cielo faso', 1, 300), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.05, 15), eq('Nivel', 0.05, 3)]
  ),
  reng(`${prefix}-51`, '21.02', 'Cielo faso de tabla yeso', 'm²', 18,
    [mat('Tabla yeso 1/2"', 'm²', 1.05, 65), mat('Perfil metálico', 'ml', 3, 8), mat('Cinta junta', 'm', 2, 1.5),
     mat('Compuesto para junta', 'lb', 0.5, 8), mat('Tornillo drywall', 'u', 12, 0.15), mat('Taquete', 'u', 3, 1)],
    [mo('Tablaroca', 1, 300), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.056, 15), eq('Nivel', 0.056, 3)]
  ),

  // ===== 22.xx BARANDALES Y PASAMANOS =====
  reng(`${prefix}-52`, '22.01', 'Barandal de hierro forjado', 'ml', 5,
    [mat('Barrote de hierro 1/2"', 'ml', 1.1, 35), mat('Pasamanos 1"', 'ml', 1, 45), mat('Soldadura', 'lb', 0.3, 12),
     mat('Pintura anticorrosiva', 'Lata', 0.05, 55), mat('Disco de corte', 'u', 0.05, 25), mat('Taquete', 'u', 3, 2)],
    [mo('Cerrajero', 1, 350), mo('Ayudante', 0.5, 150)],
    [eq('Soldadora', 0.2, 45), eq('Esmeril', 0.2, 18)]
  ),
  reng(`${prefix}-53`, '22.02', 'Pasamanos de acero inoxidable', 'ml', 4,
    [mat('Tubo inoxidable 1.5"', 'ml', 1.1, 185), mat('Base inoxidable', 'u', 2, 45), mat('Soldadura inox', 'lb', 0.15, 45),
     mat('Disco inoxidable', 'u', 0.05, 35)],
    [mo('Cerrajero', 1, 350), mo('Ayudante', 0.5, 150)],
    [eq('Soldadora TIG', 0.25, 65), eq('Pulidora', 0.25, 25)]
  ),

  // ===== 23.xx MUROS DIVISORIOS DRYWALL =====
  reng(`${prefix}-54`, '23.01', 'Muro divisorio drywall 1 cara', 'm²', 14,
    [mat('Tabla yeso 5/8"', 'm²', 1.05, 75), mat('Perfil canal', 'ml', 1, 10), mat('Perfil montante', 'ml', 2, 12),
     mat('Cinta junta', 'm', 2.5, 1.5), mat('Compuesto', 'lb', 0.6, 8), mat('Tornillo drywall', 'u', 14, 0.15),
     mat('Aislante acústico', 'm²', 1, 25)],
    [mo('Tablaroca', 1, 300), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.071, 15), eq('Nivel láser', 0.071, 25)]
  ),
  reng(`${prefix}-55`, '23.02', 'Muro divisorio drywall 2 caras', 'm²', 10,
    [mat('Tabla yeso 5/8"', 'm²', 2.1, 75), mat('Perfil canal', 'ml', 1, 10), mat('Perfil montante', 'ml', 2.5, 12),
     mat('Cinta junta', 'm', 5, 1.5), mat('Compuesto', 'lb', 1.2, 8), mat('Tornillo drywall', 'u', 28, 0.15),
     mat('Aislante acústico', 'm²', 1, 25)],
    [mo('Tablaroca', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Taladro', 0.1, 15), eq('Nivel láser', 0.1, 25)]
  ),

  // ===== 24.xx PISO DE CONCRETO =====
  reng(`${prefix}-56`, '24.01', 'Piso de concreto pulido', 'm²', 12,
    [mat('Cemento UGC', 'bolsa', 0.8, 85), mat('Arena de río', 'm³', 0.06, 120), mat('Grava 1/2"', 'm³', 0.08, 165),
     mat('Endurecedor', 'lb', 0.15, 18), mat('Malla 6x6', 'm²', 1, 28)],
    [mo('Albañil', 1, 250), mo('Ayudante', 2, 150)],
    [eq('Mezcladora', 0.083, 55), eq('Pulidora de concreto', 0.083, 65), eq('Regla vibratoria', 0.083, 20)]
  ),
  reng(`${prefix}-57`, '24.02', 'Contrapiso nivelado t=0.05m', 'm²', 25,
    [mat('Cemento UGC', 'bolsa', 0.3, 85), mat('Arena fina', 'm³', 0.03, 135), mat('Malla 6x6', 'm²', 0.5, 28),
     mat('Agua', 'L', 12, 0.008)],
    [mo('Albañil', 0.5, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.04, 55)]
  ),

  // ===== 25.xx FACHADA =====
  reng(`${prefix}-58`, '25.01', 'Fachada de piedra laja', 'm²', 8,
    [mat('Piedra laja natural', 'm²', 1.1, 185), mat('Pegamento piedra', 'bolsa', 0.5, 55), mat('Boquilla', 'lb', 0.3, 12),
     mat('Sellador para piedra', 'L', 0.05, 85)],
    [mo('Albañil', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortadora de cerámico', 0.125, 25), eq('Andamio', 0.125, 8)]
  ),
  reng(`${prefix}-59`, '25.02', 'Fachada ventilada aluminio compuesto', 'm²', 6,
    [mat('Panel ACM aluminio 4mm', 'm²', 1.1, 420), mat('Subestructura aluminio', 'm²', 1, 185),
     mat('Remache pop', 'u', 12, 0.75), mat('Sellador silicon estructural', 'u', 0.3, 35)],
    [mo('Instalador fachadas', 1, 400), mo('Ayudante', 2, 150)],
    [eq('Andamio', 0.167, 8), eq('Taladro', 0.167, 15)]
  ),

  // ===== 26.xx SISTEMA CONTRA INCENDIOS =====
  reng(`${prefix}-60`, '26.01', 'Detector de humo iónico', 'u', 8,
    [mat('Detector de humo', 'u', 1, 185), mat('Cable THW No.14', 'm', 2, 4.5), mat('Tubo conduit 1/2"', 'm', 1, 8),
     mat('Caja octogonal', 'u', 1, 10), mat('Conector', 'u', 2, 3)],
    [mo('Electricista', 0.5, 350), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.125, 15), eq('Multímetro', 0.125, 5)]
  ),
  reng(`${prefix}-61`, '26.02', 'Extintor ABC 10lb', 'u', 4,
    [mat('Extintor ABC 10lb', 'u', 1, 350), mat('Soporte metálico', 'u', 1, 45), mat('Señalización', 'u', 1, 25),
     mat('Taquete', 'u', 4, 1)],
    [mo('Técnico seguridad', 0.5, 350)],
    [eq('Taladro', 0.25, 15)]
  ),

  // ===== 27.xx CERRADURAS Y HERRAJES =====
  reng(`${prefix}-62`, '27.01', 'Cerradura de seguridad tipo manija', 'u', 6,
    [mat('Manija con llave', 'u', 1, 350), mat('Cerradura interna', 'u', 1, 185), mat('Tornillos', 'u', 6, 1.5)],
    [mo('Carpintero', 0.5, 300)],
    [eq('Taladro', 0.167, 15), eq('Destornillador', 0.167, 2)]
  ),
  reng(`${prefix}-63`, '27.02', 'Cerradura eléctrica de riel', 'u', 3,
    [mat('Cerradura eléctrica', 'u', 1, 850), mat('Fuente 12V', 'u', 1, 185), mat('Control acceso', 'u', 1, 450),
     mat('Cable UTP', 'm', 3, 3.5), mat('Tubo conduit', 'm', 1, 8)],
    [mo('Electricista', 1, 350), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.333, 15), eq('Multímetro', 0.333, 5)]
  ),

  // ===== 28.xx CLOSET =====
  reng(`${prefix}-64`, '28.01', 'Closet de madera 2 puertas 1.20m', 'u', 2,
    [mat('Puerta closet 0.60m', 'u', 2, 450), mat('Melamina 18mm', 'm²', 3.5, 185), mat('Canto melamina', 'ml', 8, 2),
     mat('Bisagras', 'u', 6, 12), mat('Correderas metálicas', 'u', 2, 45), mat('Manijas', 'u', 2, 25),
     mat('Tornillos', 'u', 30, 0.75)],
    [mo('Carpintero', 2, 300), mo('Ayudante', 1, 150)],
    [eq('Sierra circular', 0.5, 25), eq('Taladro', 0.5, 15), eq('Lijadora', 0.3, 12)]
  ),
  reng(`${prefix}-65`, '28.02', 'Estantería metálica industrial', 'ml', 8,
    [mat('Perfil estantería', 'ml', 3, 45), mat('Panel metálico 1.20m', 'u', 1, 185), mat('Tornillo estructural', 'u', 12, 2.5),
     mat('Taquete expansivo', 'u', 6, 3.5)],
    [mo('Cerrajero', 1, 350), mo('Ayudante', 0.5, 150)],
    [eq('Taladro percutor', 0.125, 18), eq('Nivel', 0.125, 3)]
  ),

  // ===== 29.xx MESÓN Y COCINA =====
  reng(`${prefix}-66`, '29.01', 'Mesón de cocina granito 2.00m', 'u', 2,
    [mat('Cubierta granito 2.00m', 'u', 1, 2800), mat('Fregadero acero inox', 'u', 1, 850), mat('Llave mezcladora', 'u', 1, 350),
     mat('Grifería', 'u', 1, 185), mat('Sifón', 'u', 1, 45), mat('Silicon sellador', 'u', 0.5, 25)],
    [mo('Instalador cocina', 1, 350), mo('Fontanero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Taladro', 0.5, 15), eq('Pulidora', 0.5, 25)]
  ),

  // ===== 30.xx SISTEMA DE BOMBEO =====
  reng(`${prefix}-67`, '30.01', 'Bomba hidroneumática 1HP', 'u', 1,
    [mat('Bomba 1HP', 'u', 1, 2850), mat('Tanque hidroneumático 20L', 'u', 1, 850), mat('Válvula check', 'u', 1, 85),
     mat('Válvula compuerta', 'u', 2, 65), mat('Tubo PVC 1"', 'm', 3, 18), mat('Codo PVC 1"', 'u', 4, 8),
     mat('Teflón', 'u', 0.5, 5), mat('Unión universal', 'u', 2, 12)],
    [mo('Fontanero', 1, 300), mo('Electricista', 0.5, 350), mo('Ayudante', 1, 150)],
    [eq('Llave stilson', 0.5, 5), eq('Taladro', 0.5, 15)]
  ),

  // ===== 31.xx INSTALACIONES ESPECIALES =====
  reng(`${prefix}-68`, '31.01', 'Calentador de paso gas LPG 8L', 'u', 2,
    [mat('Calentador 8L LPG', 'u', 1, 3200), mat('Tubo cobre 1/2"', 'm', 2, 28), mat('Válvula gas', 'u', 1, 85),
     mat('Manguera gas', 'm', 2, 25), mat('Cinta teflón', 'u', 0.5, 5), mat('Tubo PVC 1/2"', 'm', 1.5, 12)],
    [mo('Fontanero', 1, 300), mo('Ayudante', 0.5, 150)],
    [eq('Llave stilson', 0.5, 5), eq('Taladro', 0.3, 15)]
  ),
  reng(`${prefix}-69`, '31.02', 'Aire acondicionado mini split 12K BTU', 'u', 1,
    [mat('Mini split 12K BTU', 'u', 1, 4500), mat('Soporte metálico', 'u', 1, 185), mat('Tubería cobre 1/4"', 'm', 5, 35),
     mat('Cable eléctrico 12AWG', 'm', 5, 6.5), mat('Aislante térmico', 'm', 5, 8), mat('Breaker 20A', 'u', 1, 55),
     mat('Taquete expansivo', 'u', 6, 3.5)],
    [mo('Técnico HVAC', 1, 450), mo('Electricista', 0.5, 350), mo('Ayudante', 1, 150)],
    [eq('Manifold', 1, 25), eq('Bomba vacío', 1, 35), eq('Taladro percutor', 0.5, 18)]
  ),
  reng(`${prefix}-70`, '31.03', 'Sistema CCTV cámara exterior', 'pto', 4,
    [mat('Cámara IP exterior 2MP', 'u', 1, 850), mat('Cable UTP CAT6', 'm', 20, 2.5), mat('Fuente POE', 'u', 1, 185),
     mat('Grabador NVR 4 canales', 'u', 0.25, 2800), mat('Disco duro 1TB', 'u', 0.25, 350),
     mat('Tubo conduit 1/2"', 'm', 5, 8), mat('Conector RJ45', 'u', 2, 8)],
    [mo('Técnico CCTV', 1, 400), mo('Ayudante', 0.5, 150)],
    [eq('Taladro', 0.25, 15), eq('Ponchadora', 0.25, 12), eq('Multímetro', 0.25, 5)]
  ),

  // ===== 32.xx OBRA CIVIL PESADA =====
  reng(`${prefix}-71`, '32.01', 'Muro de contención concreto ciclópeo', 'm³', 2,
    [mat('Cemento UGC', 'bolsa', 4, 85), mat('Arena de río', 'm³', 0.45, 120), mat('Piedra bola 8"', 'm³', 0.6, 150),
     mat('Acero No.4', 'qq', 0.5, 420), mat('Madera encofrado', 'pt', 6, 8), mat('Agua', 'L', 200, 0.008)],
    [mo('Albañil', 2, 250), mo('Ayudante', 3, 150)],
    [eq('Mezcladora', 0.5, 55), eq('Vibrador', 0.3, 35)]
  ),
  reng(`${prefix}-72`, '32.02', 'Demolición de estructura existente', 'm³', 3,
    [mat('Disco de corte', 'u', 0.3, 25), mat('Bolsa desechos', 'u', 5, 2)],
    [mo('Peón', 3, 150)],
    [eq('Martillo rompedor', 0.333, 55), eq('Carretilla', 0.333, 5)]
  ),
  reng(`${prefix}-73`, '32.03', 'Andamio de seguridad perimetral', 'm²', 50,
    [mat('Marco andamio 1.80m', 'u', 0.5, 350), mat('Cruceta', 'u', 1, 55), mat('Plataforma', 'u', 0.5, 185),
     mat('Rueda', 'u', 0.2, 45), mat('Baranda seguridad', 'ml', 1, 35)],
    [mo('Armador andamios', 1, 300), mo('Ayudante', 2, 150)],
    [eq('Taladro', 0.02, 15)]
  ),

  // ===== 33.xx SEÑALIZACIÓN =====
  reng(`${prefix}-74`, '33.01', 'Señalización vial horizontal línea 4"', 'ml', 100,
    [mat('Pintura tráfico blanca', 'galón', 0.02, 185), mat('Solvente', 'L', 0.01, 25), mat('Cinta masking', 'm', 0.5, 1.5)],
    [mo('Pintor señalización', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Máquina líneas', 0.01, 85), eq('Rodillo', 0.01, 5)]
  ),
  reng(`${prefix}-75`, '33.02', 'Señal vertical reglamentaria', 'u', 6,
    [mat('Lámina aluminio reflectiva', 'u', 1, 185), mat('Poste 2.5m', 'u', 1, 120), mat('Tubo cuadrado 2"', 'ml', 2.5, 28),
     mat('Concreto 3000psi', 'm³', 0.05, 850), mat('Taquete', 'u', 4, 2.5)],
    [mo('Albañil', 0.5, 250), mo('Ayudante', 0.5, 150)],
    [eq('Taladro percutor', 0.167, 18), eq('Nivel', 0.167, 3)]
  ),

  // ===== 34.xx CERCADO PERIMETRAL =====
  reng(`${prefix}-76`, '34.01', 'Cercado de malla ciclón h=2.00m', 'ml', 15,
    [mat('Malla ciclón 2.00m', 'ml', 1, 65), mat('Poste tubular 2"', 'u', 0.5, 85), mat('Alambre tenso', 'm', 2, 3),
     mat('Concreto 3000psi', 'm³', 0.02, 850), mat('Grapas', 'u', 4, 0.5)],
    [mo('Cerrajero', 0.5, 350), mo('Ayudante', 1, 150)],
    [eq('Taladro', 0.067, 15), eq('Tensador', 0.067, 8)]
  ),
  reng(`${prefix}-77`, '34.02', 'Portón metálico corredizo 3.00m', 'u', 2,
    [mat('Portón metálico 3x2m', 'u', 1, 4800), mat('Riel corredizo', 'ml', 4, 85), mat('Rueda', 'u', 4, 45),
     mat('Cerradura pesada', 'u', 2, 185), mat('Soldadura', 'lb', 1, 12), mat('Pintura anticorrosiva', 'Lata', 0.5, 55)],
    [mo('Cerrajero', 2, 350), mo('Ayudante', 2, 150)],
    [eq('Soldadora', 0.5, 45), eq('Esmeril', 0.5, 18)]
  ),

  // ===== 35.xx ACABADOS ESPECIALES =====
  reng(`${prefix}-78`, '35.01', 'Piso de madera laminada', 'm²', 12,
    [mat('Lámina madera 8mm', 'm²', 1.08, 145), mat('Underlayment', 'm²', 1, 18), mat('Perfil junta', 'ml', 0.5, 15),
     mat('Zócalo madera', 'ml', 1, 12), mat('Clips', 'u', 8, 0.5)],
    [mo('Pisero', 1, 300), mo('Ayudante', 0.5, 150)],
    [eq('Cortadora', 0.083, 25), eq('Taladro', 0.05, 15)]
  ),
  reng(`${prefix}-79`, '35.02', 'Revestimiento vinílico pared', 'm²', 20,
    [mat('Papel vinílico premium', 'rollo', 0.08, 350), mat('Adhesivo vinílico', 'galón', 0.03, 85),
     mat('Espátula plástica', 'u', 0.02, 8), mat('Cutter', 'u', 0.02, 5)],
    [mo('Pintor decorativo', 1, 300), mo('Ayudante', 0.5, 150)],
    [eq('Nivel', 0.05, 3)]
  ),
  reng(`${prefix}-80`, '35.03', 'Lavado y sellado de fachada', 'm²', 30,
    [mat('Hidrolavadora', 'hora', 0.05, 45), mat('Detergente industrial', 'L', 0.05, 35), mat('Sellador acrílico', 'galón', 0.03, 185),
     mat('Agua', 'L', 5, 0.008)],
    [mo('Peón', 2, 150)],
    [eq('Andamio colgante', 0.033, 45), eq('Hidrolavadora', 0.033, 35)]
  ),
];

const adjustForTypology = (base: Renglon[], factor: number, prefix: string): Renglon[] =>
  base.map((r, i) => {
    const sub = r.subrenglones;
    const materiales = sub.materiales.map(m => ({ ...m, costoUnitario: Math.round(m.costoUnitario * factor) }));
    const manoObra = sub.manoObra.map(m => ({ ...m, jornal: Math.round(m.jornal * factor) }));
    const equipos = sub.equipos.map(e => ({ ...e, costoHora: Math.round(e.costoHora * factor) }));
  const costoMaterial = materiales.reduce((s, m) => s + m.cantidad * (1 + (m.desperdicio ?? 0) / 100) * m.costoUnitario, 0);
    const costoManoObra = manoObra.reduce((s, m) => s + m.cantidadPersonas * m.jornal / r.rendimiento, 0);
    const costoHerramienta = equipos.reduce((s, e) => s + e.cantidad * e.costoHora, 0);
    return {
      ...r, id: `${prefix}-${String(i + 1).padStart(2, '0')}`,
      costoMaterial: Math.round(costoMaterial * factor),
      costoManoObra: Math.round(costoManoObra * factor),
      costoHerramienta: Math.round(costoHerramienta * factor),
      subrenglones: { materiales, manoObra, equipos }
    };
  });

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

export function calcularAPU(linea: Renglon & { cantidad: number; baseTotalPersonas?: number }) {
  const sub = linea.subrenglones || { materiales: [], manoObra: [], equipos: [] };
  const materiales = sub.materiales || [];
  const manoObra = sub.manoObra || [];
  const equipos = sub.equipos || [];
  const costoMaterial = materiales.reduce((s, m) => s + m.cantidad * (1 + (m.desperdicio ?? 0) / 100) * m.costoUnitario, 0);
  const costoManoObra = manoObra.reduce((s, m) => s + m.cantidadPersonas * m.jornal / (linea.rendimiento || 1), 0);
  const costoHerramienta = equipos.reduce((s, e) => s + e.cantidad * e.costoHora, 0);
  const costoUnitario = costoMaterial + costoManoObra + costoHerramienta;
  const subtotal = costoUnitario * linea.cantidad;
  const currentPersonas = manoObra.reduce((s, m) => s + m.cantidadPersonas, 0);
  const basePersonas = linea.baseTotalPersonas ?? currentPersonas;
  const adjustedRendimiento = basePersonas > 0 && currentPersonas > 0
    ? (linea.rendimiento || 1) * (currentPersonas / basePersonas)
    : (linea.rendimiento || 1);
  const dias = adjustedRendimiento > 0 ? linea.cantidad / adjustedRendimiento : 0;
  const totalPersonasDia = manoObra.reduce((s, m) => s + m.cantidadPersonas * dias, 0);
  return { costoMaterial, costoManoObra, costoHerramienta, costoUnitario, subtotal, dias, totalPersonasDia };
}
