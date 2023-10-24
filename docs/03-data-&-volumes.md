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


## Resumen

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

Ya vimos la creación de un ```Persistent Volume```, pero para conectarnos necesitamos definir un ```Persistent Volume Claim```.

