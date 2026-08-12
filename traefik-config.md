# To protect an app, update an app's traefik config to the following

http:
+  middlewares:
+    gw-auth:
+      forwardAuth:
+        address: "http://<auth gateway container name>:3000/api/gateway/verify"
+        authRequestHeaders:
+          - "Cookie"
+          - "X-Forwarded-Host"
+          - "X-Forwarded-Uri"
+          - "X-Forwarded-Proto"
   routers:
     <container name of service to protect>:
       rule: Host(`<domain name of service to protect>`)
       service: <container name of service to protect>
-      middlewares: []
+      middlewares:
+        - gw-auth
       entryPoints:
         - web
   services:
     <container name of service to protect>:
       loadBalancer:
         servers:
           - url: http://<container name of service to protect>:3000
         passHostHeader: true
