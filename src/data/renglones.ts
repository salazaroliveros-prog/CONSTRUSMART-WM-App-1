export interface SubMaterial {
  nombre: string;
  unidad: string;
  cantidad: number;
  costoUnitario: number;
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

function mat(nombre: string, unidad: string, cantidad: number, costoUnitario: number): SubMaterial {
  return { nombre, unidad, cantidad, costoUnitario };
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
    [mat('Cemento UGC', 'bolsa', 3.5, 85), mat('Arena de río', 'm³', 0.4, 120), mat('Piedra bola 6"', 'm³', 0.5, 150), mat('Agua', 'L', 170, 0.008)],
    [mo('Albañil', 2, 250), mo('Ayudante', 3, 150)],
    [eq('Mezcladora de concreto 1 saco', 0.4, 55), eq('Carretilla', 0.4, 5), eq('Vibrador', 0.2, 35)]
  ),
  reng(`${prefix}-06`, '03.02', 'Zapata aislada de concreto reforzado', 'm³', 1.5,
    [mat('Cemento UGC', 'bolsa', 6, 85), mat('Arena de río', 'm³', 0.5, 120), mat('Grava 3/4"', 'm³', 0.8, 165),
     mat('Acero refuerzo No.4', 'qq', 0.9, 420), mat('Alambre de amarre', 'lb', 2, 8), mat('Madera para encofrado', 'pt', 8, 8)],
    [mo('Albañil', 2, 250), mo('Ayudante', 3, 150), mo('Armador', 1, 280)],
    [eq('Mezcladora de concreto', 0.67, 55), eq('Vibrador', 0.33, 35), eq('Cizalla para acero', 0.1, 25)]
  ),
  reng(`${prefix}-07`, '03.03', 'Solera de humedad 0.15x0.20m', 'ml', 18,
    [mat('Cemento UGC', 'bolsa', 0.35, 85), mat('Arena de río', 'm³', 0.03, 120), mat('Grava 3/4"', 'm³', 0.04, 165),
     mat('Acero No.3', 'qq', 0.08, 420), mat('Madera encofrado', 'pt', 1, 8)],
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
    [mat('Block 0.14x0.19x0.39m', 'u', 13, 5.5), mat('Cemento UGC', 'bolsa', 0.3, 85), mat('Arena de río', 'm³', 0.025, 120),
     mat('Agua', 'L', 15, 0.008), mat('Alambre', 'lb', 0.05, 8)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.083, 55), eq('Andamio', 0.083, 8)]
  ),
  reng(`${prefix}-12`, '05.02', 'Levantado de muro block 0.19m', 'm²', 10,
    [mat('Block 0.19x0.19x0.39m', 'u', 13, 7.5), mat('Cemento UGC', 'bolsa', 0.35, 85), mat('Arena de río', 'm³', 0.03, 120),
     mat('Agua', 'L', 18, 0.008)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Mezcladora', 0.1, 55), eq('Andamio', 0.1, 8)]
  ),
  reng(`${prefix}-13`, '06.01', 'Losa tradicional t=0.10m', 'm²', 15,
    [mat('Cemento UGC', 'bolsa', 0.65, 85), mat('Arena de río', 'm³', 0.05, 120), mat('Grava 3/4"', 'm³', 0.08, 165),
     mat('Acero No.3', 'qq', 0.12, 420), mat('Malla electro soldada', 'm²', 1, 32), mat('Madera para losa', 'pt', 3, 8),
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
    [mat('Cemento UGC', 'bolsa', 0.2, 85), mat('Arena fina', 'm³', 0.015, 135), mat('Agua', 'L', 8, 0.008)],
    [mo('Albañil', 1, 250), mo('Ayudante', 0.5, 150)],
    [eq('Andamio', 0.056, 8), eq('Mezcladora', 0.056, 55)]
  ),
  reng(`${prefix}-16`, '07.02', 'Cernido vertical', 'm²', 20,
    [mat('Cemento blanco', 'bolsa', 0.15, 95), mat('Cal hidratada', 'bolsa', 0.05, 35), mat('Arena fina', 'm³', 0.012, 135)],
    [mo('Albañil', 1, 250), mo('Ayudante', 0.5, 150)],
    [eq('Andamio', 0.05, 8)]
  ),
  reng(`${prefix}-17`, '07.03', 'Repello + cernido en cielo', 'm²', 12,
    [mat('Cemento UGC', 'bolsa', 0.25, 85), mat('Cemento blanco', 'bolsa', 0.1, 95), mat('Arena fina', 'm³', 0.02, 135),
     mat('Agua', 'L', 10, 0.008)],
    [mo('Albañil', 1, 250), mo('Ayudante', 1, 150)],
    [eq('Andamio', 0.083, 8), eq('Mezcladora', 0.083, 55)]
  ),
  reng(`${prefix}-18`, '08.01', 'Piso cerámico 0.45x0.45m', 'm²', 15,
    [mat('Cerámico 0.45x0.45m', 'm²', 1.05, 95), mat('Pegamento para cerámico', 'bolsa', 0.35, 42), mat('Boquilla cementicia', 'lb', 0.15, 8),
     mat('Cemento UGC', 'bolsa', 0.08, 85), mat('Arena fina', 'm³', 0.008, 135)],
    [mo('Pisero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortadora de cerámico', 0.067, 25), eq('Nivel', 0.067, 3)]
  ),
  reng(`${prefix}-19`, '08.02', 'Piso porcelanato 0.60x0.60m', 'm²', 12,
    [mat('Porcelanato 0.60x0.60m', 'm²', 1.05, 175), mat('Pegamento porcelanato', 'bolsa', 0.4, 55), mat('Boquilla epóxica', 'lb', 0.12, 18),
     mat('Cemento UGC', 'bolsa', 0.08, 85), mat('Arena fina', 'm³', 0.008, 135)],
    [mo('Pisero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortadora de cerámico', 0.083, 25), eq('Nivel', 0.083, 3)]
  ),
  reng(`${prefix}-20`, '08.03', 'Azulejo en pared baño', 'm²', 10,
    [mat('Azulejo 0.33x0.33m', 'm²', 1.05, 120), mat('Pegamento', 'bolsa', 0.4, 42), mat('Boquilla', 'lb', 0.18, 8),
     mat('Cruz para azulejo', 'u', 8, 0.1)],
    [mo('Pisero', 1, 300), mo('Ayudante', 1, 150)],
    [eq('Cortadora', 0.1, 25), eq('Nivel', 0.1, 3)]
  ),
  reng(`${prefix}-21`, '09.01', 'Instalación hidráulica PVC 1/2"', 'pto', 4,
    [mat('Tubo PVC 1/2"', 'm', 2.5, 12), mat('Codo PVC 1/2"', 'u', 4, 3.5), mat('Tee PVC 1/2"', 'u', 2, 4.5),
     mat('Adaptador PVC', 'u', 2, 3), mat('Pegamento PVC', 'Lata', 0.05, 45), mat('Cinta teflón', 'u', 0.3, 5)],
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
  reng(`${prefix}-36`, '14.01', 'Acera de concreto t=0.08m', 'm²', 15,
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
];

const adjustForTypology = (base: Renglon[], factor: number, prefix: string): Renglon[] =>
  base.map((r, i) => {
    const sub = r.subrenglones;
    const materiales = sub.materiales.map(m => ({ ...m, costoUnitario: Math.round(m.costoUnitario * factor) }));
    const manoObra = sub.manoObra.map(m => ({ ...m, jornal: Math.round(m.jornal * factor) }));
    const equipos = sub.equipos.map(e => ({ ...e, costoHora: Math.round(e.costoHora * factor) }));
    const costoMaterial = materiales.reduce((s, m) => s + m.cantidad * m.costoUnitario, 0);
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

export function calcularAPU(linea: Renglon & { cantidad: number }) {
  const sub = linea.subrenglones;
  const costoMaterial = sub.materiales.reduce((s, m) => s + m.cantidad * m.costoUnitario, 0);
  const costoManoObra = sub.manoObra.reduce((s, m) => s + m.cantidadPersonas * m.jornal / linea.rendimiento, 0);
  const costoHerramienta = sub.equipos.reduce((s, e) => s + e.cantidad * e.costoHora, 0);
  const costoUnitario = costoMaterial + costoManoObra + costoHerramienta;
  const subtotal = costoUnitario * linea.cantidad;
  const dias = linea.rendimiento > 0 ? linea.cantidad / linea.rendimiento : 0;
  const totalPersonasDia = sub.manoObra.reduce((s, m) => s + m.cantidadPersonas * dias, 0);
  return { costoMaterial, costoManoObra, costoHerramienta, costoUnitario, subtotal, dias, totalPersonasDia };
}
