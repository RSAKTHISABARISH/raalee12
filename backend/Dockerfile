# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
COPY helpdesk360.db .
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
COPY --from=build /app/helpdesk360.db helpdesk360.db
ENV SERVER_PORT=8080
ENV DB_PATH=./helpdesk360.db
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
