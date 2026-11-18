Decisiones Técnicas y Respuestas Conceptuales
1. Base de Datos y Modelo de Datos 

Modelo Entidad-Relación (DER) y Reglas de Negocio 
El diseño lógico se encuentra documentado en docs/DER_inventario.png y se 
materializa en cuatro tablas relacionales:

1. categorias (id_Categoria, nombre, descripcion): Relación 1:N hacia 
productos. 
2. productos (id_Producto, nombre, categoria_id, precio_unitario, 
stock_actual, stock_minimo): Clave foránea categoria_id NOT NULL con 
política ON DELETE RESTRICT para garantizar que ningún producto exista sin 
categoría asignada. El precio utiliza tipo decimal exacto Numeric(10, 2) (NOT 
NULL, > 0) para evitar imprecisiones de punto flotante. 
3. movimientos (id_Movimiento, producto_id, tipo, cantidad, fecha, motivo, 
usuario): Registra cada entrada o salida con timestamp UTC obligatorio, 
cantidad positiva (> 0) e identificación del usuario responsable. 
4. productos_historial: Tabla dedicada de auditoría (append-only). 
Elección de Capa de Persistencia (ORM + Alembic vs. SQL Puro) 

Se seleccionó SQLAlchemy 2.0 (ORM) acompañado de Alembic para las migraciones 
porque: 
  • Centraliza la definición del esquema y sus restricciones en clases Python 
tipadas, reduciendo la duplicación entre modelos de base de datos y contratos de 
la API. 
  • Previene vulnerabilidades de inyección SQL mediante consultas parametrizadas 
nativas y optimiza la carga de relaciones mediante joinedload (evitando 
consultas N+1). 
  • Permite versionar evoluciones del esquema de forma reproducible entre 
desarrollo y producción a través de migraciones automáticas en Alembic. 
Estrategia de Defensa en Profundidad para Stock No Negativo (3 Barreras) 

Para asegurar que stock_actual nunca sea menor a 0 (permitiendo llegar a 0 al agotar 
existencias): 
  1. Barrera 1 — Nivel Motor SQL (CheckConstraint): Restricciones físicas 
CHECK (stock_actual >= 0), CHECK (stock_minimo >= 0) y CHECK 
(precio_unitario > 0) en productos, junto con CHECK (cantidad > 0) en 
movimientos. Impiden corrupción de datos incluso ante inserciones externas a 
la API. 
  2. Barrera 2 — Nivel Concurrencia (Bloqueo Pesimista): Al procesar 
movimientos de SALIDA, el repositorio ejecuta .with_for_update() (SELECT 
... FOR UPDATE) dentro de una transacción explícita. Esto serializa el acceso a 
la fila del producto cuando dos usuarios intentan descontar las últimas unidades 
simultáneamente, eliminando condiciones de carrera (race conditions). 
  3. Barrera 3 — Nivel Capa de Servicio (Validación de Dominio): Antes de 
ejecutar commit(), el servicio verifica todas las reglas de negocio 
(disponibilidad de stock, obligatoriedad de motivo en salidas, existencia de 
producto) y lanza excepciones de dominio personalizadas 
(StockInsuficienteError, ReglaNegocioError) que la API traduce a 
respuestas HTTP controladas (409 Conflict / 400 Bad Request). 

Auditoría de Cambios en Productos (productos_historial) 
• Cómo se guarda: Patrón de solo inserción (append-only) que registra 
producto_id, campo_modificado ('nombre' o 'precio_unitario'), 
valor_anterior, valor_nuevo, fecha_cambio (UTC) y usuario responsable. 
• Dónde se guarda: En una tabla separada dentro de la misma base de datos 
relacional (productos_historial). Guardarlo en la misma tabla productos 
rompería la unicidad de las claves primarias referenciadas por movimientos, 
mientras que delegarlo a un servicio externo añadiría complejidad operativa 
innecesaria para una PyME y rompería la atomicidad transaccional ACID 
(riesgo de actualizar el precio pero perder el evento de auditoría ante un fallo de 
red). 

2. Backend 

  • Lenguaje y Framework: Python 3.12 con FastAPI, elegido por su 
rendimiento asíncrono, validación automática de esquemas mediante Pydantic 
v2, sistema nativo de inyección de dependencias (Depends) para sesiones de BD 
y seguridad, y generación automática de documentación OpenAPI/Swagger. 
  • Organización por Capas: 
o api/routes/: Controladores HTTP puros (auth.py, productos.py, 
movimientos.py), sin SQL ni reglas de negocio. 
o schemas/: Contratos Pydantic de entrada y salida. 
o services/: Orquestación transaccional, validaciones de dominio y 
escritura de auditoría. 
o repositories/: Consultas ORM optimizadas y bloqueos de 
concurrencia. 
o models/: Definición estructural de tablas y constraints. 
o core/: Configuración global, constantes, seguridad, logging y manejo 
centralizado de excepciones. 

• Configuración de Reglas y Entornos (Twelve-Factor App): Las reglas 
estructurales invariables (ENTRADA/SALIDA, roles) se definen mediante Enums y 
restricciones SQL. Los parámetros variables (credenciales, DATABASE_URL, 
CORS_ORIGINS, secretos JWT) se inyectan mediante variables de entorno (.env 
excluido en .gitignore, .env.example versionado como plantilla). 
    • Despliegue: Contenedor ligero python:3.12-slim ejecutado con usuario sin 
privilegios (appuser), listo para desplegarse en plataformas PaaS (Render, 
Railway o Fly.io) conectadas a PostgreSQL gestionado. 
    • Seguridad (RBAC y Contraseñas): Autenticación sin estado mediante JWT 
(Bearer token) y contraseñas almacenadas exclusivamente mediante hash 
criptográfico lento Argon2id con sal aleatoria. Tres perfiles implementados: 
o LECTURA: Acceso exclusivo a consultas (GET). 
o OPERADOR: Consultas y registro de movimientos (POST /movimientos). 
o ADMIN: Acceso total, incluyendo edición de productos, precios y 
umbrales (PATCH /productos/{id}). 
    • Logs Técnicos vs. Auditoría de Negocio: Los logs de aplicación se emiten en 
formato JSON estructurado hacia stdout (registrando método HTTP, ruta, 
código de estado, latencia y trazas de error, sin exponer tokens ni contraseñas), 
mientras que la auditoría operativa reside de forma inmutable en PostgreSQL. 
• Endpoint Principal (GET /productos): Soporta filtrado opcional por categoría 
(GET /productos?categoria=electronica) insensible a mayúsculas y 
acentos, devolviendo el objeto de categoría completo con su nombre legible. 


3. Frontend 
• Elección Tecnológica (React vs. Streamlit): Se eligió React + TypeScript + 
Tailwind CSS frente a Streamlit. Mientras Streamlit está orientado a prototipos 
rápidos o tableros analíticos de solo lectura (re-ejecutando todo el script ante 
cada interacción), React permite gestionar estados complejos en cliente, ocultar 
o habilitar acciones dinámicamente según el rol RBAC, validar formularios 
transaccionales en tiempo real y ofrecer una interfaz fluida para uso operativo 
diario multi-usuario.

• Diseño de Pantallas y Experiencia de Usuario (UX): 
    o Tabla de Productos: Presenta Producto, Categoría, Precio 
Unitario, Stock Actual, Estado y Acciones (omitiendo IDs técnicos 
internos para no contaminar la vista operativa). Los estados utilizan 
doble codificación accesible (color + texto + ícono): verde "Óptimo", 
ámbar "Stock Bajo" y rojo "Sin Stock / Crítico". 
    o Alerta de Stock Bajo: Implementada mediante un banner superior 
resumen no intrusivo (evitando pop-ups o toasts repetitivos que generan 
fatiga de alertas). Utiliza un umbral stock_minimo configurable por 
producto, ordena los artículos críticos por urgencia (stock_actual === 
0 primero) y ofrece un filtro de un clic ("Ver productos afectados") junto 
con acceso directo a "Registrar Entrada". 
    o Gráfico de Stock: Gráfico de barras horizontales con línea de referencia 
punteada que permite visualizar rápidamente qué artículos están por 
debajo del umbral mínimo. 
    o Formulario de Movimiento: Incluye selector con buscador de producto 
(mostrando stock disponible), selector segmentado Entrada / Salida, 
motivo obligatorio en salidas y validación preventiva dinámica 
(max={stock_actual} en salidas con mensaje de error en tiempo real y 
bloqueo del botón "Confirmar Movimiento"). 


5. Control de Versiones (Git y GitHub) 
• Estrategia de Ramas: Rama main con el código estable listo para producción, 
rama develop para integración y ramas feature/... y docs/... aisladas por 
cada capa funcional. 
    • Commits Atómicos: Historial estructurado bajo la convención Conventional 
Commits (chore:, feat(db):, feat(api):, feat(ui):, docs:) con mensajes 
descriptivos en español. 
    • Higiene del Repositorio: Archivo .gitignore configurado desde el inicio para 
excluir archivos .env, entornos virtuales (.venv/), compilados (__pycache__/, 
dist/), bases locales (*.db) y dependencias (node_modules/).

7. Uso de Inteligencia Artificial 
    • Herramienta utilizada: Gemini. 
    • Para qué se utilizó: Estructuración modular de las especificaciones técnicas 
(Specs 0 a 3), generación del esqueleto de capas en FastAPI, modelos 
declarativos de SQLAlchemy/Alembic, componentes React con Tailwind CSS y 
automatización de scripts de inicialización. 
    • Validación y correcciones aplicadas con criterio técnico: 

1. Ajuste de restricción de stock (>= 0 vs. > 0): Se corrigió la condición 
límite para permitir que un producto alcance 0 unidades al venderse la 
última existencia, bloqueando únicamente valores negativos (< 0). 

2. Concurrencia en salidas: Se exigió explícitamente la incorporación de 
bloqueo pesimista a nivel de fila (SELECT ... FOR UPDATE) además del 
CHECK en base de datos, evitando condiciones de carrera ante peticiones 
simultáneas. 

3. Separación de logs y auditoría: Se delimitó la salida stdout en JSON 
exclusivamente para métricas técnicas de infraestructura, manteniendo la 
auditoría funcional en la tabla relacional productos_historial para 
garantizar atomicidad ACID. 

4. Compatibilidad de dependencias: Se ajustaron las restricciones de 
versión de psycopg[binary] en requirements.txt para asegurar 
compatibilidad con entornos recientes de Python 3.13+. EOF  



Instructivo de Instalación y Ejecución del Sistema 
El proyecto se encuentra alojado y versionado en el siguiente repositorio público de 
GitHub: 
• Repositorio: [https://github.com/xuangalanti/sistema-gestion
inventario](https://github.com/xuangalanti/sistema-gestion
inventario) 
    1. Descarga del Proyecto (Clonación) 
Abrir una terminal (Git Bash, PowerShell o Terminal de Linux/macOS) y ejecutar los 
siguientes comandos para descargar el código fuente y posicionarse en la carpeta raíz: 
Bash 

git clone https://github.com/xuangalanti/sistema-gestion
inventario.git 
cd sistema-gestion-inventario 

2. Ejecución del Sistema 
El proyecto cuenta con dos modalidades de ejecución según las herramientas instaladas 
en el entorno del evaluador: 

Opción A: Ejecución con Docker (Backend + Base de Datos PostgreSQL 16) 
Requisito previo: Tener Docker Desktop instalado y en ejecución. 
Desde la carpeta raíz del proyecto (sistema-gestion-inventario), ejecutar: 
Bash 

docker compose up --build 

• Acceso a la API y documentación interactiva (Swagger): 

http://localhost:8000/docs 

• Para detener los servicios, presionar Ctrl + C en la terminal o ejecutar docker 
compose down. 

Opción B: Ejecución Local Manual (Sin Docker) 
Requisitos previos: Python 3.12+ y Node.js 18+ (LTS). 
Para ejecutar el sistema completo de forma local se deben abrir dos terminales en 
simultáneo: 

Terminal 1 — Levantar el Backend (FastAPI): 
Bash 

cd backend 
python -m venv .venv 
# Activar el entorno virtual según el sistema operativo: 
# - Windows (Git Bash): source .venv/Scripts/activate 
# - Windows (PowerShell): .venv\Scripts\Activate.ps1 
# - Linux / macOS: source .venv/bin/activate 
pip install -r requirements.txt 
uvicorn app.main:app --reload 

• El servidor quedará activo en 
[http://127.0.0.1:8000](http://127.0.0.1:8000). 

• Acceso a la documentación interactiva de la API: 

http://localhost:8000/docs (inicia en modo autónomo con datos de prueba 
precargados para facilitar la validación inmediata de endpoints sin requerir 
configuración previa de base de datos). 

Terminal 2 — Levantar el Frontend (React + TypeScript): 
Bash 

cd frontend 
npm install 
npm run dev 

• Acceso a la interfaz web del sistema: http://localhost:5173 
3. Credenciales de Prueba (Control de Acceso por Roles - RBAC) 
Para probar los endpoints protegidos desde Swagger (/docs) mediante el endpoint POST 
/auth/login, se disponen los siguientes usuarios precargados: 
