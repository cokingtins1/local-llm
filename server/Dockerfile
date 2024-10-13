# Use a base image that includes Python
FROM python:3.11.4

# Set the working directory
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the server files
COPY . .

# Specify the command to run your app
CMD ["python", "server.py"]
