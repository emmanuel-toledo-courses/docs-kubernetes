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

Tenemos una nueva aplicación, consisten en 3 diferentes contenedores que trabajan con datos dummy, no con datos conectados a una base de datos.
1. Auth-API: Generar token de acceso.
2. Users-API: Login de usuarios.
3. Taks-API: Obtener una lista de task que estan alojadas en un archivo.

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

Vamos a crear nuestras configuraciones para ```Kubernetes```.

```
minikube start --driver=docker
```