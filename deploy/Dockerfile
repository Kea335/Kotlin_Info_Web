# ============================================================
#  KotlinAZ — Docker imici (Nginx Alpine, ~25 MB)
#
#  Layihə kök qovluğundan işə sal:
#    docker build -f deploy/Dockerfile -t kotlinaz .
#    docker run -d -p 8080:80 --name kotlinaz kotlinaz
#
#  Sonra: http://localhost:8080
# ============================================================

FROM nginx:alpine

# Standart konfiqurasiyanı öz konfiqurasiyamızla əvəz edirik
RUN rm /etc/nginx/conf.d/default.conf
COPY deploy/docker-nginx.conf /etc/nginx/conf.d/kotlinaz.conf

# Sayt faylları — yalnız lazım olanlar
COPY index.html /usr/share/nginx/html/
COPY css/       /usr/share/nginx/html/css/
COPY js/        /usr/share/nginx/html/js/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
