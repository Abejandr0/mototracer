# MotoTracer

App móvil Expo/React Native para bikers. La interfaz sigue los ocho flujos del archivo de Figma: inicio, perfil/garaje, mantenimiento, calibración, SOS, análisis de ruta y HUD vertical/horizontal.

## Desarrollo

```bash
npm install
npx expo start
```

La ubicación, sensores y tareas con la pantalla bloqueada requieren un teléfono físico. Para el seguimiento en segundo plano usa una development build; Expo Go no puede ejecutar el servicio de ubicación de fondo.

## Backend Supabase

1. Crea un proyecto Supabase y abre su SQL Editor.
2. Ejecuta `supabase/migrations/202611070001_initial_schema.sql`.
3. Copia `.env.example` a `.env` y agrega la URL y publishable key del proyecto:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

4. Reinicia Metro. Crea una cuenta desde **Perfil → Cuenta MotoTracer**.
5. Antes de producción, registra las mismas variables como variables de entorno del proyecto EAS y evita guardar `.env` en Git.

La migración configura Auth profiles, motos, servicios, contactos privados, rodadas y sus puntos GPS, likes, almacenamiento de fotos y políticas RLS. El historial local se guarda en el dispositivo y se sincroniza como una copia privada al iniciar sesión. Las rutas son privadas hasta que el usuario las publique. Para conectar las cuentas de tienda, conserva el identificador EAS de `app.json`.

## Crear builds

```bash
npx eas-cli login
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform all
```

Para iOS se necesita una cuenta Apple Developer y credenciales de firma configuradas en EAS.

## Funciones

- HUD con GPS, velocidad, distancia, duración, velocidad media/máxima, inclinación y pausa.
- Registro de ubicación cuando la app pasa a segundo plano si el usuario concede ese permiso. El sistema operativo puede detener el servicio si fuerza el cierre de la app.
- Calibración guardada, historial de rutas, gráficos de velocidad/inclinación/G/frenado, tramos de 5 km, mapas, exportación GPX y comparación de rodadas repetidas.
- Garaje con selección de moto, fotos, odómetro, intervalo de aceite, servicios y estado manual de componentes.
- Perfil, avatar, contactos de emergencia, sensibilidad de impacto y apertura de SMS con ubicación para que el usuario confirme el envío.
- Registro e inicio de sesión, copia privada de datos, feed de rutas públicas y likes cuando Supabase está configurado.

## Límites que requieren decisiones antes de tiendas

- El SOS abre la aplicación de mensajes y requiere confirmación manual; iOS y Android no permiten que una app común envíe SMS silenciosamente. La detección usa el teléfono y no es un sistema de seguridad certificado. El acelerómetro puede no funcionar mientras la app está suspendida.
- Los estados de aceite, cadena, frenos y llantas se derivan de registros manuales, no de sensores de la moto.
- Las rutas públicas incluyen el trazado GPS; al publicar se recortan por defecto 200 m al inicio y al final. Esto no oculta por completo ubicaciones sensibles; el recorte puede desactivarse y el GPX descargado conserva el trazado íntegro.
- Para lanzar: crea y configura el proyecto Supabase, prueba políticas RLS y permisos en teléfonos reales, publica aviso de privacidad/consentimiento de ubicación y completa las cuentas de tiendas.

El proyecto usa Expo SDK 57. Instala módulos nativos con `npx expo install` para respetar versiones compatibles.
