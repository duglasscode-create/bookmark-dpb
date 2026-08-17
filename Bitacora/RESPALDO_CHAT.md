# 💬 RESPALDO DEL CHAT — BOOKMARK DPB

> Respaldo completo día por día de la conversación Duglass ↔ Qwen.
> Día 1: domingo 16 ago 2026 · Día 2: lunes 17 ago 2026

---

## 📅 DÍA 1 (domingo 16 ago)

1. **Metadata PWA:** se aclaró que va DENTRO de `export const metadata` y
   `viewport` separado (Next 16 lo exige aparte).
2. **iPad sin subir nada:** se explicó que la app vive en Vercel; el iPad solo
   la visita y se instala con "Agregar a pantalla de inicio".
3. **Icono "B" negra en iPad:** intentos con `apple-icon.png`, `apple-touch-icon.png`,
   `icons.apple` en metadata. Se descubrió doble extensión `.png.png`
   (Windows oculta extensiones). Se PAUSÓ por cansancio (el 404 real era porque
   el build de Vercel estaba fallando en ese momento).
4. **Extensión 1.4.0:** `manifest.json` 1.4.0, `theme.js` (tema claro/oscuro sin
   scripts inline → evita CSP), `save.html` con variables CSS, `save.js` con
   fallback SVG para iconos `lucide:`.
5. **Vercel no mostraba cambios:** el build fallaba por TypeScript:
   - `activityLog.ts` no tenía `"collection_updated"` → agregado al tipo + mapas.
   - `Sidebar` no aceptaba `onReorderCollections` → quitada de Sidebar.
   - `HomeView` SÍ la requería → agregada.
   - Archivo quedó roto por pegados parciales → se entregó `DashboardClient.tsx`
     completo verificado → **DEPLOY EXITOSO** 🎉.
6. **IconPicker ampliado** a 300+ iconos Lucide con buscador y contador.
7. **Header:** botón azul "+ Nuevo" reemplazado por 3 iconos UI
   (🔖+ marcador, 📁+ colección, 📝 notas); se quitó el flotante inferior.
8. **Tarjeta Notas en Home:** muestra nota 📌 fijada o la última
   (título + vista previa + fecha).
9. **Notas estilo Boardly:** ⋮ abre panel lateral derecho con Style (22 colores),
   Show Toolbar (editar inline sobre la nota), Editar, Fijar, Bloquear,
   Archivar, Papelera. Se quitó el botón "Barra" redundante.
10. **Highlighter inteligente:** espera 700 ms y se cancela con Ctrl+C/Copiar;
    no aparece en inputs/editables.
11. **Login en iPad:** magic link no entra (iOS aísla PWAs) → se probó código
    6 dígitos → "error sending confirmation email" (usuario sin confirmar) →
    **solución final:** contraseña puesta vía SQL (`crypt`) + login con pestañas
    🔑 Contraseña / 📧 Código. Cuenta personal confirmada en Supabase.
12. Se creó la primera `BITACORA.md`.

## 📅 DÍA 2 (lunes 17 ago)

1. **Sidebar iPad horizontal:** no expandía (solo hover) → estado
   `desktopExpanded` + botón »/« siempre visible bajo el logo.
   (Vertical = modo móvil con hamburguesa: correcto por diseño).
2. **Etiquetas:** quitadas del sidebar → botón 🏷️ en header con desplegable
   (puntos de color, mapa `TAG_DOT`).
3. **Botón 🔖+ duplicado** en header (pegado doble) → eliminado el sobrante.
4. **Acciones invisibles en iPad** (hover no existe) → CSS
   `@media (hover:none)` fuerza visibles `.group-hover:opacity-100/flex`.
5. **Cuadrícula limpia:** clase `view-mode-grid` + CSS que oculta acciones en
   cuadrícula; en Lista siguen visibles. ✅ confirmado.
6. **Logo:** se probó `/icon-512.png` pero no cargaba → revertido a emoji 🔖
   (decisión: queda así).
7. **Botón 📁+ colección** agregado al header; se eliminó un duplicado que
   quedó flotando en el centro.
8. **Orden del sidebar distinto por dispositivo** (localStorage es local) →
   **Opción B:** tabla `user_preferences` en Supabase; Sidebar carga/guarda
   `sidebar_order` con `upsert`. Errores de build corregidos:
   - faltaba `createClient` en Sidebar,
   - `setIsCollectionModalOpen` no existía → `setIsModalOpen`.
   → **Sincronización laptop ↔ iPad funcionando** ✅.
9. Usuario usará la app y avisará fallos. Pide bitácora actualizada + respaldo
   del chat + cómo subir a GitHub.

---

## 🔑 SQL IMPORTANTES (copiar y guardar)

```sql
-- Contraseña cuenta del proyecto
UPDATE auth.users
SET encrypted_password = crypt('Bookmark2024!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'duglasscode@gmail.com';

-- Preferencias (orden sidebar)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sidebar_order jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
```

## ⌨️ COMANDOS DE RESPALDO

```bash
git add .
git commit -m "docs: bitacora y respaldo del chat"
git push
```

---

*Este archivo es el respaldo histórico del proyecto. Guárdalo siempre en la
carpeta del proyecto para que viva en GitHub.*