# Kubernetes networking

Al igual que con ```Docker```, en ```Kubernetes``` podemos definir la comunicación que tendrán nuestras apps.
Conectando Pods, Contenedores y también al mundo (www). Veremos los siguientes temas.
1. Una vista diferentes y de los ```Services```.
2. ```Pod-Internal``` Communication: Un Pod con más de un contenedor que se comuniquen estos entre sí.
3. ```Pod-to-Pod``` Communication: Comunicación de un Pod con otro Pod.

## URL's de apoyo

| Descripción | URL |
| ------------- | ------------- |

## TIL


## ResumeN

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

