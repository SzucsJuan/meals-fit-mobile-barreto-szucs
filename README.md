# Meals&Fit Mobile

Aplicación mobile de **Meals&Fit** desarrollada con **React Native (Expo)**.  
Consume la API REST del backend Laravel y permite a los usuarios:

- Autenticarse
- Ver recetas
- Editar y/o eliminar recetas
- Registrarse

---

## 📦 Requisitos previos

### Mobile (React Native / Expo)

- Node.js >= 18
- PNPM
- Expo (`npx expo` funciona sin instalación global)
- Android Studio / Xcode (para emulador) – opcional
- Dispositivo físico con **Expo Go** instalado (Android/iOS), opcional pero recomendado

---

## 🧱 Estructura del proyecto

```bash
.
├─ backend/           # API Laravel (Meals&Fit backend)
├─ frontend/          # Frontend web (Next.js)
-Git Mobile
└─ MealsFitMobile/            # App mobile (React Native / Expo)

-------------------------------------------------------------------------------------

💾 Instalación de dependencias (mobile)

cd MealsFitMobile
pnpm install 

-------------------------------------------------------------------------------------

▶️ Correr proyecto en local
--Levantar mobile (Expo)

cd MealsFitMobile

npx expo start
# Tener abierto el emulador. En caso de utilizar celular fisico se debe ingresar la ip de la PC en la red dentro de .env.ts

Se abrirá la interfaz de Expo en la terminal o en el navegador.

-- Opciones de ejecución

# Dispositivo físico

Conectá el teléfono a la misma red WiFi que tu PC.

Instalá Expo Go desde la store.

Escaneá el QR que muestra Expo.

# Emulador Android

Abrí Android Studio, un dispositivo virtual.

En la consola de Expo: presioná a para abrir en Android.

-------------------------------------------------------------------------------------

🔄 Flujo de conexión con la API

El backend Laravel debe estar corriendo (http://<IP-PC>:8000).

EXPO_PUBLIC_API_BASE_URL en mobile debe apuntar a esa URL.

Los requests (login, recetas, etc.) usan esa URL.