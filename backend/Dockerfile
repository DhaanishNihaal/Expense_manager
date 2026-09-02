# Build stage - Maven image for compilation
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml .

# Copy source code
COPY src ./src

# Build the project (skip tests for faster deploy)
RUN mvn clean package -DskipTests

# Runtime stage - lightweight Java runtime
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder /app/target/spring-boot-security-jwt-0.0.1-SNAPSHOT.jar app.jar

# Expose Spring Boot port
EXPOSE 8080

# Run the jar
CMD ["java", "-jar", "app.jar"]