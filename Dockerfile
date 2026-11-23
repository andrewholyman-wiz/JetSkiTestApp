FROM public.ecr.aws/docker/library/nginx:alpine

ARG BUILD_NUMBER=dev
ARG GIT_COMMIT=local

COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html /usr/share/nginx/html/index.html

RUN sed -i "s/__BUILD_NUMBER__/${BUILD_NUMBER}/g; s/__GIT_COMMIT__/${GIT_COMMIT}/g" /usr/share/nginx/html/index.html \
    && chown -R 101:101 /usr/share/nginx/html /etc/nginx/nginx.conf

USER 101:101
EXPOSE 8080

ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
