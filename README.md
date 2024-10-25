# Proyecto OdiparPackGLS - Simulación de Vehículos

Este proyecto simula vehículos y almacenes/oficinas utilizando Spark y Maven en un entorno Java. Aquí encontrarás los pasos que se siguieron para configurar el entorno de desarrollo en Visual Studio Code (VSC), cómo ejecutar el proyecto, y los comandos necesarios para su correcta ejecución.

# Requisitos previos

### Instalación de JDK y Maven

**Instalar Java JDK 20:**

- Descarga e instala JDK 20.
- Asegúrate de configurar la variable de entorno `JAVA_HOME` apuntando a la instalación de JDK 20:

  ```bash
  JAVA_HOME=C:\Program Files\Java\jdk-20
  ```

**Instalar Apache Maven:**

- Descarga e instala Apache Maven.
- Configura la variable de entorno `MAVEN_HOME` y añade Maven al `PATH`.
- Verifica las instalaciones ejecutando en la terminal:

  ```bash
  java -version
  mvn -version
  ```

### Instalación de Apache Spark

**Descargar e instalar Apache Spark:**

- Descarga Apache Spark, versión 3.5.3 compatible con Hadoop 3.3.
- Extrae los archivos y configura la variable de entorno `SPARK_HOME` apuntando a la carpeta de Spark (sin incluir `bin`):

  ```bash
  SPARK_HOME=C:\Program Files\spark-3.5.3-bin-hadoop3
  ```

- Agrega `C:\Program Files\spark-3.5.3-bin-hadoop3\bin` al `PATH` en las variables de entorno para poder ejecutar Spark desde cualquier ubicación.
- Verifica la instalación de Spark ejecutando:

  ```bash
  spark-submit --version
  ```

# Preparación del entorno en Visual Studio Code

### Instala la extensión de Java para VSC

- Ve a la sección de extensiones de VSC e instala la extensión de Java proporcionada por Microsoft, que te permite compilar y ejecutar proyectos Java dentro de VSC.

### Configura Maven en VSC

- Abre el proyecto en VSC y asegúrate de que el archivo `pom.xml` esté correctamente configurado.
- Si aún no lo has hecho, sincroniza las dependencias de Maven ejecutando:

  ```bash
  mvn clean install
  ```

# Estructura del Proyecto

```scss
backend/
│
├── src/
│   └── main/
│       ├── java/com/odiparpack/  (código fuente)
│       └── resources/  (archivos de configuración)
│
├── target/  (archivos generados por Maven)
│
├── pom.xml  (archivo de configuración de Maven)
└── README.md  (este archivo)
```

# Compilación del proyecto con Maven

Compila el proyecto ejecutando el siguiente comando:

```bash
mvn clean package
```

Esto generará el JAR en la carpeta `target/`.

### Incluir dependencias en el JAR

Para incluir todas las dependencias en un solo JAR ejecutable, ejecuta:

```bash
mvn clean package assembly:single
```

El JAR resultante estará ubicado en la carpeta `target/` y tendrá el nombre `OdiparPackGLS-1.0-SNAPSHOT-jar-with-dependencies.jar`.

# Ejecución del Proyecto con Apache Spark

### Ejecutar el proyecto usando Spark

Para ejecutar el proyecto con `spark-submit`, usa el siguiente comando:

```bash
spark-submit --class com.odiparpack.Main --master local[4] target/OdiparPackGLS-1.0-SNAPSHOT-jar-with-dependencies.jar
```

- `--class com.odiparpack.Main`: Especifica la clase principal que contiene el método `main`.
- `--master local[4]`: Ejecuta el trabajo de Spark en tu máquina local usando 4 núcleos.
- El JAR `target/OdiparPackGLS-1.0-SNAPSHOT-jar-with-dependencies.jar` contiene todas las dependencias necesarias.

# Errores Comunes y Soluciones

### `NoSuchMethodError` en Gson

- Asegúrate de que estás usando la versión correcta de Gson (2.10.1).
- Si ocurre un `NoSuchMethodError` al agregar un número a un `JsonArray`, asegúrate de usar `JsonPrimitive` como en el siguiente ejemplo:

  ```java
  JsonArray coordinates = new JsonArray();
  coordinates.add(new JsonPrimitive(loc.getLongitude()));
  coordinates.add(new JsonPrimitive(loc.getLatitude()));
  ```

### Conflictos de Dependencias

- Ejecuta `mvn dependency:tree` para verificar las versiones de las dependencias en tu proyecto.
- Si hay conflictos, añade exclusiones en el `pom.xml` para resolverlos.

### Limpieza del Caché de Maven

- Si persisten errores de compilación o ejecución, limpia el caché de Maven y recompila:

  ```bash
  mvn clean install
  ```

# Comandos Útiles

### Compilar el proyecto

```bash
mvn clean package
```

### Generar un JAR con dependencias

```bash
mvn clean package assembly:single
```

### Ejecutar el proyecto con Spark

```bash
spark-submit --class com.odiparpack.Main --master local[4] target/OdiparPackGLS-1.0-SNAPSHOT-jar-with-dependencies.jar
```

# Conclusión

Este proyecto está diseñado para simular el comportamiento de vehículos y oficinas/almacenes usando Apache Spark y Maven en un entorno de desarrollo en Visual Studio Code. Sigue los pasos anteriores para configurar y ejecutar el proyecto sin problemas.

Si tienes alguna duda o necesitas asistencia, por favor, revisa los errores comunes y soluciones en este README, o consulta la documentación oficial de Maven y Spark.