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
| References Kubernetes | https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/ |

## TIL

Recordemos lo que ```Kubernetes``` hace y que no (también explicado en la sección pasada). ```Kubernetes``` no administra una infraestructura de IT (no crea máquinas ni servicios de nube) sino que usa la infraestructura que nosotros le demos. ```Kubernetes``` solo administra que nuestra aplicación este siempre funcionando.

Una herramienta para definir nuestra infraestructura para una app sería usar ```Kubermatic```, una herramienta que nos ayuda a definir que tipo de infraestructura necesitamos según las especificaciones de nuestra app.

```Minikube```: Una instancia de ```Kubernetes``` que podemos instalar localmente en nuestra computadora. Si aprendemos a trabajar ```Minikube```, aprendimos a trabajar con ```Kubernetes```.

```Kubectl``` (Kubecontrol): Es un cliente que nos permite conectarnos a un ```Cluster de Kubernetes``` (instancia de ```Kubernetes```), ya sea en la nube o localmente, y ejecutar comandos para creación de cualquier recurso que tenga ```Kubernetes```.

Solo usamos el comando ```minikube service <nombre>``` para exponer a nuestra máquina un ```Pod```, pero en un ambiente real ya no es necesario ya que se configuran las ```IP``` que estos usarán.

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

### Imperative vs Declarative

La forma ```Imperative``` requiere que nosotros ejecutemos comandos para crear cada ```Object```. Puede ser dificil de recordar. Todos los comandos son individuales según lo que queremos crear, un ```deployment```, ```service```, etc.

La forma ```Declarative``` permite que por medio de archivos ```yaml``` configuremos que queremos, y con un solo comando hacer que ```Kubernetes``` cree lo que necesitamos (no infraestructura solo lo que requiere la app [deployments, pods, services, etc]). Es muy similar a trabajar con ```Docker Compose```. Estos archivos ```yaml``` se les conoce como ```Resources Files```. Solo usaremos el comando ```kubectl apply -f config.yaml``` para implementar los ```Objects```.

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

Existen diferentes tipos de ```Services```.
1. ```ClusterIP```: Solo accesible dentro del ```Cluster```.
2. ```NodePort```: Debe de exponer dentro del ```WorkerNode```.
3. ```LoadBalancer```: Genera una dirección para el servicio y distribuye el trafico entrante equitativamente a los ```pods``` de un ```Service```.

### Ejemplo #1 - First deployment - Imperative

Temas: Deployment, Pod, Service, Restarting, Replicas.

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

Para este momento esta ejecutandose el ```Pod``` y el ```Deployment```, pero no podemos acceder a él hasta configurar un ```Service```. Vamos a exponer con un ```Service``` el ejemplo anterior.

```
minikube start --driver=docker

# Crear service (first-app = deployment, puerto que el contenedor expone)
kubectl expose deployment first-app --type=LoadBalancer --port=8080
kubectl get services

# Para minikube EXTERNAL-IP siempre estará <pending> (esto no pasa en la nube), por eso es necesario hacer lo siguiente
# Exponemos el deployment first-app para accder desde nuestra máquina
minikube service first-app

# Acceda a la url que nos da minikube
```

Veamos como poder reiniciar un ```contenedor``` cuando este fallé. Accedamos a la ruta ```/error```.

Veremos como ```Kubernetes``` reinicia los ```Pods``` automaticamente.

```
kubectl get pods
```

También podemos aumentar las instancias de nuestros ```Pods``` según el trafico que los mismos tengan.

```
# Creamos 3 replicas para los pods del deployment first-app
kubectl scale deployment/first-app --replicas=3

# Veremos las tres replicas en ejecución
kubectl get pods
```

Ahora, sin importar si un ```Pod``` falla, podemos volver acceder a nuestra app desde el navegador debido a que los otros esta en funcionamiento.

Si hacemos cambios en nuestr aplicación es necesario volver a hacer todo el proceso anterior para ver los cambios en ```Kubernetes```.

```
docker build -t toledo1082/kub-action-01-starting-setup:2 .
docker push toledo1082/kub-action-01-starting-setup:2

# Cambiamos la imagen de nuestro deployment para los pods
# Aunque sea la misma, debemos especificarla para que descargue la más reciente pero siempre cambiando el tag
kubectl set image deployment/first-app kub-action-01-starting-setup=toledo1082/kub-action-01-starting-setup:2

# Vemos el estatus del cambio
kubectl rollout status deployment/first-app
```

Imaginemos que tenemos un error al cambiar la imagen de un ```Deployment```.

```
# No existe el tag
kubectl set image deployment/first-app kub-action-01-starting-setup=toledo1082/kub-action-01-starting-setup:3

# Vemos una tarea pendiente en el estatus del cambio pero nunca se hará porque no existe
kubectl rollout status deployment/first-app

# Revertimos el cambio anterior
kubectl rollout undo deployment/first-app

# Ver el historial de cambios del tercer cambio (el primero es la creación)
kubectl rollout history deployment/first-app --revision=3

# Podemos hacer rollback a una revision especifica (versión inicial)
kubectl rollout undo deployment/first-app --to-revision=1
```

Ahora veamos este mismo ejemplo pero con un modo ```Declarative```.

```
# Eliminamos servicio y deployment
kubectl delete service first-app
kubectl delete deployment first-app

kubectl get pods
kubectl get deployments
```

### Ejemplo #2 - Declarative

Ver folder ```app/02-core-concepts/kub-action-02-declarative-approach-basics``` donde hay una app básica de ```Node JS```.

```
minikube start

# Eliminamos los deployments
kubectl get deployments
kubectl deplete deployment ...
```

Debemos de crear un archivo ```yaml``` llamado ```deployment.yaml```.

```
# 1.1. Versión de este recurso que creamos
apiVersion: apps/v1
# 1.2. Indicamos que objeto queremos crar
kind: Deployment # Service, Job, etc.
# 1.3. Configuración de metadata del deployment (nombre, etc)
metadata:
  name: second-app-deployment
# 1.4. Especificación de información del Deployment (del object)
spec:
  # 1.5. Número de replicas de Pods en el Deployment
  replicas: 2
  # 1.13. Indicamos los selectores de Pods que controlará este Deployment
  selector:
    # 1.14. Indicamos que este deployment controlará todos los Pods que tengan los mismos labels que el Deployment (1.8)
    matchLabels:
      app: second-app
      tier: backend
  # 1.6. Indicamos el template que usarán los Pods (cambiamos a modificar objeto Pod), se crearn conforme se crea el Deployment
  template: 
    # kind: Pod # 1.6.1. Valor predefinido dentro de un kind:Deployment, no se necesita poner
    # 1.7. Configuración de metadata del Pod (nombre, etc)
    metadata:
      # 1.8. Podemos colocar los label que queramos a los Pods.
      labels: 
        app: second-app
        tier: backend
    # 1.9. Especificación de información del Pod (del object)
    spec:
      # 1.10. Definimos la lista de contenedores dentro del Pod (puede ser más de uno pero normalmente 1 Pod por 1 contenedor)
      containers: 
        # 1.11. Nombre del contenedor
        - name: second-node
          # 1.12. Imagen que usa el contenedor second-node
          image: toledo1082/kub-action-01-starting-setup:2
        # Puede agregar más contenedores
        # - name: ...
        # - name: ...
```

Una vez listo debemos de ejecutar este archivo con el comando siguiente.

```
# Se pueden agregar muchos -f si se requiere
kubectl apply -f deployment.yaml
```

Para conectarnos a nuestro ```Pod``` requerimos de un ```Service```, también puede colocarse en un ```yaml``` llamado ```service.yaml```.

```
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  # Indicamos que otros recursos deben de ser controlados por este Service
  selector:
    # No se neceita colocar un matchLabels, etc. Controlará todos los Pods con el label app: second-app
    app: second-app
  # Lista de puertos que expondremos
  ports:
    - protocol: 'TCP' # Protocolo de conexión
      port: 80 # Puerto que exponemos
      targetPort: 8080 # Puerto del contenedor
    # Podemos agregar tantos como necesitemos
    # - protocol: 'TCP'
    #   port: 443
    #   targetPort: 443
  # ClusterIP = default
  # NodePort = API y Port en el Cluster
  # LoadBalancer = Exponerlo al mundo externo
  type: LoadBalancer
```

Posterior ejecutamos los comandos siguientes.

```
# Implementamos el archivo
kubectl apply -f .\service.yaml

# Consultamos el servicio
kubectl get services

# Exponemos el servicio en Minikube (backend = metadata:name) de service.yaml
minikube service backend
```

Cualquier cambio que hagamos, por ejemplo el número de ```replicas``` o la ```image``` del ```Pod```, requerirá ejecutar el comando ```apply```.

```
kubectl apply -f deployment.yaml
kubectl get pods
```

Para la eliminación podemos hacer lo siguiente.

```
kubectl delete -f deployment.yaml, service.yaml
```

No especificamos el tipo de recurso a eliminar como en el modo ```Imperative```.

Podemos agrupar todos los archivos ```yaml``` dentro de uno simplemente dividiendo los ```Objects``` con los caracteres ```---```. Es buena práctica colocar primero los ```services```.

```
---
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: second-app
  ports:
    - protocol: 'TCP'
      port: 80
      targetPort: 8080
  type: LoadBalancer
---  
apiVersion: apps/v1
kind: Deployment
metadata:
  name: second-app-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: second-app
      tier: backend
  template: 
    metadata:
      labels: 
        app: second-app
        tier: backend
    spec:
      containers: 
        - name: second-node
          image: toledo1082/kub-action-01-starting-setup:3
```

Bastará con hacer lo siguiente.

```
kubectl delete -f .\deployment.yaml
kubectl delete -f .\service.yaml
kubectl apply -f .\master-deployment.yaml
kubectl get pods
minikube service backend
```