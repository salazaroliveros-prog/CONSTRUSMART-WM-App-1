# CONSTRUSMART WM - Esquema de Conexiones y Relaciones
## Diagrama Visual - 28 de Mayo de 2026

```mermaid
graph TB
    subgraph "Auth & Sistema"
        AUTH["<b>auth.users</b><br/>id (PK)<br/>email, password"]
    end

    subgraph "Núcleo de Negocio"
        CLI["<b>clientes</b><br/>id, user_id<br/>nombre, email, telefono"]
        PRY["<b>proyectos</b><br/>id, user_id<br/>nombre, presupuesto_total"]
        PRE["<b>presupuestos</b><br/>id, user_id, proyecto_id<br/>proyecto, tipologia, total"]
    end

    subgraph "Presupuestos - Estructura APU"
        SUBE["<b>subrenglones</b><br/>id, presupuesto_id<br/>codigo, descripcion, subtotal"]
        SUBM["<b>subrenglon_materiales</b><br/>id, subrenglon_id<br/>nombre, cantidad, costo_unitario"]
        SUBMO["<b>subrenglon_mano_obra</b><br/>id, subrenglon_id<br/>descripcion, personas, jornal"]
        SUBE_EQ["<b>subrenglon_equipos</b><br/>id, subrenglon_id, equipo_id<br/>descripcion, cantidad, costo_hora"]
    end

    subgraph "Control de Estándares"
        RENG["<b>renglones</b><br/>id, codigo<br/>descripcion, rendimiento<br/>costos (M, MO, H)"]
        RENG_USO["<b>renglon_usage</b><br/>id, presupuesto_id<br/>renglon_id"]
        RENG_HIST["<b>renglon_precios_historial</b><br/>id, renglon_id<br/>costo_anterior, costo_nuevo"]
    end

    subgraph "Equipos y Personal"
        EQUIP["<b>equipos</b><br/>id, user_id<br/>proyecto_id (NEW!)<br/>nombre"]
        EMIE["<b>equipo_miembros</b><br/>id, equipo_id, user_id<br/>rol"]
        EMPL["<b>empleados</b><br/>id, user_id<br/>nombre, salario_diario"]
    end

    subgraph "Almacén y Materiales"
        MAT["<b>materiales_proyecto</b><br/>id, proyecto_id<br/>nombre, cantidad, costo"]
        MOV["<b>movimientos_materiales</b><br/>id, proyecto_id, material_id<br/>tipo: entrada|salida|ajuste"]
    end

    subgraph "Compras y Proveeduría"
        PROV["<b>proveedores</b><br/>id, user_id<br/>nombre, contacto, email"]
        OC["<b>ordenes_compra</b><br/>id, user_id, proveedor_id<br/>proyecto_id, folio, total"]
        OCI["<b>orden_compra_items</b><br/>id, orden_compra_id<br/>material_id, cantidad"]
        REC["<b>recepcion_oc</b><br/>id, orden_compra_id, user_id<br/>fecha_recepcion"]
        RECI["<b>recepcion_oc_items</b><br/>id, recepcion_id<br/>orden_compra_item_id"]
    end

    subgraph "Transacciones y Finanzas"
        TRANS["<b>transacciones</b><br/>id, user_id<br/>presupuesto_id (NEW!)<br/>empleado_id, tipo, total"]
        CONC["<b>presupuesto_conciliaciones</b><br/>id, presupuesto_id, user_id"]
        PARTIC["<b>partidas_conciliacion</b><br/>id, conciliacion_id<br/>concepto, valor"]
    end

    subgraph "Seguimiento y Control"
        BIT["<b>bitacora_avance</b><br/>id, presupuesto_id<br/>proyecto_id (NEW!)<br/>fase, avance_porcentaje"]
        ACT["<b>actividades</b><br/>id, presupuesto_id<br/>usuario_id, titulo, estado"]
        CHECKLIST["<b>checklist_items</b><br/>id, presupuesto_id<br/>fase, item, completado"]
        CAMBIOS["<b>cambios_presupuesto</b><br/>id, presupuesto_id<br/>usuario_id, monto"]
    end

    subgraph "Notificaciones y Datos"
        NOT["<b>notificaciones</b><br/>id, user_id<br/>tipo, titulo, mensaje"]
        DEVICE["<b>device_tokens</b><br/>id, user_id<br/>token"]
        OCR["<b>ocr_documentos</b><br/>id, user_id<br/>url, datos_json"]
        AUDIT["<b>audit_log</b><br/>id, user_id<br/>tabla, operacion"]
    end

    %% Relaciones hacia AUTH
    CLI -->|user_id FK| AUTH
    PRY -->|user_id FK| AUTH
    PRE -->|user_id FK| AUTH
    EQUIP -->|user_id FK| AUTH
    EMIE -->|user_id FK| AUTH
    EMPL -->|user_id FK| AUTH
    PROV -->|user_id FK| AUTH
    OC -->|user_id FK| AUTH
    TRANS -->|user_id FK| AUTH
    NOT -->|user_id FK| AUTH
    DEVICE -->|user_id FK| AUTH
    OCR -->|user_id FK| AUTH
    AUDIT -->|user_id FK| AUTH

    %% Relaciones Presupuestos
    PRE -->|proyecto_id FK| PRY
    SUBE -->|presupuesto_id FK| PRE
    RENG_USO -->|presupuesto_id FK| PRE
    BIT -->|presupuesto_id FK| PRE
    ACT -->|presupuesto_id FK| PRE
    CHECKLIST -->|presupuesto_id FK| PRE
    CAMBIOS -->|presupuesto_id FK| PRE
    CONC -->|presupuesto_id FK| PRE
    TRANS -->|presupuesto_id FK(NEW!)| PRE

    %% Relaciones Proyectos
    EQUIP -->|proyecto_id FK(NEW!)| PRY
    MAT -->|proyecto_id FK| PRY
    MOV -->|proyecto_id FK| PRY
    OC -->|proyecto_id FK| PRY
    BIT -->|proyecto_id FK(NEW!)| PRY

    %% Relaciones Subrenglones
    SUBM -->|subrenglon_id FK| SUBE
    SUBMO -->|subrenglon_id FK| SUBE
    SUBE_EQ -->|subrenglon_id FK| SUBE
    MOV -->|subrenglon_id FK| SUBE

    %% Relaciones Equipos
    EMIE -->|equipo_id FK| EQUIP
    SUBE_EQ -->|equipo_id FK(NEW!)| EQUIP

    %% Relaciones Empleados
    TRANS -->|empleado_id FK| EMPL

    %% Relaciones Renglones
    RENG_USO -->|renglon_id FK| RENG
    RENG_HIST -->|renglon_id FK| RENG

    %% Relaciones Materiales
    MOV -->|material_id FK| MAT
    OCI -->|material_id FK| MAT
    SUBM -.->|Referencia lógica| MAT

    %% Relaciones Compras
    OCI -->|orden_compra_id FK| OC
    REC -->|orden_compra_id FK| OC
    PROV -->|FK| OC
    RECI -->|recepcion_oc_id FK| REC
    RECI -->|orden_compra_item_id FK| OCI

    %% Relaciones Conciliaciones
    PARTIC -->|conciliacion_id FK| CONC

    %% Trigger Auto-Movimiento
    RECI -.->|Trigger: crea automático| MOV

    style AUTH fill:#e1f5ff
    style PRE fill:#fff3e0
    style SUBE fill:#f3e5f5
    style SUBM fill:#f3e5f5
    style EQUIP fill:#e8f5e9
    style MAT fill:#fce4ec
    style OC fill:#fff9c4
    style TRANS fill:#ede7f6
    style NOT fill:#f0f4c3
    style RECI fill:#c8e6c9
