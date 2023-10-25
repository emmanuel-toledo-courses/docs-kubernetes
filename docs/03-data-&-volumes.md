# Managing data & volumes with kubernetes

La idea de ```Kubernetes``` es poder publicar nuestra aplicación en diferentes ```Clusters```.
Uno de los aspectos principales es:
1. Kubernetes: Storage & Data
2. Storing Data

En esta sección vamos a ver conceptos vistos antes con ```Docker``` pero ahora enfocados a ```Kubernetes```.
1. Volumes (Regular Volumes)
2. Persistent Volumes & Persistent Volume Claims
3. Environment Variables

## URL's de apoyo

| Descripción | URL |
| ------------- | ------------- |
| K8s Volumes | https://kubernetes.io/docs/concepts/storage/volumes/ |
| K8s Persistent Volumes | https://kubernetes.io/docs/concepts/storage/persistent-volumes/ |
| K8s Persistent Volume Mode: FileSystem & Block | https://www.computerweekly.com/feature/Storage-pros-and-cons-Block-vs-file-vs-object-storage |

## TIL

En ```Kubernetes``` los ```Volumes``` nos ayudan a persistir la información de nuestras aplicaciones. Tienen dos diferentes "tipos":
1. ```Normal/Regular Volumes```, oficialmente solo ```Volumes```
  - Estan atados al ```Pod lifecycle```, si se elimina el ```Pod```, se elimina el ```Volume```
  - Se define y se crea junto con el ```Pod``` (por ejemplo en el archivo ```deployment.yaml```)
  - Es muy repetitivo para todos los ```Pods``` y dificil de administrar en un nivel global
2. ```Persistent Volumes```
  - No estan atados al ```Pod lifecycle```, es un ```Object``` único en el Cluster
  - Se pueden crear clientes para conectarse al ```Volume``` usando ```Persistent Volume Claim```
  - Pueden ser definidos una sola vez y usado multiples veces

Al final del día, ambos tipos nos ayudan a persistir la información pero dependiendo del proyecto con el que se trabaje, deberá de escoger que opción utilizar.

## Resumen

Estaremos viendo la forma de usar ```Volumes``` y ```Variables``` dentro de un Cluster de ```Kubernetes```.

Los ```Volumes``` los podremos implementar dentro de nuestros archivos ```Deployment```, pero estos se mantienen vivos solo si el ```Pod``` o el ```Worker Node``` aún existen, dependiendo el tipo de ```Volume```.

Los ```PersistentVolume``` son un tipo de ```Volume``` que vive como un ```Object``` independiente dentro del Cluster, para conectarnos debemos de crear un ```PersistentVolumeClaim``` y este asociarlo a uno o más ```Pods```.

Los ```ConfigMap``` nos ayudan a administrar variables de entorno que tenemos en nuestras aplicaciones dentro de un Cluster, además es posible usar dichas variables dentro de nuestras aplicaciones ya que esto también lo soporta ```Kubernetes``` al igual que cuando trabajamos con ```Docker```.

### Aplicación en Docker

En esta sección trabajaremos con una aplicación de ```Node JS```, la cual es una API que tiene dos endpoints, uno para consultar mensajes y otro para registrar. Básicamente se almacena un texto en un archivo dentro del folder ```story```.

Podemos probarlo localmente con ```Docker Compose``` en donde guardamos en un ```volume``` llamado ```stories``` el folder ```story```.

```
docker compose up -d --build 
```

Ahora podemos probar los servicios siguientes.
- GET: localhost/story
- POST: localhost/story
    body: { "text": "My text!!!!" }

Ahora veamos como pasarlo a un ```Kubernetes``` haciendo uso de ```Services``` y ```Volumes```.

### Aplicación en Kubernetes

#### Introducción

En ```Kubernetes``` se le conoce como ```State``` a los datos creados y usados por nuestra aplicación que no deben de perderse. Existen diferentes tipos.
1. User-generated data, user ccounts, ...
    - Se almacena en una BD o algún archivo.
2. Intermediate results derived by the app
    - Se almacena temporalmente ya sea en memoria, BD o archivos.

Los ```Volumes``` se encargan de hacer que estos datos (```state```) persistan incluso si se reinician los contenedores, se detienen o eliminan para crear uno nuevo.

Sabemos como trabaja ```Volumes``` con ```Docker```, aunque el enfoque sería el mismo, debemos de considerar que no interactuaremos más directamente con ```Docker```, más bien debemos indicar a ```Kubernetes``` que cree los ```Volumes``` que ocupamos y que él se encargue de configurarlos en nuestros ```Contenedores``` de ```Docker```.

```Kubernetes``` soporta diferentes tipos de ```Volumes``` o ```Drivers```.
1. ```Local Volumes``` dentro de ```Worker Nodes```.
2. ```Cloud Provider``` (almacenamiento externo) del ```Volumes```.

El tiempo de vida de un ```Volume``` depende del tiempo de vida del ```Pod```.
1. Los ```Volumes``` sobreviven a un reinicio del contenedor.
2. Los ```Volumes``` se remueven cuando un ```Pod``` es destruido.

| Kubernetes Volumes | Docker Volumes |
| ------------- | ------------- |
| Soporta diferentes drivers y tipos | No usa Drivers, un solo tipo de almacenamiento |
| No necesariamente son persistentes, sobrevive al reinicio del contenedor, no al de un Pod | Sobreviven a menos que se eliminen manualmente |
| Volumes sobrevive al reinicio y eliminación del contenedor | Volumes sobrevive al reinicio y eliminación del contenedor |

#### Resolviendo el problema

Vamos a colocar en ```Kubernetes``` nuestra aplicación validando que todo esta limpio ```kubectl get deployments``` y creando el archivo ```deployment.yml``` y ```service.yaml```. Puede verlos en la carpeta ```kub-data-01-starting-setup```. Ejecutamos los siguientes comandos.

```
docker build -t toledo1082/kub-action-02-volume-setup .
docker push toledo1082/kub-action-02-volume-setup

minikube start --driver=docker
kubectl apply -f service.yaml -f deployment.yaml
kubectl get deployments
kubectl get services
kubectl get pods
minikube service story-service

|-----------|---------------|-------------|---------------------------|
| NAMESPACE |     NAME      | TARGET PORT |            URL            |
|-----------|---------------|-------------|---------------------------|
| default   | story-service |          80 | http://192.168.67.2:30613 |
|-----------|---------------|-------------|---------------------------|
🏃  Starting tunnel for service story-service.
|-----------|---------------|-------------|------------------------|
| NAMESPACE |     NAME      | TARGET PORT |          URL           |
|-----------|---------------|-------------|------------------------|
| default   | story-service |             | http://127.0.0.1:62250 |
|-----------|---------------|-------------|------------------------|
```

Puede probar los servicios con la url ```http://127.0.0.1:62250```.
- GET: http://127.0.0.1:62250/story
- POST: http://127.0.0.1:62250/story

El problema actual es que no hemos almacenado nuestra información en un ```Volume```, si el ```Contenedor``` se reinicia, este perderá los datos.

Para solucionar esto vamos a ver 3 diferentes tipos de ```Volumes```.
1. emptyDir
2. csi
3. hostPath

#### emptyDir volume

El ```Volume emptyDir``` generá un directorio vacio dentro del Pod cuando se inicia, este se mantiene vivo conforme se quede vivo el Pod. Los contenedores usarán el directorio para sus volumes y lo podrán usar sin importar cuanto se reinicie el contenedor (si falla).

Los ```Volumes``` estan atados a un ```Pod``` especifico. Se agregó una ruta de error en la app y se actualizó el tag de la imagen.

```
docker build -t toledo1082/kub-action-02-volume-setup:1 .
docker push toledo1082/kub-action-02-volume-setup:1

kubectl apply -f deployment.yaml
```

Tendremos disponible la ruta ```/error```.
1. GET: http://127.0.0.1:62250/story
2. POST: http://127.0.0.1:62250/story
3. GET: http://127.0.0.1:62250/error
4. Veremos que perdimos los datos registrados en el POST

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: story-deployment
spec:
  selector:
    matchLabels:
      app: story
  replicas: 1
  template:
    metadata:
      labels:
        app: story
    spec:
      containers:
        - name: story
          image: toledo1082/kub-action-02-volume-setup:1
          imagePullPolicy: Always
          # 1.4. Conectamos el volume de Kubernetes con el de Docker
          volumeMounts:
            # 1.4.1 Definimos la ruta de nuestro volume según la app en docker (puede verlo en el docker compose)
            - mountPath: /app/story
              name: story-volume # 1.4.2 Establecemos un nombre
              # 1.4.3. Montamos el story-volume de Docker dentro del volume llamado story-volume en K8s
      # 1.1. Definimos los volumenes de este Pod que usarán los Contenedores dentro del Pod
      volumes:
        - name: story-volume # 1.2. Nombre del Volume
          # 1.3. Indicamos el tipo del Volume
          emptyDir: {}
```

Luego aplicamos los cambios.

```
kubectl apply -f deployment.yaml
```

Si tratamos de consultar el GET de stories tendremos un error, ya que el ```Volume``` que definimos fue un ```emptyDir``` (directorio vacio) y no existe el archivo story.txt. Por eso debemos primero hacer el POST y luego el GET.
1. POST story
2. GET story
3. GET error
4. GET story - La data persiste

#### hostPath volume

El ```Volume emptyDir``` tiene algo particular, es un ```Volume``` básico que si nosotros cambiamos el número de ```replicas``` a más de 1, y aplicamos los cambios (```kubectl apply -f deployment.yaml```), y falla un ```Pod```, cuando se redireccione al segundo, veremos que no tenemos los datos, esto se debe a que el ```Volume``` se guardo solo en uno de los ```Pods```, no en ambos, y cuando se redirecciona lo hace al ```Pod``` que no tiene el ```Volume```.

Para atacar este problema es cambiar el ```driver/type``` del ```Volume``` por ```hostPath```: Permite que establescamos un directorio en nuestro ```Host``` hacia los ```Pods``` que necesiten usar ese ```Volume``` según sus ```Contenedores```.

Si usamos multiples máquinas terminariamos en un escenario como el ```emptyDir```.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: story-deployment
spec:
  selector:
    matchLabels:
      app: story
  replicas: 2
  template:
    metadata:
      labels:
        app: story
    spec:
      containers:
        - name: story
          image: toledo1082/kub-action-02-volume-setup:1
          imagePullPolicy: Always
          # 1.4. Conectamos el volume de Kubernetes con el de Docker
          volumeMounts:
            # 1.4.1 Definimos la ruta de nuestro volume según la app en docker (puede verlo en el docker compose)
            - mountPath: /app/story
              name: story-volume # 1.4.2 Establecemos un nombre
              # 1.4.3. Montamos el story-volume de Docker dentro del volume llamado story-volume en K8s
      # 1.1. Definimos los volumenes de este Pod que usarán los Contenedores dentro del Pod
      volumes:
        - name: story-volume # 1.2. Nombre del Volume
          # 1.3. Indicamos el tipo del Volume
          hostPath:
            # 1.3.1. Path del Host machine (Worker Node) donde se almacenará la información (similar al bind mount de docker [Host <-> Contenedor]) 
            path: /data # 1.3.2. Se generá un folder llamado 'data' en el folder actual
            type: DirectoryOrCreate # 1.3.3. Debe de existir el directorio o crearlo automaticamente si no existe
```

Aplicamos los cambios.

```
kubectl apply -f deployment.yaml
```

Si intentamos replicar el escenario del error del ```Volume``` veremos que ahora es imposible replicarlo ya que el ```Volume``` vive en el ```Worker Node```.

#### CSI volume

```CSI``` = Container Storage Interface.

Este tipo de ```Volume``` nos da la posibilidad de integrar por medio de interfaces diferentes tipos de ```Volumes``` o servicios de nube, por ejemplo ```Amazon EFS```.

#### Persistent volumes

Hemos visto como funcionan los ```Volumes``` pasados y mencionado brevemente como funciona ```CSI```.

| Volumen | Vive en |
| ------------- | ------------- |
| emptyDir | Pod |
| hostPath | Worker Node |

Un Persist Volume (```PV```) vive independiente a un Pod o Worker Node.

En el Cluster se crea el objeto ```Persistent Volume``` y dentro de los Node cramos un ```PV claim``` que conecta los Pods a los PV de forma independiente.

```
# Definimos un Object de tipo PersistentVolume
apiVersion: v1
kind: PersistentVolume
metadata:
  name: host-pv
# Configuración del volume
spec:
  # Controlar cuanta capacidad podemos usar desde los diferentes Pods que se ejecutan en el Cluster
  capacity:
    # Agregamos una capacidad de 1GB.
    storage: 1Gi
  # Tenemos el FileSystem & Block
  volumeMode: Filesystem
  # Modos de acceso al Persistent Volume
  accessModes:
    - ReadWriteOnce # Este volume puede montarse como READ & WRITE por un solo Node
    # - ReadOnlyMany # Este volume puede montarse como READ por más de un Node (no ocupamos esto en un hostPath porque ocupamos escribir datos).
    # - ReadWriteMany # Este volume puede montarse como READ & WRITE por más de un Node (solo queremos un node con la app para modificar este volume).
  # Al igual que los volumes, a los PV especificamos el tipo
  hostPath:
    path: /app/story
    type: DirectoryOrCreate
```

Ya vimos la creación de un ```Persistent Volume```, que genera un Volume en el Cluster, pero para conectarnos necesitamos definir un ```Persistent Volume Claim```.

```
# Solo generamos un Claim para conectar a un PersistentVolume, pero es necesario establecer que el Pod se conecte a este Claim para que a su vez, se conecte al PersistentVolume
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: host-pvc
spec:
  # Nombre del persistent volume al que queremos conectar este Claim (ver archivo host-pv). 
  volumeName: host-pv
  # Al igual que en PersistentVolume definimos el tipo de acceso que este Claim tendrá, PV define los tipos de acceso que acepta, aquí es como se va a comportar
  accessModes:
    - ReadWriteOnce
  # Contraparte de propiedad Capacity de PersistentVolume
  resources:
    # Solicitamos una parte del almacenamiento definido en el Capacity del PersistentVolume
    requests:
      # Solicitamos 1GB, puede ser menos o más siempre y cuando no sea mayor el almacenamiento solicitado que el que se encuentra en Capacity del PersistentVolume
      storage: 1Gi
```

Ahora conectamos nuestro ```Pod``` al ```PVC```.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: story-deployment
spec:
  selector:
    matchLabels:
      app: story
  replicas: 2
  template:
    metadata:
      labels:
        app: story
    spec:
      containers:
        - name: story
          image: toledo1082/kub-action-02-volume-setup:1
          imagePullPolicy: Always
          # 1.4. Conectamos el volume de Kubernetes con el de Docker
          volumeMounts:
            # 1.4.1 Definimos la ruta de nuestro volume según la app en docker (puede verlo en el docker compose)
            - mountPath: /app/story
              name: story-volume # 1.4.2 Establecemos un nombre
              # 1.4.3. Montamos el story-volume de Docker dentro del volume llamado story-volume en K8s
      # 1.1. Definimos los volumenes de este Pod que usarán los Contenedores dentro del Pod
      volumes:
        - name: story-volume # 1.2. Nombre del Volume
          # 1.3. Indicamos que usaremos un PersistentVolume a partir de un PersistentVolumeClaim
          persistentVolumeClaim: 
            # Nombre que viene del archivo host-pvc.yaml
            claimName: host-pvc 
```

No modificamos nada al respecto del ```Volume Mounts``` porque realmente seguimos queriendo almacenar la misma información en el ```Volume```, lo único que cambio, fue la definición, en vez de ser directamente un ```Volume``` de tipo ```hostPath```, establecemos un ```PersistentVolume``` de tipo ```hostPath``` y nos conectamos a este por medio del ```PersistentVolumeClaim```.

Aplicando estos cambios, nuestros datos seguirán persistiendo dentro de nuestro ```Cluster```, pero ya no se eliminarán si nuestros ```Pods``` por alguna razón se eliminan, además de que podrán ser utilizados por más de un ```Pod``` y más de un ```Worker Node```.

Un concepto que es importante entender en ```K8s``` son los ```Storage Classes (sc)```, tenemos uno por default en ```minikube```.

```
$kubectl get storageclasses
$kubectl get sc

NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE  
standard (default)   k8s.io/minikube-hostpath   Delete          Immediate           false                  4d21h
```

Es un concepto avanzado en el tema de ```Volumes``` en ```Kubernetes```, pero básicamente un ```Storage Classes``` es un ```Object``` que nos permite administrar o aprovisionar el manejo de un ```Persistent Volume```. Una vez creado, no se puede modificar.

```
apiVersion: v1
kind: PersistentVolume
metadata:
  name: host-pv
spec:
  capacity:
    storage: 1Gi
  volumeMode: Filesystem
  # El Storage Class standar es el que minikube da por default.
  storageClassName: standar
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /app/story
    type: DirectoryOrCreate
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: host-pvc
spec:
  volumeName: host-pv
  accessModes:
    - ReadWriteOnce
  # El Storage Class standar es el que minikube da por default.
  storageClassName: standar
  resources:
    requests:
      storage: 1Gi
```

Ahora si aplicamos los cambios a nuestro ```Cluster```.

```
kubectl apply -f host-pv.yaml -f host-pvc.yaml -f deployment.yaml
kubectl get deployments

# Obtener Persistent Volume 
kubectl get pv

# Obtener Persistent Volume Claims
kubectl get pvc

# Eliminamos los Pods y volvemos a aplicarlos, los volumes seguirán funcionando y regresando información (<dominio>/story)
kubectl delete -f deployment.yaml
kubectl apply -f deployment.yaml
kubectl get pods
```

Lo importante de esta parte es que, el ```Persistent Volume``` se encuentra independiente de nuestros ```Pods``` y ```Worker Nodes```. Es un ```PV``` completamente independiente, para conectarnos solo usamos los ```PVC``` conectados a los ```Pods```.

Podemos con esto decir que:

En ```Kubernetes``` se le conoce como ```State``` a los datos creados y usados por nuestra aplicación que no deben de perderse. Existen diferentes tipos.
1. User-generated data, user ccounts, información que deba persistir: Recomendable usar ```PersistentVolumes```.
2. Intermediate results derived by the app, información temporal que no importa si se elimina: Recomendable usar ```Regular Volumes```.

### Usando variables de entorno

Al igual que en ```Docker```, ```K8s``` tiene la posibilidad de trabajar con variables de entorno.

En el archivo ```app.js``` ajustamos la siguiente línea.

```
# La variable STORY_FOLDER vendrá desde Kubernetes
const filePath = path.join(__dirname, process.env.STORY_FOLDER, 'text.txt');
```

Ahora debemos de especificar al ```Pod``` la variable que nuestro ```contenedor``` utiliza.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: story-deployment
spec:
  selector:
    matchLabels:
      app: story
  replicas: 2
  template:
    metadata:
      labels:
        app: story
    spec:
      containers:
        - name: story
          image: toledo1082/kub-action-02-volume-setup:2
          # Definimos las variables a nuestro POD
          env:
            - name: STORY_FOLDER # Nombre de la variable
              value: 'story' # Valor de la variable
          imagePullPolicy: Always
          volumeMounts:
            - mountPath: /app/story
              name: story-volume
      volumes:
        - name: story-volume
          persistentVolumeClaim: 
            claimName: host-pvc 
```

Ahora debemos de construir la imagen para que tome la nueva.

```
docker build -t toledo1082/kub-action-02-volume-setup:2 .
docker push toledo1082/kub-action-02-volume-setup:2

kubectl apply -f deployment.yaml

minikube service story-service
```

Veremos que la app sigue funcionando pero dentro de sí existe ya una variable llamada ```STORY_FOLDER``` la cual podemos modificar a nuestra necesidad.

Si bien funciona esta solución, también podemos definir un ```Object``` de tipo ```ConfigMap``` para definir todas las variables de entorno, podemos llamarlo ```environment.yaml```

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: data-store-env
data:
  # Definimos las variables en modo key-value
  FOLDER: 'story'
  # key: 'value'
```

Aplicamos el archivo.

```
kubectl apply -f environment.yaml
```

Ahora debemos de usar este ```configMap``` en nuestro ```deployment.yaml```.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: story-deployment
spec:
  selector:
    matchLabels:
      app: story
  replicas: 2
  template:
    metadata:
      labels:
        app: story
    spec:
      containers:
        - name: story
          image: toledo1082/kub-action-02-volume-setup:2
          # Definimos las variables a nuestro POD
          env:
            - name: STORY_FOLDER # Nombre de la variable
              # value: 'story' # Valor de la variable
              valueFrom: # La variable viende de un archivo
                configMapKeyRef: # De tipo ConfigMap
                  name: data-store-env # Nombre del ConfigMap
                  key: FOLDER # Key de la variable en ConfigMap
          imagePullPolicy: Always
          volumeMounts:
            - mountPath: /app/story
              name: story-volume
      volumes:
        - name: story-volume # 1.2. Nombre del Volume
          persistentVolumeClaim: 
            claimName: host-pvc 
```

Ahora aplicamos los cambios.

```
kubectl apply -f deployment.yaml
kubectl get pods
```

Veremos que todo sigue funcionando correctamente.

Puede conocer más sobre ```ConfigMap``` y ```Secrets``` en el siguiente [enlace](https://github.com/emmanuel-toledo/docs-docker/blob/main/09-kubernetes-bases/README.md).

