# Plan de Pruebas - Fase 2

## ✅ Pruebas Completadas

### 1. Compilación TypeScript
- **Status**: ✅ PASSED
- **Resultado**: 2376 módulos transformados, build exitoso en 1.42s
- **Verificación**: No hay errores TS, imports correctos, tipos respetados

### 2. Animaciones (Framer Motion)
- **Archivo**: `src/components/AnimatedList.tsx`, `src/components/FeedbackGuardado.tsx`
- **Test Manual**: 
  - [ ] Agregar línea → verifica stagger animation de entrada
  - [ ] Eliminar línea → verifica fade out animation
  - [ ] Feedback de guardado → verifica animación de icono
  
### 3. Presencia Colaborativa
- **Archivo**: `src/hooks/usePresenciaPresupuesto.ts`
- **Test Manual**:
  - [ ] Abre presupuesto en navegador 1
  - [ ] Abre mismo presupuesto en navegador 2 (sesión diferente)
  - [ ] Verifica que avatares aparezcan en ambos editores
  - [ ] Cierra sesión 1 → avatar debe desaparecer en sesión 2

### 4. Bloqueo Optimista
- **Archivo**: `src/hooks/useBloqueoEdicion.ts`
- **Test Manual**:
  - [ ] Usuario A abre presupuesto
  - [ ] Usuario B abre mismo presupuesto
  - [ ] Verifica alerta "Otro usuario está editando..." en ambos
  - [ ] Usuario A agrega línea → alerta visible en B (opcional feedback)

### 5. Indicador de Guardado
- **Archivo**: `src/components/FeedbackGuardado.tsx`
- **Test Manual**:
  - [ ] Agregar línea → muestra "Guardando..." (spinner)
  - [ ] Espera 500ms → muestra "Guardado" (checkmark)
  - [ ] Verifica auto-hide después de 2s
  - [ ] Simula error → muestra icono de error (AlertCircle)

### 6. Exportación PDF
- **Archivo**: `src/utils/exportPDF.ts`
- **Test Manual**:
  - [ ] Navega a presupuesto con líneas
  - [ ] Haz clic botón "PDF" en header
  - [ ] Verifica descarga de archivo
  - [ ] Abre PDF → verifica:
    - [ ] Logo/branding en header
    - [ ] Fecha y usuario
    - [ ] Tabla de líneas con datos
    - [ ] Panel de análisis con gráficos

### 7. Filtros Avanzados
- **Archivo**: `src/components/PresupuestoScreenV3.tsx` (BibliotecaRenglones)
- **Test Manual**:
  - [ ] Haz clic en categoría "Materiales" → verifica filtrado
  - [ ] Selecciona múltiples filtros → verifica AND lógico
  - [ ] Usa búsqueda + filtros → verifica combinación
  - [ ] Haz clic en badge para remover filtro → verifica actualización

### 8. Comparación de Presupuestos
- **Archivo**: `src/components/CompararPresupuestos.tsx`
- **Test Manual**:
  - [ ] Navega a pestaña "Comparar"
  - [ ] Selecciona dos presupuestos diferentes
  - [ ] Verifica tabla lado a lado
  - [ ] Busca diferencias resaltadas (amber-50)
  - [ ] Haz clic "Exportar Comparación" → verifica PDF

## 📋 Pruebas Pendientes

### Performance
- [ ] Build size analysis (chunks > 500 kB, considerar code splitting)
- [ ] Runtime performance: agregar 100+ líneas → verificar fluidez de animaciones
- [ ] Memory profile: abrir/cerrar presupuestos repetidamente
- [ ] Scroll performance en lista larga con AnimatedList

### Integración
- [ ] Supabase Realtime: verifica broadcast channels activos
- [ ] RLS policies: verifica que solo el usuario vea sus datos
- [ ] Auth: verifica que usuario desconocido no pueda editar

### Edge Cases
- [ ] Agregar línea con cantidad = 0 → verifica cálculos
- [ ] Presupuesto con 1000+ líneas → performance, UI responsiva
- [ ] Desconexión de red → verifica manejo de errores
- [ ] Dos usuarios agregando línea simultáneamente → verifica sincronización
- [ ] Eliminar presupuesto mientras otro usuario lo edita
- [ ] Cambiar filtros mientras agrego línea

## 🚀 Checklist de Validación Final

- [ ] Build sin warnings críticos ✅ (completado)
- [ ] TypeScript strict mode sin errores ✅ (completado)
- [ ] Todos los hooks importados correctamente ✅ (completado)
- [ ] FeedbackGuardado integrado en header ✅ (completado)
- [ ] AnimatedList integrado en EditorLineas ✅ (completado)
- [ ] PDF export funciona sin errores
- [ ] Presencia colaborativa activa en Realtime
- [ ] Bloqueo optimista visible en editor
- [ ] Comparación de presupuestos lado a lado
- [ ] Animaciones suaves en transiciones
- [ ] Performance: <3s para load de presupuesto grande
- [ ] No memory leaks en cambios de componentes

## 🔄 Próximas Mejoras (Fase 3)

1. **Historial de Cambios** (Undo/Redo)
2. **Versionado de Presupuestos** (Control de versiones integrado)
3. **Colaboración Real-Time** (Operational Transformation para edición simultánea)
4. **Notificaciones Push** (Supabase Realtime + Notifications)
5. **Templates** (Guardar como plantilla reutilizable)
6. **Analytics** (Seguimiento de uso, tendencias)

---

**Última actualización**: Fase 2 - Compilación exitosa  
**Siguiente**: Ejecución de pruebas manuales en navegador
