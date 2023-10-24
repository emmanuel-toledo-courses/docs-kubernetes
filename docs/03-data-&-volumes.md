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

Vamos a colocar en ```Kubernetes``` nuestra aplicación validando que todo esta limpio ```kubectl get deployments``` y creando el archivo ```deployment.yml``` y ```service.yaml```.

```
apiVersion: v1
kind: Service
metadata:
  name: story-service
spec:
  type: LoadBalancer
  selector:
    app: story
  ports:
    - protocol: "TCP"
      port: 80
      targetPort: 3000
---
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
          image: toledo1082/kub-action-02-volume-setup
          imagePullPolicy: Always
```

Ejecutamos los siguientes comandos.

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
