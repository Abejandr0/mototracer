# MotoTracer

Aplicación móvil para registrar rodadas, administrar motocicletas y compartir rutas. Usa Expo SDK 58, React Native, Expo Router y Supabase. El proyecto EAS ya está vinculado a la cuenta `abejandro`; la base de datos `mototracer-production` ya tiene aplicadas las migraciones incluidas en `supabase/migrations/`.

## Qué es una development build

Es una versión instalable de **MotoTracer**, compilada con sus módulos nativos. Expo Go es una app genérica y no incluye toda la configuración de ubicación en segundo plano, cámara, mapas y cliente de desarrollo de este proyecto. La development build sí; después de instalarla, los cambios de JavaScript se cargan desde Metro sin recompilar. Repite la build cuando cambien dependencias nativas, permisos o plugins.

### iPhone físico

Necesitas una cuenta activa del [Apple Developer Program](https://developer.apple.com/programs/), el iPhone registrado para distribución interna y el **Modo Desarrollador** activado en Ajustes → Privacidad y seguridad. Desde la raíz de este repositorio:

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
npx expo start --dev-client --tunnel
```

EAS pedirá configurar la firma de Apple la primera vez. Al terminar la build, abre el enlace de instalación en el iPhone registrado. Abre MotoTracer y elige el servidor de desarrollo. Si registras otro iPhone, vuelve a construir o firma de nuevo la build para incluir su UDID. Un simulador iOS requiere macOS; su perfil es `development-simulator`.

### Android físico

```bash
npx eas-cli@latest build --platform android --profile development
npx expo start --dev-client --tunnel
```

Instala el APK desde el enlace de EAS. Para mapas en una build Android hace falta `GOOGLE_MAPS_ANDROID_API_KEY`, restringida al paquete `com.abejandro.mototracer` y al SHA-1 de firma. El desarrollo en iPhone usa Apple Maps y no necesita esa clave.

## Backend y base de datos

Supabase aloja Auth, la base Postgres, el feed y Storage. Las motos, servicios, contactos, perfil y rutas privadas se sincronizan por cuenta en `rider_backups`, protegida por RLS. Las rutas publicadas y sus puntos GPS se guardan en tablas del feed. Las fotos del tablero están en el bucket privado `moto-private`; sus URL de lectura caducan. Las fotos de perfil y moto se guardan en `moto-media`.

El equipo local ya está enlazado al proyecto de producción. Para otra instalación, enlaza tu proyecto y aplica las migraciones:

```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push --remote --dry-run
npx supabase db push --remote --yes
```

En `.env` local, configura los valores del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
GOOGLE_MAPS_ANDROID_API_KEY=<ANDROID_MAPS_KEY>
```

Las dos variables de Supabase ya se registraron en EAS para `development`, `preview` y `production`. El archivo `.env` no se sube a Git. Para añadir la clave de Android a EAS, usa [Variables de entorno del proyecto](https://expo.dev/) en los tres entornos. El archivo `app.config.js` la incorpora en la configuración nativa durante la build. La publishable key es pública; nunca coloques la service role key en la app.

## Funciones actuales

- Bienvenida, cuenta obligatoria, aceptación de términos y privacidad, configuración de perfil y primera moto.
- Hasta cinco motocicletas; catálogo de marcas y modelos con entrada manual y sugerencias enviadas al backend.
- Foto de tablero en almacenamiento privado; OCR local sugiere el kilometraje y el usuario lo confirma antes de actualizar el odómetro y los servicios. El OCR usa `expo-ocr-kit`, por lo que requiere una **nueva development build** tras instalar esta versión; no funciona en Expo Go.
- GPS y mapa durante la rodada, velocidad nativa o calculada entre posiciones, distancia, inclinación, pausa, sensores, calibración, estadísticas por segmento y comparación con una ruta de referencia. Pausar, terminar y abrir SOS requieren mantener pulsado el botón dos segundos.
- Feed real con publicación opcional, likes y rutas de demostración claramente marcadas. Sus trazados ilustrativos se generaron con datos de OpenStreetMap mediante OSRM; el mapa del feed no intercepta gestos. Los primeros y últimos 200 m se recortan por defecto al publicar.
- Vista previa de una rodada, enlace de una ruta pública para abrirla en otra cuenta MotoTracer, compartir texto, exportar tarjeta PNG y GPX.
- SOS rojo con cuenta regresiva de 30 segundos. La función `send-sos` de Supabase envía con Twilio automáticamente cuando tiene secretos configurados, GPS y contactos sincronizados. Si falla, se abre Mensajes y el usuario confirma el envío. La detección depende de los sensores y del estado de la app.
- Respaldo local por cuenta, sincronización en la nube con estado visible, recuperación opcional de datos de la versión anterior y recuperación de rodada activa tras un reinicio.
- Ajustes de tema claro/oscuro/sistema, contraste, tamaño de texto, reducción de movimiento e inglés parcial para navegación y pantallas principales.

El idioma inicial ahora es inglés. El selector ofrece español y traducciones parciales a portugués y francés; estas dos últimas todavía no cubren todas las pantallas. Los controles de texto grande, contraste alto y movimiento reducido se aplican desde un componente común. Cambiar al tema del sistema requiere la nueva build que incluye expo-system-ui.

### Música durante la rodada

MotoTracer no puede controlar de forma general Spotify, Apple Music y otros reproductores desde una sola API del sistema. Cada servicio debe autorizar su propia integración. Spotify ofrece App Remote para Android e iOS, que requiere registro OAuth y consentimiento del usuario; la integración todavía no está incluida. No se muestran controles falsos en la pantalla de rodada.

### Confirmación de correo

La confirmación está activada en Supabase y el enlace de retorno `mototracer://auth-callback` ya está registrado en el proyecto de producción. La app admite enlace profundo, reenvío y código OTP. **El proyecto aún no tiene SMTP propio**: el servicio de correo predeterminado de Supabase está limitado a direcciones autorizadas del equipo, así que el registro de usuarios externos no se puede validar por correo hasta configurarlo. En [Supabase → Authentication → SMTP Settings](https://supabase.com/dashboard/project/mpeswbnmurnzjhklmctt/auth/smtp), configura un proveedor SMTP (por ejemplo Resend, SendGrid o SES) y verifica el dominio remitente. No coloques contraseñas SMTP en Git ni en la app. Después prueba registro y confirmación en una development build instalada en Android y iPhone; el enlace debe abrir MotoTracer. El idioma inglés de esta versión es parcial.

## Verificación y publicación

```bash
npx tsc --noEmit
npm run lint
npm run test:logic
npx expo-doctor
npx expo export --platform android
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform all --profile production
```

### Activar SMS automático con Twilio

La función `send-sos` y su tabla de auditoría ya están desplegadas. Los secretos `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER` ya figuran configurados en Supabase; los valores no son visibles desde el listado. `TWILIO_FROM_NUMBER` debe ser un número E.164, por ejemplo `+15551234567`, sin espacios, y corresponder a un **Incoming Phone Number** con capacidad SMS en la misma cuenta o subcuenta del SID configurado. Un número personal verificado como destinatario no sirve como emisor. Desde **Perfil → Verificar Twilio** puedes comprobar credenciales, formato y número sin enviar mensajes; la comprobación muestra solo los últimos cuatro caracteres del SID y del número configurado. Si aparece `from_number_not_in_account`, compara el SID con la cuenta/subcuenta propietaria del número en la consola de Twilio y corrige el secreto que no corresponda. Para cambiar secretos, usa el panel de Supabase **Edge Functions → Secrets** o un archivo `.env.twilio` local, excluido por `.gitignore`, con `npx supabase secrets set --env-file .env.twilio --remote`. **No pongas el token en Expo, Git ni el chat.** La función limita un SOS aceptado cada cinco minutos y cinco intentos al día por cuenta; lee sólo los contactos guardados en el respaldo privado de ese usuario. Un SMS aceptado por Twilio aún puede fallar en la entrega.

Antes de publicar en tiendas, configura la clave de Google Maps para Android; completa domicilio, dirección y teléfono del responsable en la política; prueba rutas, permisos de segundo plano, foto, SMS y restauración de datos en teléfonos reales; y revisa la política y términos con asesoría jurídica. Las rutas de demostración no se publican como usuarios reales.
