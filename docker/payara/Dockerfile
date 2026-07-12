# Tag verificado en Docker Hub (hub.docker.com/r/payara/server-full) al
# momento de escribir esto: 7.2026.5-jdk25. Si al hacer el build da error de
# "manifest not found", revisar la pestaña Tags del repo por si ya hay una
# versión más nueva.
FROM payara/server-full:7.2026.5-jdk25

# La imagen expone $DEPLOY_DIR como carpeta de autodeploy; todo .war copiado
# ahí se despliega automáticamente al arrancar el contenedor.
COPY backend_api.war ${DEPLOY_DIR}/
