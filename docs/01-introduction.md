# Getting started with kubernetes

Esta sección esta enfocada en trabajar con ```Docker``` y entrar en materia con ```Kubernetes```, el cual es un Orquestador independiente de contenedores.

1. Entender el reto al momento de desplegar contenedores
2. ¿Qué es Kubernetes? ¿Por qué Kubernetes?
3. Conceptos y componentes de Kubernetes  

## URL's de apoyo

| Descripción | URL |
| ------------- | ------------- |
| Documentación oficial de Kubernetes | https://kubernetes.io/ |

## TIL

```Kubernetes```: Sistema open-source encargado de orquestar y administrar aplicaciones con contenedores. Su sintaxis manual es por medio de ```comandos de consola``` o automaticamente por medio de archivos ```yaml```.

```Kubernetes``` nos ayuda principalmente en:
1. Deployment automatico.
2. Escalabilidad y load balancing.
3. Administración de contenedores según su estado.
4. Disponibilad de usar en cualquier proveedor de nube.

```Kubernetes``` no es:
1. No es un proveedor de nube.
2. No es un servicio de ningún proveedor de nube.
3. No esta restringido a un solo proveedor de nube.
4. No es un software (app) que ejecutar en una maquina.
5. No es una alternativa a ```Docker```.
6. No es un servicio de paga.

```Kubernetes``` es:
1. Sistema open-source gratuito.
2. Puede usarse en diferentes proveedores nubes.
3. Es una colección de conceptos y herramientas.
4. Trabaja con contenedores de ```Docker```

Podemos decir que ```Kubernetes``` es algo similar (no lo mismo) a trabajar con ```Docker Compose```, una gran aplicación ejecutada con un solo comando.

Petición de creación de app -> ```Cluster``` -> ```Master Node``` -> ```Worker Node``` -> ```Pods (volumes & container)```.

## Resume

Pensemos en ```Kubernetes``` cuando queremos realizar despliegues de nuestras aplicaciones, si bien podemos trabajar en desarrollo con el, se suele usar solo para publicar aplicaciones.

```Kubectl``` nos ayuda a conectarnos a un ```Cluster``` de ```Kubernetes```.

Sin ```Kubernetes``` al publicar en la nube:
1. Tenemos que publicar manualmente el contenedor.
2. Configurar nosotros mismos en traficos de entrada y salida que el mismo tendrá. 
3. Si un contenedor en la nube falla, nosotros debemos de remplazarlo por uno nuevo manualmente.
4. Si tenemos más de un contenedor debemos de hacer lo mismo para cada uno.
5. Depede la demanda, debemos de levantar más instancias de nuestros contenedores.
6. Si la demanda baja, debemos de quitar las instancias que consuman recursos ($).
7. Configurar que el tráfico de llegada se distribuya equitativamente en los contenedores.
8. Si bien al momento del desarrollo solo levantamos un contenedor, en un ambiente productivo necesitamos multiples instancias para sustentar la demanda.

Con ```Kubernetes``` al publicar en la nube: 
1. Verifica automaticamente el estado de los contenedores, si uno falla, leventará una copia automaticamente. Si falla por una conexión a BD, este lo reiniciará hasta que este completamente listo.
2. Aumenta o disminuye la cantidad de instancias de contenedores conforme la demanda lo necesite.
3. Permite usar el concept ```Load Balancer``` que básicamente divide equitativamente el trafico de datos de acuerdo al numero de instancias que tenemos de nuestros contenedores.
4. Podemos usar archivos ```yaml``` con los que configuramos los servicios que necesitamos que ```Kubernetes``` administre.
    - Los servicios de nube tienen sus propias maneras de configurar un ```Cluster``` de ```Kubernetes```, pero esto esta encerrado a la misma forma de hacerlo según el proveedor de la nube, por eso se recomienda usar archivos ```yaml``` de configuración.
5. Solo necesitas entender como se configura ```Kubernetes``` y puedes usarlo en diferentes proveedores de nube y ```Pipes``` de despliegue.

### Kubernetes Core-Concepts

| Concepto | Descripción |
| ------------- | ------------- |
| Pod | Quien administra a uno o más contenedores, usualmente se dice Pod = Contenedor (1 a 1 usualmente) |
| Proxy | Configuración que nos permite configurar el trafico de entrada y salida al contenedor |
| Worker Node | Casa en donde viven más de un pod (es una máquina en algún lugar del mundo que pueda ejecutar un pod), podemos tener más de uno y esto ayuda a la escalabilidad de nuestra aplicación (aumentar o disminuir la demanda de llamadas) |
| Master Node | Centro de control de todos los Worker Node, directamente no interactuamos con Pods o Nodes, pero si indicamos que queremos que estos hagan (otra máquina al final del día). Una misma máquina puede contener tanto un Worker como un Master Node a la vez |
| Services | Establece una dirección IP para exponer el acceso a uno o más Pods al mundo exterior (BD, app, etc) | 
| Cluster | Todo lo anterior esta siendo administrado por un Cluster, al cual nos conectamos para indicar qué, de cada cosa crear o destruir |

```Worker Node``` administra los ```Pods``` dentro de él (uno o más), un ```Pod``` almacena tanto un contenedor como otras configuraciones como Volumenes de datos que deben de persistir.

```Master Node``` se encarga de administrar los ```Worker Node``` dentro de él, controla y monitorea todos los elementos dentro de el y de los ```Worker Node```. Nosotros no creamos ni un ```Master o Worker Node```, se crean de forma automatica.

Enviamos una solicitud al ```Cluster```, y el ```Master Node``` se encarga de crear o destruir los recursos que necesitemos, sea un nuevo ```Worker Node```, ```Pod``` o ```Contenedores```.

### Qué hace y que no

| Kubernetes hace | Desarrollador hace |
| ------------- | ------------- |
| Administra los Pods (crear o destruir) | Crear cluster e instancias worker y master nodes |
| Monitorea el estado de los pods | Configurar el servidor y cliente para conectar a Kubernetes |
| Hace uso de los servicios de nube para la configuración establecida | Crear otros recursos según lo requiera el proovedor de la nube |

