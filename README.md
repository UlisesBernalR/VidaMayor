# VidaMayor

App Android para acompañar a adultos mayores: **medicinas, citas, familia, emergencia y ubicación**, con un panel para que la familia vea cómo va el día. Proyecto escolar.

Está hecha con **HTML, CSS y JavaScript** y se empaqueta como **APK** con [Capacitor](https://capacitorjs.com). Los avisos de medicinas y citas son notificaciones locales del teléfono, así que llegan aunque la app esté cerrada.

---

## 1. ¿Qué trae?

| Pantalla | Qué hace |
|---|---|
| **Inicio** | Saludo, próximo medicamento (con botón *Ya lo tomé*), próxima cita, estado del día, llamada rápida y botón de emergencia |
| **Agenda** | Calendario sencillo con citas, actividades y recordatorios |
| **Medicinas** | Nombre, dosis, hora, confirmar toma, deshacer y pendientes |
| **Familia** | Familiares con foto, teléfono y botón *Llamar* |
| **SOS / Emergencia** | Botón grande, confirmación antes de enviar, llamar al 911, mensaje/WhatsApp a la familia con la ubicación |
| **Ubicación** | Compartir ubicación (GPS del teléfono), última ubicación y quién puede verla |
| **Mi perfil** | Datos, médico de confianza, información médica, **privacidad y permisos**, notificaciones y tamaño de letra |
| **Avisos** | Lista de lo pendiente: *"Hora de tomar medicamento"*, *"No se ha confirmado tu medicamento de las 10:00 a. m."* |
| **Panel familiar** | Lo que vería un familiar autorizado: medicinas confirmadas/pendientes, citas, ubicación y emergencias |

Diseño *Soft & Friendly*: letra grande (con 3 tamaños), alto contraste, botones amplios y pocos colores.

---

## 2. Ver la app en el navegador (sin compilar nada)

Necesitas [Node.js 22](https://nodejs.org) o más nuevo.

```bash
npm run dev
```

Abre <http://localhost:5173>. Para verla como celular: en Chrome pulsa `F12` y luego el ícono de celular.

> En el navegador los avisos solo funcionan con la app abierta y la ubicación pide permiso al navegador. En el APK funcionan con el sistema de Android.

---

## 3. Conseguir el APK

### Ruta A (recomendada): GitHub lo compila por ti

No necesitas instalar Android Studio.

1. Crea un repositorio **vacío** en GitHub.
2. Sube esta carpeta completa (incluida la carpeta oculta `.github`):
   ```bash
   git init
   git add .
   git commit -m "VidaMayor"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/vidamayor.git
   git push -u origin main
   ```
3. En GitHub entra a la pestaña **Actions**. Verás *Compilar APK* trabajando (tarda unos 6 a 10 minutos). También puedes lanzarlo a mano con **Run workflow**.
4. Cuando termine con ✅, abre esa ejecución y baja hasta **Artifacts**. Descarga **VidaMayor-apk**, descomprímelo y tendrás `app-debug.apk`.
5. Pásalo al celular (cable USB, Drive, WhatsApp…) y ábrelo. Android te pedirá permitir **instalar apps de origen desconocido** para la app desde la que lo abres. Acepta y listo.

### Ruta B: compilarlo en tu computadora

Necesitas: **Node 22+**, **JDK 21** y **Android Studio (Otter 2025.2.1 o más nuevo)** con el SDK de Android 36.

```bash
npm install
npm run android:add     # crea android/, agrega permisos, íconos y pantalla de inicio
npm run apk             # compila
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.
Para abrirlo en Android Studio y probarlo en un emulador: `npm run android:open`.
(En Windows, si `./gradlew` falla, usa `cd android` y `gradlew.bat assembleDebug`.)

### Si algo falla

> La interfaz y la lógica se probaron en navegador (65 pruebas) y los plugins del teléfono se probaron con simulaciones, pero **el APK no se pudo compilar donde se creó el proyecto** (ahí no hay SDK de Android). Si el flujo de GitHub falla, abre el paso en rojo, copia el error y con eso se corrige rápido.

| Mensaje | Qué hacer |
|---|---|
| `invalid source release: 21` | Estás usando Java 17 o menor. Instala JDK 21. |
| `The current Node.js version ... requires >=22` | Actualiza Node a la versión 22 o más nueva. |
| `Failed to install the following SDK components` o licencias | Abre Android Studio una vez y acepta las licencias del SDK (en GitHub Actions ya se aceptan solas). |
| Los avisos llegan con minutos de retraso | Ajustes del teléfono → Apps → VidaMayor → *Alarmas y recordatorios* → permitir. |

---

## 4. ¿Qué es real y qué es simulado?

**Funciona de verdad en el teléfono**
- Guardado de medicinas, citas, familiares y ajustes (se queda en el teléfono).
- Avisos de medicinas (a la hora y otro a los 30 min si no confirmas) y de citas (1 hora antes), aunque la app esté cerrada.
- GPS para la ubicación, llamadas (`tel:`), mensajes (`sms:`) y WhatsApp con un toque, y mapa.

**Simulado (está marcado en pantalla)**
- El **panel familiar** se ve en el mismo teléfono, solo para la demostración.
- El aviso de emergencia queda registrado en este teléfono; el envío automático a *otros* celulares y el aviso al familiar cuando olvidas una medicina necesitan un servidor.
- *Cambiar contraseña* y las cuentas reales (hoy *Cerrar sesión* solo regresa a la pantalla de entrada).

### Siguiente fase (para conectarla de verdad)
1. **Supabase** (Auth + PostgreSQL + Realtime) para cuentas, para que el panel familiar se vea en el celular del familiar y la alerta le llegue al instante.
2. Notificaciones *push* (Firebase Cloud Messaging) para avisar al familiar aunque su app esté cerrada.
3. Tablas sugeridas: `perfiles`, `medicinas`, `tomas`, `citas`, `familiares`, `ubicaciones` y `alertas`, todas con **RLS** (cada persona solo ve lo que le toca).

---

## 5. Permisos que pide la app

| Permiso | Para qué |
|---|---|
| Notificaciones | Avisos de medicinas y citas |
| Alarmas exactas | Que el aviso llegue justo a la hora |
| Ubicación | Compartir ubicación y adjuntarla a la emergencia (solo si la activas) |
| Iniciar con el teléfono | Volver a programar los avisos después de reiniciar |

> Nota: `USE_EXACT_ALARM` está pensado para apps de alarmas/calendario. Para un APK escolar no hay problema; si algún día la publicas en Google Play, tendrás que justificarlo o quitarlo de `scripts/patch-android.mjs`.

---

## 6. Estructura del proyecto

```
vidamayor/
├── www/                     La app (lo que se empaqueta en el APK)
│   ├── index.html
│   ├── style.css
│   └── script.js            Toda la lógica, comentada por secciones
├── assets/                  Ícono y pantalla de inicio (se generan con scripts/make-icons.py)
├── scripts/
│   ├── patch-android.mjs    Permisos, orientación vertical e ícono de notificación
│   ├── make-icons.py        Dibuja los íconos
│   └── serve.mjs            Servidor para verla en el navegador
├── .github/workflows/build-apk.yml   Compila el APK en GitHub
├── capacitor.config.json    ID de la app (mx.vidamayor.app) y ajustes de plugins
└── package.json
```

Para cambiar el nombre o el ID de la app edita `capacitor.config.json` **antes** de ejecutar `npm run android:add`.

---

*Versiones: Capacitor 8 (Node 22+, JDK 21, Android SDK 36). Los datos de ejemplo usan teléfonos ficticios.*
