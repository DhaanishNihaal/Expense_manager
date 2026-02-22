# Use lightweight Java 17 image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Give permission to mvnw
RUN chmod +x mvnw

# Build the project (skip tests for faster deploy)
RUN ./mvnw clean package -DskipTests

# Expose Spring Boot port
EXPOSE 8080

# Run the jar
CMD ["java", "-jar", "target/spring-boot-security-jwt-0.0.1-SNAPSHOT.jar"]