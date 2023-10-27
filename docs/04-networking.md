# Kubernetes networking

Al igual que con ```Docker```, en ```Kubernetes``` podemos definir la comunicación que tendrán nuestras apps.
Conectando Pods, Contenedores y también al mundo (www). Veremos los siguientes temas.
1. Una vista diferentes y de los ```Services```.
2. ```Pod-Internal``` Communication: Un Pod con más de un contenedor que se comuniquen estos entre sí.
3. ```Pod-to-Pod``` Communication: Comunicación de un Pod con otro Pod.

## URL's de apoyo

| Descripción | URL |
| ------------- | ------------- |
| Core DNS | https://kubernetes.io/docs/tasks/administer-cluster/coredns/ |

## TIL

Cualquier lenguaje de programación admite el concepto de trabajar con variables de entorno dadas por ```Kubernetes```.
- Node JS apps
- Angular JS
- .NET Core C#
- etc.

## Resumen

Aseguremonos de tener limpio nuestro Cluster de ```minikube```, eliminando todos los servicios, deployments, etc.

Tenemos una nueva aplicación, consisten en 3 diferentes contenedores que trabajan con datos dummy, no con datos conectados a una base de datos.
1. Auth-API: Generar token de acceso.
2. Users-API: Login de usuarios.
3. Tasks-API: Obtener una lista de task que estan alojadas en un archivo.

Nota: Recuerde generar los repos en DockerHub.
1. kub-demo-users
2. kub-demo-tasks
3. kub-demo-auth

Tendremos nuestro Cluster.
- Pod 1: Almacenará tanto al Auth-API como al Users-API, estos dos contenedores tendran una comunicación ```Pod-Internal```.
- Pod 2: Almacenará Tasks-API.
- Client: Tanto el Pod 1 como el Pod 2 estarán habilitados para admitir peticiones pero solo para ciertas rutas de los contenedores Users-API y Tasks-API. 

### kub-network-01-starting-setup

Antes que nada podemos probar la app por medio de docker.

```
docker compose up -d --build
```

Podemos probar:
1. POST: http://localhost:8080/login - { "email": "test@test.com", "password": "tester" }
2. GET: http://localhost:8000/tasks - Header: Authorization Bearer [token de login]
3. POST: http://localhost:8000/tasks - Header: Authorization Bearer [token de login] - { "text" : "A text", "title": "A title"}

El GET de tasks fallará la primera vez, solo es necesario primero insertar una tarea con el POST y funcionará correctamente el GET.

Esta aplicación no esta usando ```Volumes```, solo queremos hacer practica respecto al ```Networking```.

```
docker compose down
```

#### Deployment

Vamos a crear nuestras configuraciones para ```Kubernetes``` de un primer ```Deployment``` con el archivo ```users-deployment.yaml```.

Lo siguiente es necesario ya que Users-API necesita del Auth-API, pero no se tiene todavía listo en ```Kubernetes```.
1. Users-API, en la función ```signup``` remplazar la variable ```hashedPW```.
    - ```const hashedPW = 'dummy text';```
2. Users-API, en la función ```login``` remplazar la variable ```response```.
    - ```const response = { status: 200, data: { token: 'abc' } };```

En nuestro ```users-deployment.yaml```.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-deployment
spec:
  selector:
    matchLabels:
      app: users
  replicas: 1
  template: 
    metadata:
      labels:
        app: users
    spec:
      containers:
        - name: users
          image: toledo1082/kub-demo-users
```

Aplicamos cambios

```
minikube start --driver=docker

cd users-api/
docker build -t toledo1082/kub-demo-users .
docker push toledo1082/kub-demo-users

cd ..
cd kubernetes
kubectl apply -f users-deployment.yaml
kubectl get deployments
kubectl get pod
```

### kub-network-02-dummy-user-service

Necesitamos usar un ```Service``` para conectarnos a nuestro Users-API desde fuera del Cluster.

Recordemos que un ```Service```.
1. Da una IP estable que no cambia
2. Configurar para permitir acceso desde fuera del cluster.

#### Viendo diferente los servicios

Los tipos de Services son: 
- ClusterIP = default si no se define, dentro solo del Cluster
- NodePort = Servicio expuesto fuera del Cluster pero usa IP del Node
- LoadBalancer = Crea una IP disponible expuesta fuera del Cluster siendo independiente del Node

En el archivo ```users-service.yaml```.

```
apiVersion: v1
kind: Service
metadata:
  name: users-service
spec:
  selector:
    app: users # Pods con label 'app: users'
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 8080 # Puerto que se expone
    targetPort: 8080 # Puerto que expone el contenedor
```

Aplicamos los cambios.

```
kubectl apply -f users-service.yaml

minikube service users-service
```

El paso de ```minikube service users-service``` no es necesario en un proveedor de nube como ```Azure Kubernetes Service``` ya que ellos proveen una IP a la que nos podremos conectar.

Puede probar POST: http://127.0.0.1:63316/login o http://127.0.0.1:63316/signup.

#### Preparación comunicación Pod-Internal

Una vez listo el User-API, vamos a revertir los cambios que realizamos respecto a las variables.

Notemos que el código se comunica con el servicio ```auth```, el cual es el nombre del servicio que definimos en el ```Docker Compose```.

De esta manera no funcionará en ```Kubernetes```, por ello debemos de remplazar las URL con una variable de entorno.

```
const hashedPW = await axios.get(`http://${ process.env.AUTH_ADDRESS }/hashed-password/` + password);

const response = await axios.get(
  `http://${ process.env.AUTH_ADDRESS }/token/` + hashedPassword + '/' + password
);
```

Usando esto también podemos usarlo en nuestro Docker Compose.

```
version: "3"
services:
  auth:
    build: ./auth-api
  users:
    build: ./users-api
    # Nueva variable
    environment:
      AUTH_ADDRESS: auth
    ports: 
      - "8080:8080"
  tasks:
    build: ./tasks-api
    ports: 
      - "8000:8000"
    environment:
      TASKS_FOLDER: tasks
```

Podemos probar localmente nuestra app si es que queremos hacerlo.

No vamos a crear un nuevo ```deployment.yaml```, sino que usaremos el mismo que tenemos, esto para seguir la arquitectura que tenemos preparada, además, es la forma en la que normalmente trabaja un ```Deployment```, por uno de estos, podemos tener N ```Pods```.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-deployment
spec:
  selector:
    matchLabels:
      app: users
  replicas: 1
  template: 
    metadata:
      labels:
        app: users
    spec:
      containers:
        - name: users
          image: toledo1082/kub-demo-users:latest
        - name: auth
          image: toledo1082/kub-demo-auth:latest
```

No habilitamos un service para nuestro ```Auth-API```, ya que solo queremos que tenga acceso interno en el Cluster, el único que se expone hasta ahorita es ```Users-API```, a su vez, este al estar dentro del Cluster, se conecta al ```Auth-API```.

```
cd auth-api/
docker build -t toledo1082/kub-demo-auth .
docker push toledo1082/kub-demo-auth

cd users-api/
docker build -t toledo1082/kub-demo-users:latest .
docker push toledo1082/kub-demo-users:latest
```

La pregunta es, ¿Como identificamos al contenedor Auth-API dentro del Cluster de Kubernetes?

### kub-network-03-pod-internal

Para la cominicación ```Pod-Internal Communication``` (2 o más contenedores en un mismo Pod), Kubernetes expone la dirección localhost (del Pod), y los puertos que cada contenedor necesita para comunicarse uno a otro. Es decir:
- Auth-API: localhost:80 (o solo localhost debido al puerto)
- Users-API: localhost:8080
De esta forma se conecta un contenedor con otro siempre y cuando esten dentro del mismo ```Pod``` (```Pod-Internal Communication```).

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-deployment
spec:
  selector:
    matchLabels:
      app: users
  replicas: 1
  template: 
    metadata:
      labels:
        app: users
    spec:
      containers:
        - name: users
          image: toledo1082/kub-demo-users:latest
          # Variable de dirección a Auth-API
          env:
            - name: AUTH_ADDRESS
              value: localhost:80
        - name: auth
          image: toledo1082/kub-demo-auth:latest
```

Aplicamos los cambios.

```
minikube service users-service 
kubectl apply -f .\users-deployment.yaml
kubectl get pods

NAME                                READY   STATUS        RESTARTS        AGE
users-deployment-7d5f999c4d-gtlw5   2/2     Running       0               8s
```

Vemos un Pod, pero 2/2 contenedores ejecutandose correctamente (Auth-API y Users-API).

Podemos probar las rutas como las siguientes.
- POST: http://127.0.0.1:61506/signup
- POST: http://127.0.0.1:61506/login

#### Creando multiples Deployments

Con fines practicos vimos como trabjar con ```Pod-Internal Communication```, pero va a ser necesario asegurarnos que el Auth-API quede completamente bloqueado al acceso publico, para ello tenemos que dividir cada API en un ```Pod``` diferente.

1. User-API -> ```Pod to Pod``` -> Auth-API
2. Task-API -> ```Pod to Pod``` -> Auth-API

Creamos un archivo ```auth-deployment.yaml```.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-deployment
spec:
  selector:
    matchLabels:
      app: auth
  replicas: 1
  template: 
    metadata:
      labels:
        app: auth
    spec:
      containers:
        - name: auth
          image: toledo1082/kub-demo-auth:latest
```

Creamos un archivo ```auth-service.yaml```.

```
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth # Pods con label 'app: auth'
  type: ClusterIP # Acceso solo dentro del Cluster no al mundo exterior 
  ports:
  - protocol: TCP
    port: 80 # Puerto que se expone
    targetPort: 80 # Puerto que expone el contenedor
```

Es necesario modificar la dirección a la que se conectará el User-API para nuestro Auth-API en el ```user-deployment.yaml```.

Una forma es hacer lo siguiente.

```
kubectl apply -f .\auth-deployment.yaml -f .\auth-service.yaml

kubectl get services
NAME            TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
auth-service    ClusterIP      10.99.1.155     <none>        80/TCP           6s
kubernetes      ClusterIP      10.96.0.1       <none>        443/TCP          6d23h
users-service   LoadBalancer   10.106.133.96   <pending>     8080:31061/TCP   27h
```

Usaríamos la IP del auth-service.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-deployment
spec:
  selector:
    matchLabels:
      app: users
  replicas: 1
  template: 
    metadata:
      labels:
        app: users
    spec:
      containers:
        - name: users
          image: toledo1082/kub-demo-users:latest
          env:
            - name: AUTH_ADDRESS
              value: "10.99.1.155"
```

Aplicamos los cambios.

```
kubectl apply -f .\users-deployment.yaml
```

Veremos que todo funciona correctamente porque hacemos uso de la dirección IP, pero esto podría ser un tanto molesto tener que hacer este procedimiento, aunque la IP no cambie, es molesto hacerlo.

```Kubernetes``` nos da la posibilidad de hacerlo de forma automatica, ya que genera de forma predefinia variables de entorno con las direcciones IP de cada servicio que necesitamos, en nuestro código, vamos a remplazar la línea ```process.env.AUTH_ADDRESS``` por, ```process.env.AUTH_SERVICE_SERVICE_HOST``` (solo en el login para ver como funciona tanto la forma "manual" como la automatica).

Cada que queremos acceder a una dirección IP de un servicio en ```Kubernetes``` usando variables de entorno en ```NodeJS```, usamos el nombre del servicio (cambiando los - por _), seguido de la palabra SERVICE_HOST.
- AUTH_SERVICE_SERVICE_HOST
- USERS_SERVICE_SERVICE_HOST
- TASKS_SERVICE_SERVICE_HOST
- etc...

Si trabaja con Docker Compose y enviando variables de entorno, recuerde renombrar las variables en su archivo Docker Compose.

```
cd .\users-api\
docker build -t toledo1082/kub-demo-users .
docker push toledo1082/kub-demo-users

cd kubernetes
kubectl delete -f users-deployment.yaml
kubectl apply -f users-deployment.yaml

kubectl get pods
```

Todo nuestro código debe de estar funcionando correctamente tanto para.
- POST: Login
- POST: Signup

### kub-network-04-automatic-domain-names

El concepto de variables de entorno que vimos antes esta disponible en más de un lenguaje de programación.

#### Usando DNS para comunicación Pod-to-Pod

Hay otra forma de tener comunicación entre Pods adicional a los que vimos antes.

```Kubernetes``` viene integrado con un servicio llamado ```CoreDNS```, que al igual que con un ```ClusterIP```, tenemos un servicio ```DNS``` interno en nuestro Cluster, si lo intentamos consultar en el web no lo encontrará ya que solo vive dentro de nuestro Cluster.

Al igual que en ```Docker Compose```, el dominio o acceso a nuestro Servicio de ```Kubernetes``` será el mismo nombre del Servicio que establecimos. Adicionalmente debemos de agregar en ```namespace``` al que pertenece nuestro servicio.

Un ```Namespace``` en ```Kubernetes``` es una forma de agrupar los recursos que tenemos en nuestro ```Cluster```, puede ser por ejemplo por:
- Proyecto
- Tipo de recurso
- etc.

```
kubectl get namespaces

NAME              STATUS   AGE
default           Active   7d
kube-node-lease   Active   7d
kube-public       Active   7d
kube-system       Active   7d
```

En este caso no usamos ningún ```namespace```, por ende solo seleccionamos el ```default```. En el ```user-deployment.yaml```.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: users-deployment
spec:
  selector:
    matchLabels:
      app: users
  replicas: 1
  template: 
    metadata:
      labels:
        app: users
    spec:
      containers:
        - name: users
          image: toledo1082/kub-demo-users:latest
          env:
            - name: AUTH_ADDRESS
              # value: "10.99.1.155"
              # Nombre del servicio: auth-service
              # Nombre del namespaces: default
              value: "auth-service.default"
```

Aplicamos los cambios y tenemos que ver que todo funciona correctamente.

```
kubectl apply -f users-deployment.yaml
```

#### Mejor opción

Tenemos 3 diferentes opciones.
1. Si es conexión Pod to Pod usar dirección localhost y puerto.
2. Usar IP generada por nuestro Cluster desde un service tipo ClusterIP.
3. Usar el nombre de dominio de nuestro servicio.

Dependiendo el caso, usualmente la última es la más común ya que es facil de recordar.

#### Configurar Tasks-API 

Ahora vamos a configurar nuestro Tasks-API tanto para tener comunicación externa fuera del cluster, como para conectarse a nuestro Auth-API.

Ver configuración de variables en ```Tasks-API```. Cargamos imagen a Docker Hub.

```
cd tasks-api
docker build -t toledo1082/kub-demo-tasks .
docker push toledo1082/kub-demo-tasks
```

```tasks-deployment.ymal```.

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tasks-deployment
spec:
  selector:
    matchLabels:
      app: tasks
  replicas: 1
  template:
    metadata:
      labels:
        app: tasks
    spec:
      # Volume de carpeta tasks
      volumes:
        - name: tasks-volume
          emptyDir: {}
      containers:
        - name: tasks
          image: toledo1082/kub-demo-tasks:latest
          env:
            - name: TASKS_FOLDER
              value: "tasks"
          # Volume de carpeta tasks
          volumeMounts:
            - mountPath: /app/tasks # Ubicación de folder tasks que se quedará almacenado
              name: tasks-volume
```

```tasks-service.yaml```.

```
apiVersion: v1
kind: Service
metadata:
  name: tasks-service
spec:
  selector:
    app: tasks
  ports:
    - protocol: TCP
      port: 8000
      targetPort: 8000
  type: LoadBalancer
```

Aplicamos los cambios al Cluster.

```
kubectl apply -f tasks-deployment.yaml -f tasks-service.yaml
kubectl get deployments
kubectl get services
kubectl get pods
minikube service tasks-service
```

Tanto el POST como el GET funcionarán correctamente.

- POST: http://127.0.0.1:63574/tasks - { "text": "A text", "title": "A title" } - Header: Authorization Bearer [token de login]
- GET: http://127.0.0.1:63574/tasks - Header: Authorization Bearer [token de login]

