# Kubernetes in action - Diving into the core concepts

Vamos a ver como comenzar a trabajar con ```Kubernetes```.

1. Kubernetes y configuración de ambiente de pruebas (minikube).
2. Trabajar con objetos de Kubernetes.
3. Aplicaciones de ejemplo con Kubernetes.

## URL's de apoyo

| Descripción | URL |
| ------------- | ------------- |
| Minikube | https://minikube.sigs.k8s.io/docs/start/ |
| Kubectl Install | https://kubernetes.io/docs/tasks/tools/ |
| Kubectl Install Windows | https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/ |
| Kubermatic | https://www.kubermatic.com/ |
| Conectar Kubectl a un Cluster de Kubernetes | https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/ |

## TIL

Recordemos lo que ```Kubernetes``` hace y que no (también explicado en la sección pasada). ```Kubernetes``` no administra una infraestructura de IT (no crea máquinas ni servicios de nube) sino que usa la infraestructura que nosotros le demos. ```Kubernetes``` solo administra que nuestra aplicación este siempre funcionando.

Una herramienta para definir nuestra infraestructura para una app sería usar ```Kubermatic```, una herramienta que nos ayuda a definir que tipo de infraestructura necesitamos según las especificaciones de nuestra app.

```Minikube```: Una instancia de ```Kubernetes``` que podemos instalar localmente en nuestra computadora. Si aprendemos a trabajar ```Minikube```, aprendimos a trabajar con ```Kubernetes```.

```Kubectl``` (Kubecontrol): Es un cliente que nos permite conectarnos a un ```Cluster de Kubernetes``` (instancia de ```Kubernetes```), ya sea en la nube o localmente, y ejecutar comandos para creación de cualquier recurso que tenga ```Kubernetes```.

## Resume

No importa donde usemos ```Kubernetes```, si localmente o en la nube, pero siempre tendremos una máquina con un Cluster, un Master Node y uno o más Workers Node. Pero para conectarnos a una instancia de ```Kubernetes``` usamos ```Kubectl```.

### Instalación de Minikube & Kubectl - Windows

Ejecute los siguientes comandos como usuario ```administrador```.

```
# Instalar chocolate
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

choco -v

# Instalar minikube
choco install minikube

minikube version

minikube status

# Iniciar minikube usando docker como driver
minikube start --driver=docker

minikube status

minikube dashboard

minikube stop

minikube delete --all
```

Una vez instalado ```Minikube``` puede instalar ```Kubectl``` con en enlace superior instalando un archivo ```.exe``` o por medio de comandos en la terminal.

```
# Instalar kubectl
choco install kubernetes-cli
```

```Kubectl``` se conectará de forma automatica a nuestro ```Minikube```, pero si queremos conectarlo a otro ```Cluster``` podemos modificar el archivo ```C:\Users\${usuario}\.kube\config``` o seguir los pasos de la documentación oficial que esta en la tabla inicial de este archivo.

### Entender recursos de Kubernetes

```Kubernetes``` trabaja con algo llamado ```Objects```, que no es otra cosa más que
1. Pods
2. Deployments
3. Services
4. Volume
5. ...

Pueden crearse de dos maneras, de forma ```Imperative``` o ```Declarative```.

La forma ```Imperative``` requiere que nosotros ejecutemos comandos para crear cada ```Object```.
La forma ```Declarative``` permite que por medio de archivos ```yaml``` configuremos que queremos, y con un solo comando hacer que ```Kubernetes``` cree lo que necesitamos (no infraestructura solo app).

#### Pod

1. Objeto más pequeño de ```Kubernetes```
2. Almacena uno o más ```Contenedores```, pero tipicamente solo un ```Contenedor``` por ```Pod```
3. Puede almacenar recursos compartidos (```volumes```) que usa nuestro ```Pod```
4. Tiene una dirección IP predefinida dada por el ```Cluster```
5. Se pueden comunicar internamente entre ```Pods```

Los ```Pods``` no viven siempre, si se detiene un ```Cluster``` se pierde un ```Pod```, pero se vuelve a crear cuando se levanta nuevamente el ```Cluster``` (minikube start/stop).

Para preservar la información de un ```Pod``` usamos los ```Volume``` que veremos más adelante.

Normalmente no creamos ```Pods``` directamente, sino que creamos el objeto ```Deployment``` y este crea el o los ```Pods``` que queremos, pero este objeto lo veremos más adelante.

Crear directamente solo los ```Pods``` es como usar ```Docker``` localmente.

#### Deployment

Es uno de los aspectos más importantes cuando trabajamos con ```Kubernetes```.

1. Controla uno o multiples ```Pods``` (podemos verlo como un ```Controller```)
2. Establecemos los estados deseados, por ejemplo definir el número de ```Pods```, que ```imagen de docker``` debe de ejecutar y recursos de CPU necesita para trabajar (opcional)
3. Puede pausar, eliminar y hacer un rollback a un ```Deployment``` anterior
4. Podemos definir el número de ```Pods``` que queremos así como también definir una métrica que defina cuando ```Kubernetes``` debe de crear o eliminar instancias de ```Pods```

```Deployment``` administra los ```Pods```, a su vez podemos tener multiples ```Deployments```.

Normalmente no creamos ```Pods``` directamente, sino que creamos el objeto ```Deployment``` y este se encarga del resto.

#### Service

El objeto ```Service``` nos permite exponer un ```Pod``` a otros ```Pods``` internamente en nuestro ```Cluster``` o también para exponer un ```Pod``` fuera del ```Cluster```.

1. Los ```Pods``` tienen una dirección IP interna predefinida y esta cambia conforme el ```Pod``` se remplace.
2. Los ```Service``` agrupan los ```Pods``` y establece una IP compartida que no cambia.
3. Los ```Services``` permiten el acceso a los ```Pods``` desde fuera del ```Cluster```

Sin los ```Services``` es dificil comunicar un ```Pod``` con otro de forma interna en el ```Cluster```, además no es posible acceder a él desde fuera del ```Cluster```.

### Ejemplo #1 - Imperative

Ver folder ```app/02-core-concepts/kub-action-01-starting-setup``` donde hay una app básica de ```Node JS```.

```Kubernetes``` aún hace uso de ```Docker``` para trabajar con las imagenes de nuestras apps.

```
# Construir imagen
docker build -t kub-action-01-starting-setup .

# Iniciar minikube
minikube start --driver=docker

# Crear deployment (first-app = nombre único de deployment)
kubectl create deployment first-app --image=kub-action-01-starting-setup

kubectl get deployments
kubectl get pods

# No funciono porque no encontró la imagen en DockerHub u otro registry
kubectl delete first-app

# Cargamos imagen a registry DockerHub
docker tag kub-action-01-starting-setup toledo1082/kub-action-01-starting-setup
docker push toledo1082/kub-action-01-starting-setup

# Se conecto al Master Node y creó un Worker Node para el Pod con la imagen definida
kubectl create deployment first-app --image=toledo1082/kub-action-01-starting-setup
kubectl get deployments
kubectl get pods

# Podemos ver el dashboard de minikube para ver lo que tenemos en nuestro cluster
minikube dashboard
```

El valor ```READY``` debe de dar una unidad para saber que todo se creó todo correctamente. Suele tardar un poco en ocasiones verse success.
- 1/1 = Success
- 0/1 = Failed

Para este momento esta ejecutandose el ```Pod``` y el ```Deployment```, pero no podemos acceder a él hasta configurar un ```Service```.

### Ejemplo #2 - Imperative

Ver folder ```app/02-core-concepts/kub-action-01-starting-setup``` donde hay una app básica de ```Node JS```.

Vamos a exponer con un ```Service``` el ejemplo anterior.

```

```