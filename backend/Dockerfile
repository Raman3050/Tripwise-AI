# ── Stage 1: Build ──
FROM eclipse-temurin:21-jdk-alpine AS builder
RUN apk add --no-cache maven
WORKDIR /app
COPY pom.xml ./
# Download dependencies first (cached layer)
RUN mvn dependency:go-offline -B 2>/dev/null || true
COPY src src
RUN mvn package -DskipTests -B

# ── Stage 2: Run ──
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

# Render injects the PORT env var automatically
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
