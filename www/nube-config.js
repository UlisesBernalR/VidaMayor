/* VidaMayor — configuración de la nube (Supabase)

   Para activar "Familia conectada":
   1) Crea tu proyecto en https://supabase.com y ejecuta supabase/esquema.sql (ver GUIA-SUPABASE.md).
   2) Copia aquí la dirección del proyecto (Project URL) y la clave pública (anon / publishable key).
   3) Guarda este archivo y vuelve a subir los cambios a GitHub para compilar el APK.

   Si lo dejas vacío, la app funciona igual pero sin conexión con la familia (modo demostración).
   La clave pública NO es secreta: está pensada para ir dentro de la app. Lo que protege los datos
   son las reglas de la base de datos (supabase/esquema.sql). */
window.VIDAMAYOR_NUBE = {
  url: 'https://tdtqdyflvgzjnxjjqjxs.supabase.co',    // Ej. 'https://abcdefghijklmnop.supabase.co'
  clave: 'sb_publishable_QL-JOJJ5spe4btYfzPAxZg_0qpm6__g',  // Ej. 'eyJhbGciOi…' (anon) o 'sb_publishable_…'
};
