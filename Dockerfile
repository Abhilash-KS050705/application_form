# Use the official PHP image
FROM php:8.2-cli

# Set working directory
WORKDIR /app

# Copy all project files
COPY . .

# Expose Render’s required port
EXPOSE 10000

# Run PHP built-in web server
CMD ["php", "-S", "0.0.0.0:10000", "-t", "."]
